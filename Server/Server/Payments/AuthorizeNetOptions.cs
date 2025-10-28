namespace Server.Payments;

public class AuthorizeNetOptions
{
    public string ApiLoginId { get; init; } = string.Empty;
    public string TransactionKey { get; init; } = string.Empty;
    public string? SignatureKey { get; init; }
    public string? WebhookSignatureKey { get; init; }
    public string Environment { get; init; } = "sandbox";
    public string PaymentFormUrl { get; init; } = "https://accept.authorize.net/payment/payment";
}