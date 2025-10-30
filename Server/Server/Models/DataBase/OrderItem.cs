// Server/Server/Models/DataBase/OrderItem.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models.DataBase;

public class OrderItem
{
    [Key]
    public int Id { get; set; }

    public Guid OrderId { get; set; }

    public Order Order { get; set; } = null!;

    [Column(TypeName = "varchar(50)")]
    public required string ProductId { get; set; }

    [Column(TypeName = "varchar(128)")]
    public required string NmiSku { get; set; }

    [Column(TypeName = "varchar(100)")]
    public required string Name { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitAmount { get; set; }

    public int Credits { get; set; }
}