// Server/Server/Models/DataBase/OrderStatus.cs
namespace Server.Models.DataBase;

public enum OrderStatus
{
    Pending = 0,
    AwaitingPayment = 1,
    Paid = 2,
    Failed = 3,
    Cancelled = 4
}