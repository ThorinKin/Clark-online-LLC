using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AuthorizeNet;
using AuthorizeNet.Api.Controllers;
using AuthorizeNet.Api.Controllers.Bases;
using AuthorizeNet.Api.Contracts.V1;
using Microsoft.Extensions.Options;

namespace Server.Payments;

public record AuthorizeNetLineItem(string ItemId, string Name, decimal UnitPrice, int Quantity);

public record HostedPaymentSession(string Token, string PaymentUrl);

public record TransactionDetails(string TransactionId, string InvoiceNumber, decimal Amount, string Status);

public interface IAuthorizeNetClient
{
    Task<HostedPaymentSession> CreateHostedPaymentSessionAsync(
        string invoiceNumber,
        decimal amount,
        IEnumerable<AuthorizeNetLineItem> items,
        Uri returnUrl,
        Uri cancelUrl,
        CancellationToken cancellationToken = default);

    Task<TransactionDetails?> GetTransactionDetailsAsync(
        string transactionId,
        CancellationToken cancellationToken = default);

    bool ValidateSignature(string payload, string? signatureHeader);
}

public class AuthorizeNetClient : IAuthorizeNetClient
{
    private static readonly HashSet<string> PlaceholderValues = new(
    new[]
    {
            "YOUR_API_LOGIN_ID",
            "YOUR_TRANSACTION_KEY",
            "YOUR_SIGNATURE_KEY"
    },
    StringComparer.OrdinalIgnoreCase);
    private readonly AuthorizeNetOptions _options;
    private readonly ILogger<AuthorizeNetClient> _logger;

    public AuthorizeNetClient(IOptions<AuthorizeNetOptions> options, ILogger<AuthorizeNetClient> logger)
    {
        if (options == null)
        {
            throw new ArgumentNullException(nameof(options));
        }

        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        var value = options.Value ?? throw new InvalidOperationException("Authorize.net configuration is missing.");

        var environment = Normalize(value.Environment);
        if (string.IsNullOrEmpty(environment))
        {
            environment = "sandbox";
        }

        var paymentFormUrl = Normalize(value.PaymentFormUrl);
        if (string.IsNullOrEmpty(paymentFormUrl))
        {
            paymentFormUrl = "https://accept.authorize.net/payment/payment";
        }

        _options = new AuthorizeNetOptions
        {
            ApiLoginId = Normalize(value.ApiLoginId),
            TransactionKey = Normalize(value.TransactionKey),
            SignatureKey = Normalize(value.SignatureKey),
            WebhookSignatureKey = Normalize(value.WebhookSignatureKey),
            Environment = environment,
            PaymentFormUrl = paymentFormUrl
        };
    }

    private static string Normalize(string? value) => (value ?? string.Empty).Trim();

    private static bool IsMissing(string? value)
    {
        var normalized = Normalize(value);
        return string.IsNullOrEmpty(normalized) || PlaceholderValues.Contains(normalized);
    }

    private merchantAuthenticationType CreateMerchantAuthentication()
    {
        var apiLoginId = _options.ApiLoginId;
        var transactionKey = _options.TransactionKey;

        if (IsMissing(apiLoginId) || IsMissing(transactionKey))
        {
            var missing = new List<string>();

            if (IsMissing(apiLoginId))
            {
                missing.Add(nameof(_options.ApiLoginId));
            }

            if (IsMissing(transactionKey))
            {
                missing.Add(nameof(_options.TransactionKey));
            }

            var message = $"Authorize.net credentials are not configured ({string.Join(", ", missing)}).";
            _logger.LogError(message);
            throw new InvalidOperationException(message);
        }

        return new merchantAuthenticationType
        {
            name = apiLoginId,
            ItemElementName = ItemChoiceType.transactionKey,
            Item = transactionKey
        };
    }

    private void PrepareEnvironment()
    {
        var env = string.Equals(_options.Environment, "production", StringComparison.OrdinalIgnoreCase)
            ? AuthorizeNet.Environment.PRODUCTION
            : AuthorizeNet.Environment.SANDBOX;

        ApiOperationBase<ANetApiRequest, ANetApiResponse>.RunEnvironment = env;
        ApiOperationBase<ANetApiRequest, ANetApiResponse>.MerchantAuthentication = CreateMerchantAuthentication();
    }

