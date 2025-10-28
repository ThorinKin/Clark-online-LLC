namespace Server.Models.DataBase;

public class PaymentTransaction
{
	public Guid Id { get; set; } = Guid.NewGuid();
	public string InvoiceNumber { get; set; } = string.Empty;
	public string UserId { get; set; } = string.Empty;
	public decimal Amount { get; set; }
	public string Currency { get; set; } = "USD";
	public int Credits { get; set; }
	public string Status { get; set; } = PaymentTransactionStatus.Pending;
	public string? GatewayTransactionId { get; set; }
	public string? HostedPaymentToken { get; set; }
	public string ItemsJson { get; set; } = string.Empty;
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public static class PaymentTransactionStatus
{
	public const string Pending = "pending";
	public const string Completed = "completed";
	public const string Failed = "failed";
	public const string Cancelled = "cancelled";
}