// Server/Server/Services/Nmi/Models.cs
namespace Server.Services.Nmi;

public record NmiCheckoutRequest(
    Guid OrderId,
    string OrderNumber,
    decimal Amount,
    string Currency,
    string SuccessUrl,
    string CancelUrl,
    IReadOnlyCollection<NmiCheckoutLineItem> Items);

public record NmiCheckoutLineItem(string Sku, int Quantity, decimal UnitAmount);

public record NmiCheckoutResponse(string CheckoutId, string? CheckoutUrl);

public record NmiTransactionDetails(
    string TransactionId,
    decimal Amount,
    string Currency,
    string Status);