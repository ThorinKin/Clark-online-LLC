// Server/Server/Models/DataBase/Order.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models.DataBase;

public class Order
{
	public Order()
	{
		Id = Guid.NewGuid();
		OrderNumber = $"ORD-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}";
		CreatedAt = DateTimeOffset.UtcNow;
		Currency = "USD";
	}

	[Key]
	public Guid Id { get; set; }

	[Column(TypeName = "varchar(64)")]
	public string OrderNumber { get; set; }

	[Column(TypeName = "varchar(50)")]
	public required string UserId { get; set; }

	[Column(TypeName = "decimal(18,2)")]
	public decimal TotalAmount { get; set; }

	[Column(TypeName = "varchar(8)")]
	public string Currency { get; set; }

	public int TotalCredits { get; set; }

	[Column(TypeName = "varchar(128)")]
	public string? CollectCheckoutId { get; set; }

	[Column(TypeName = "varchar(128)")]
	public string? CheckoutUrl { get; set; }

	[Column(TypeName = "varchar(128)")]
	public string? TransactionId { get; set; }

	public OrderStatus Status { get; set; } = OrderStatus.Pending;

	public DateTimeOffset CreatedAt { get; set; }

	public DateTimeOffset? UpdatedAt { get; set; }

	public DateTimeOffset? PaidAt { get; set; }

	[Column(TypeName = "varchar(256)")]
	public string? FailureReason { get; set; }

	public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}