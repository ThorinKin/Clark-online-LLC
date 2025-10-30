// Server/Server/Services/Nmi/NmiClient.cs
using System;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Server.Options;

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
            success_url = request.SuccessUrl,
            cancel_url = request.CancelUrl,
            line_items = request.Items.Select(item => new
            {
                sku = item.Sku,
                quantity = item.Quantity,
            }),
            metadata = new
            {
                order_id = request.OrderId,
                order_number = request.OrderNumber
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

        var requestPayload = new
        {
            transaction_id = transactionId
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _options.TransactionLookupEndpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(requestPayload, SerializerOptions), Encoding.UTF8, "application/json")
        };

        ApplyAuthentication(httpRequest);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Failed to query transaction {TransactionId}. Status: {StatusCode}, Body: {Body}", transactionId, response.StatusCode, errorBody);
            throw new InvalidOperationException("Unable to query transaction status from NMI");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = document.RootElement;

        var amount = root.TryGetProperty("amount", out var amountProperty) && decimal.TryParse(amountProperty.GetString(), out var parsedAmount)
            ? parsedAmount
            : 0m;

        var currency = root.TryGetProperty("currency", out var currencyProperty)
            ? currencyProperty.GetString() ?? "USD"
            : "USD";

        var status = root.TryGetProperty("status", out var statusProperty)
            ? statusProperty.GetString() ?? "unknown"
            : "unknown";

        return new NmiTransactionDetails(transactionId, amount, currency, status);
    }

    private void ApplyAuthentication(HttpRequestMessage request)
    {
        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.PrivateApiKey}:"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", token);
    }
}