    public Task<HostedPaymentSession> CreateHostedPaymentSessionAsync(
        string invoiceNumber,
        decimal amount,
        IEnumerable<AuthorizeNetLineItem> items,
        Uri returnUrl,
        Uri cancelUrl,
        CancellationToken cancellationToken = default)
    {
        PrepareEnvironment();

        var transactionRequest = new transactionRequestType
        {
            transactionType = transactionTypeEnum.authCaptureTransaction.ToString(),
            amount = amount,
            order = new orderType
            {
                invoiceNumber = invoiceNumber,
                description = $"Credit purchase {invoiceNumber}"
            },
            lineItems = items.Select(item => new lineItemType
            {
                itemId = item.ItemId.Length > 31 ? item.ItemId[..31] : item.ItemId,
                name = item.Name.Length > 31 ? item.Name[..31] : item.Name,
                quantity = item.Quantity,
                unitPrice = item.UnitPrice
            }).ToArray()
        };

        var settings = new List<settingType>
        {
            new()
            {
                settingName = "hostedPaymentReturnOptions",
                settingValue = JsonSerializer.Serialize(new
                {
                    showReceipt = false,
                    url = returnUrl.ToString(),
                    urlText = "Continue",
                    cancelUrl = cancelUrl.ToString(),
                    cancelUrlText = "Cancel"
                })
            },
            new()
            {
                settingName = "hostedPaymentOrderOptions",
                settingValue = JsonSerializer.Serialize(new { show = true })
            },
            new()
            {
                settingName = "hostedPaymentPaymentOptions",
                settingValue = JsonSerializer.Serialize(new { cardCodeRequired = true })
            },
            new()
            {
                settingName = "hostedPaymentSecurityOptions",
                settingValue = JsonSerializer.Serialize(new { captcha = false })
            },
            new()
            {
                settingName = "hostedPaymentBillingAddressOptions",
                settingValue = JsonSerializer.Serialize(new { show = true, required = true })
            },
            new()
            {
                settingName = "hostedPaymentCustomerOptions",
                settingValue = JsonSerializer.Serialize(new { showEmail = true, requiredEmail = true })
            }
        };

        var request = new getHostedPaymentPageRequest
        {
            merchantAuthentication = CreateMerchantAuthentication(),
            transactionRequest = transactionRequest,
            hostedPaymentSettings = settings.ToArray(),
            refId = invoiceNumber
        };

        var controller = new getHostedPaymentPageController(request);
        controller.Execute();
        var response = controller.GetApiResponse();

        if (response == null || response.messages?.resultCode != messageTypeEnum.Ok)
        {
            var errorText = response?.messages?.message?.FirstOrDefault()?.text
                ?? controller.GetErrorResponse()?.messages?.message?.FirstOrDefault()?.text
                ?? "Failed to create hosted payment session.";
            _logger.LogError("Authorize.net hosted payment creation failed: {Message}", errorText);
            throw new InvalidOperationException(errorText);
        }

        return Task.FromResult(new HostedPaymentSession(response.token, _options.PaymentFormUrl));
    }

    public Task<TransactionDetails?> GetTransactionDetailsAsync(
        string transactionId,
        CancellationToken cancellationToken = default)
    {
        PrepareEnvironment();

        var request = new getTransactionDetailsRequest
        {
            merchantAuthentication = CreateMerchantAuthentication(),
            transId = transactionId
        };

        var controller = new getTransactionDetailsController(request);
        controller.Execute();
        var response = controller.GetApiResponse();

        if (response == null || response.messages?.resultCode != messageTypeEnum.Ok)
        {
            var errorText = response?.messages?.message?.FirstOrDefault()?.text
                ?? controller.GetErrorResponse()?.messages?.message?.FirstOrDefault()?.text
                ?? "Failed to retrieve transaction details.";
            _logger.LogWarning("Authorize.net transaction query failed: {Message}", errorText);
            return null;
        }

        return Task.FromResult<TransactionDetails?>(new TransactionDetails(
            response.transaction?.transId ?? transactionId,
            response.transaction?.order?.invoiceNumber ?? string.Empty,
            response.transaction?.authAmount ?? 0m,
            response.transaction?.transactionStatus ?? string.Empty
        ));
    }

    public bool ValidateSignature(string payload, string? signatureHeader)
    {
        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            _logger.LogWarning("Missing Authorize.net signature header.");
            return false;
        }

        var signatureKey = Normalize(_options.WebhookSignatureKey);
        if (IsMissing(signatureKey))
        {
            signatureKey = Normalize(_options.SignatureKey);

            if (IsMissing(signatureKey))
            {
                _logger.LogWarning("Webhook signature key not configured. Rejecting webhook.");
                return false;
            }
        }

        const string prefix = "sha512=";
        if (!signatureHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Unexpected Authorize.net signature format: {Header}", signatureHeader);
            return false;
        }

        byte[] signatureBytes;
        try
        {
            signatureBytes = Convert.FromHexString(signatureKey);
        }
        catch (FormatException ex)
        {
            _logger.LogWarning(ex, "Invalid Authorize.net signature key format.");
            return false;
        }
        using var hmac = new HMACSHA512(signatureBytes);
        var computed = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computedHex = Convert.ToHexString(computed).ToLowerInvariant();
        var expected = prefix + computedHex;

        var isValid = string.Equals(expected, signatureHeader, StringComparison.OrdinalIgnoreCase);
        if (!isValid)
        {
            _logger.LogWarning("Authorize.net webhook signature mismatch. Expected {Expected} but received {Actual}.", expected, signatureHeader);
        }

        return isValid;
    }
}