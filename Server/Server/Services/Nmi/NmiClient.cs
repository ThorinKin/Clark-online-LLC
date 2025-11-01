// Server/Server/Services/Nmi/NmiClient.cs
using System;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Server.Options;
using System.Xml.Linq;

namespace Server.Services.Nmi;

public interface INmiClient
{
    Task<NmiCheckoutResponse> CreateCheckoutAsync(NmiCheckoutRequest request, CancellationToken cancellationToken = default);

    Task<NmiTransactionDetails> GetTransactionAsync(string transactionId, CancellationToken cancellationToken = default);
}

public class NmiClient : INmiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NmiClient> _logger;
    private readonly NmiOptions _options;

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public NmiClient(HttpClient httpClient, IOptions<NmiOptions> options, ILogger<NmiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _options = options.Value;
    }

    private bool IsStubMode => string.IsNullOrWhiteSpace(_options.PrivateApiKey);

    public async Task<NmiCheckoutResponse> CreateCheckoutAsync(NmiCheckoutRequest request, CancellationToken cancellationToken = default)
    {
        if (IsStubMode)
        {
            _logger.LogWarning("NMI private key not configured. Using stub checkout for order {OrderId}", request.OrderId);
            var stubTransactionId = $"stub-{Guid.NewGuid():N}";
            var redirectUrl = request.SuccessUrl;

            if (!string.IsNullOrWhiteSpace(redirectUrl))
            {
                if (redirectUrl.Contains("(TRANSACTION_ID)", StringComparison.OrdinalIgnoreCase))
                {
                    redirectUrl = redirectUrl.Replace("(TRANSACTION_ID)", stubTransactionId, StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    var separator = redirectUrl.Contains('?') ? '&' : '?';
                    redirectUrl = $"{redirectUrl}{separator}t={stubTransactionId}";
                }
            }

            return new NmiCheckoutResponse($"stub-{request.OrderId:N}", redirectUrl);
        }

        var payload = new
        {
            successUrl = request.SuccessUrl,
            cancelUrl = request.CancelUrl,
            lineItems = request.Items.Select(item => new
            {
                item.Sku,
                item.Quantity
            }),
            metadata = new
            {
                orderId = request.OrderId,
                orderNumber = request.OrderNumber
            }
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _options.CheckoutEndpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, SerializerOptions), Encoding.UTF8, "application/json")
        };

        ApplyAuthentication(httpRequest);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Failed to create NMI checkout. Status: {StatusCode}, Body: {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException("NMI checkout request failed");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = document.RootElement;

        var checkoutId = root.TryGetProperty("checkout_id", out var idProperty)
            ? idProperty.GetString()
            : root.TryGetProperty("id", out var fallbackId) ? fallbackId.GetString() : null;

        var checkoutUrl = root.TryGetProperty("checkout_url", out var urlProperty)
            ? urlProperty.GetString()
            : root.TryGetProperty("hosted_payment_page_url", out var hosted) ? hosted.GetString() : null;

        if (string.IsNullOrWhiteSpace(checkoutId))
        {
            throw new InvalidOperationException("NMI checkout response missing checkout_id");
        }

        return new NmiCheckoutResponse(checkoutId!, checkoutUrl);
    }

    public async Task<NmiTransactionDetails> GetTransactionAsync(string transactionId, CancellationToken cancellationToken = default)
    {
        if (IsStubMode)
        {
            _logger.LogWarning("NMI private key not configured. Assuming transaction {TransactionId} approved", transactionId);
            return new NmiTransactionDetails(transactionId, 0m, "USD", "approved");
        }
        // 1) 绝对 URL，绕过 BaseAddress 
        var endpoint = _options.TransactionLookupEndpoint?.StartsWith("http", StringComparison.OrdinalIgnoreCase) == true
            ? new Uri(_options.TransactionLookupEndpoint)
            : new Uri(new Uri(_options.BaseUrl, UriKind.Absolute), _options.TransactionLookupEndpoint ?? "/api/query.php");

        // 2) 表单参数
        var form = new Dictionary<string, string>
        {
            ["security_key"] = _options.PrivateApiKey ?? string.Empty,
            ["transaction_id"] = transactionId,
            ["report_type"] = "transaction",
            ["ver"] = "2",
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new FormUrlEncodedContent(form)
        };

        // 3) 不带 Basic/Auth 头
        req.Headers.Authorization = null;

        _logger.LogInformation("NMI query START url={Url} tid={Tid} key_len={KeyLen}",
            req.RequestUri, transactionId, _options.PrivateApiKey?.Length ?? 0);

        using var res = await _httpClient.SendAsync(req, cancellationToken);
        var raw = await res.Content.ReadAsStringAsync(cancellationToken);

        _logger.LogInformation("NMI query DONE status={Status} body_snip={Snip}",
            (int)res.StatusCode, raw?.Substring(0, Math.Min(400, raw.Length)));

        if (!res.IsSuccessStatusCode || string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException("Unable to query transaction status from NMI");

        // 4) 解析 XML
        try
        {
            var x = System.Xml.Linq.XDocument.Parse(raw);

            static string ReadPath(System.Xml.Linq.XDocument doc, params string[] nodes)
            {
                IEnumerable<System.Xml.Linq.XElement> cur = new[] { doc.Root! };
                foreach (var n in nodes) cur = cur.SelectMany(e => e.Descendants(n));
                return cur.FirstOrDefault()?.Value?.Trim() ?? string.Empty;
            }

            var responseCode = ReadPath(x, "transaction", "action", "response_code"); // 100 成功
            var amountStr = ReadPath(x, "transaction", "action", "amount");
            var currency = ReadPath(x, "transaction", "currency");
            if (string.IsNullOrEmpty(currency)) currency = "USD";

            decimal amount = 0m;
            decimal.TryParse(amountStr, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out amount);

            var status = responseCode == "100" ? "approved" : "declined";
            return new NmiTransactionDetails(transactionId, amount, currency, status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse NMI query response for {TransactionId}. Raw: {Raw}", transactionId, raw);
            throw new InvalidOperationException("Unable to parse transaction status from NMI");
        }
    }

    private void ApplyAuthentication(HttpRequestMessage request)
    {
        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.PrivateApiKey}:"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", token);
    }
}