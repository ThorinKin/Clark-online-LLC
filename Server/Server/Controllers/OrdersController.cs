// Server/Server/Controllers/OrdersController.cs
using KarXT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.Models.DataBase;
using Server.Options;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Primitives;
using Server.Services;
using Server.Services.Nmi;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICreditService _creditService;
    private readonly INmiClient _nmiClient;
    private readonly ILogger<OrdersController> _logger;
    private readonly NmiOptions _nmiOptions;

    public OrdersController(
        AppDbContext context,
        ICreditService creditService,
        INmiClient nmiClient,
        IOptions<NmiOptions> nmiOptions,
        ILogger<OrdersController> logger)
    {
        _context = context;
        _creditService = creditService;
        _nmiClient = nmiClient;
        _logger = logger;
        _nmiOptions = nmiOptions.Value;
    }

    /// 方案一（弃用）：由服务器创建 NMI Checkout
    [HttpPost]
    public async Task<MessageModel<CreateOrderResponse>> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return MessageHelp.Error<CreateOrderResponse>("Missing user identity", response: null, Code: 401);
        }

        if (request.Items is null || request.Items.Count == 0)
        {
            return MessageHelp.Error<CreateOrderResponse>("Cart is empty", response: null, Code: 400);
        }

        var userExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!userExists)
        {
            return MessageHelp.Error<CreateOrderResponse>("User not found", response: null, Code: 404);
        }

        var currency = request.Items.Select(i => i.Currency ?? "USD").Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (currency.Count != 1)
        {
            return MessageHelp.Error<CreateOrderResponse>("All items must use the same currency", response: null, Code: 400);
        }

        var normalizedCurrency = currency[0].ToUpperInvariant();
        if (!string.Equals(normalizedCurrency, "USD", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Received order in unsupported currency {Currency}. Proceeding but expected USD.", normalizedCurrency);
        }

        var order = new Order
        {
            UserId = userId,
            Currency = normalizedCurrency,
            Status = OrderStatus.AwaitingPayment
        };

        foreach (var item in request.Items)
        {
            if (string.IsNullOrWhiteSpace(item.Id) || string.IsNullOrWhiteSpace(item.NmiSku))
            {
                return MessageHelp.Error<CreateOrderResponse>("Invalid cart item", response: null, Code: 400);
            }

            var quantity = item.Quantity <= 0 ? 1 : item.Quantity;
            var unitAmount = item.UnitAmount < 0 ? 0 : item.UnitAmount;

            order.Items.Add(new OrderItem
            {
                ProductId = item.Id,
                NmiSku = item.NmiSku,
                Name = item.Name,
                Quantity = quantity,
                UnitAmount = unitAmount,
                Credits = item.Credits
            });

            order.TotalAmount += unitAmount * quantity;
            order.TotalCredits += item.Credits * quantity;
        }

        order.CreatedAt = DateTimeOffset.UtcNow;

        await _context.Orders.AddAsync(order, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var successUrlBase = string.IsNullOrWhiteSpace(request.SuccessUrl) ? _nmiOptions.SuccessUrlTemplate : request.SuccessUrl;
        var cancelUrlBase = string.IsNullOrWhiteSpace(request.CancelUrl) ? _nmiOptions.CancelUrlTemplate : request.CancelUrl;

        var successUrl = BuildCallbackUrl(successUrlBase, order.Id, includeTransactionPlaceholder: true);
        var cancelUrl = BuildCallbackUrl(cancelUrlBase, order.Id, includeTransactionPlaceholder: false);

        var checkoutRequest = new NmiCheckoutRequest(
            order.Id,
            order.OrderNumber,
            order.TotalAmount,
            order.Currency,
            successUrl,
            cancelUrl,
            order.Items.Select(i => new NmiCheckoutLineItem(i.NmiSku, i.Quantity, i.UnitAmount)).ToList()
        );

        var checkoutResponse = await _nmiClient.CreateCheckoutAsync(checkoutRequest, cancellationToken);

        order.CollectCheckoutId = checkoutResponse.CheckoutId;
        order.CheckoutUrl = checkoutResponse.CheckoutUrl;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var responsePayload = new CreateOrderResponse
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            CheckoutId = checkoutResponse.CheckoutId,
            CheckoutUrl = checkoutResponse.CheckoutUrl,
        };

        return MessageHelp.Success(responsePayload);
    }

    /// 方案二：仅在站内预创建订单（不调用 NMI），返回 GUID 供 success/cancel URL 使用。
    /// 用于“前端 Collect Checkout 脚本直连创建购物车并跳转”的流程。
    [HttpPost("pending")]
    public async Task<MessageModel<CreateOrderResponse>> CreatePending([FromBody] PendingOrderRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return MessageHelp.Error<CreateOrderResponse>("Missing user identity", response: null, Code: 401);
        }

        if (request.Items is null || request.Items.Count == 0)
        {
            return MessageHelp.Error<CreateOrderResponse>("Cart is empty", response: null, Code: 400);
        }

        var userExists = await _context.Users.AnyAsync(u => u.Id == userId, ct);
        if (!userExists)
        {
            return MessageHelp.Error<CreateOrderResponse>("User not found", response: null, Code: 404);
        }

        var currency = request.Items.Select(i => i.Currency ?? "USD").Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (currency.Count != 1)
        {
            return MessageHelp.Error<CreateOrderResponse>("All items must use the same currency", response: null, Code: 400);
        }

        var normalizedCurrency = (currency.FirstOrDefault() ?? "USD").ToUpperInvariant();

        var order = new Order
        {
            UserId = userId,
            Currency = normalizedCurrency,
            Status = OrderStatus.AwaitingPayment,
            CreatedAt = DateTimeOffset.UtcNow
        };

        foreach (var i in request.Items)
        {
            var q = i.Quantity <= 0 ? 1 : i.Quantity;
            var amt = i.UnitAmount < 0 ? 0 : i.UnitAmount;

            order.Items.Add(new OrderItem
            {
                ProductId = i.Id,
                NmiSku = i.NmiSku,
                Name = i.Name,
                Quantity = q,
                UnitAmount = amt,
                Credits = i.Credits
            });

            order.TotalAmount += amt * q;
            order.TotalCredits += i.Credits * q;
        }

        await _context.Orders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);

        return MessageHelp.Success(new CreateOrderResponse
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber
            // 不返回 CheckoutUrl；由前端脚本直连 NMI 并跳转
        });
    }

    [HttpPost("{orderId:guid}/confirm")]
    public async Task<MessageModel<ConfirmOrderResponse>> ConfirmOrder(Guid orderId, [FromBody] ConfirmOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return MessageHelp.Error<ConfirmOrderResponse>("Missing user identity", response: null, Code: 401);
        }

        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
        {
            return MessageHelp.Error<ConfirmOrderResponse>("Order not found", response: null, Code: 404);
        }

        if (!string.Equals(order.UserId, userId, StringComparison.Ordinal))
        {
            return MessageHelp.Error<ConfirmOrderResponse>("Order does not belong to current user", response: null, Code: 403);
        }

        if (order.Status == OrderStatus.Paid)
        {
            if (!string.IsNullOrWhiteSpace(order.TransactionId) && !string.Equals(order.TransactionId, request.TransactionId, StringComparison.OrdinalIgnoreCase))
            {
                return MessageHelp.Error<ConfirmOrderResponse>("Order already completed with a different transaction", response: null, Code: 409);
            }

            return MessageHelp.Success(new ConfirmOrderResponse
            {
                CreditsAwarded = order.TotalCredits,
                Status = "already_confirmed"
            });
        }

        if (string.IsNullOrWhiteSpace(request.TransactionId))
        {
            return MessageHelp.Error<ConfirmOrderResponse>("TransactionId is required", response: null, Code: 400);
        }

        var transaction = await _nmiClient.GetTransactionAsync(request.TransactionId, cancellationToken);

        if (!string.Equals(transaction.Currency, order.Currency, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Currency mismatch for order {OrderId}. Expected {Expected}, received {Actual}", order.Id, order.Currency, transaction.Currency);
        }

        if (order.TotalAmount > 0 && transaction.Amount > 0 && transaction.Amount != order.TotalAmount)
        {
            return MessageHelp.Error<ConfirmOrderResponse>("Transaction amount mismatch", response: null, Code: 409);
        }

        if (!string.Equals(transaction.Status, "approved", StringComparison.OrdinalIgnoreCase))
        {
            return MessageHelp.Error<ConfirmOrderResponse>("Transaction not approved", response: null, Code: 409);
        }

        // 原子：只有当当前不是 Paid 时，才能把订单置为 Paid
        var affected = await _context.Database.ExecuteSqlInterpolatedAsync($@"
            UPDATE Orders
            SET Status = {(int)OrderStatus.Paid},
                TransactionId = {request.TransactionId},
                PaidAt = {DateTimeOffset.UtcNow},
                UpdatedAt = {DateTimeOffset.UtcNow},
                FailureReason = {null}
            WHERE Id = {order.Id} AND Status <> {(int)OrderStatus.Paid}",
            cancellationToken);

        // 只有第一次命中的请求才发积分；第二次开始 affected=0，什么都不做
        if (affected == 1)
        {
            await _creditService.AddAsync(order.UserId, order.TotalCredits, cancellationToken);
            return MessageHelp.Success(new ConfirmOrderResponse
            {
                CreditsAwarded = order.TotalCredits,
                Status = "confirmed"
            });
        }

        // 已有人先处理过
        return MessageHelp.Success(new ConfirmOrderResponse
        {
            CreditsAwarded = order.TotalCredits,
            Status = "already_confirmed"
        });

    }

    [HttpPost("{orderId:guid}/fail")]
    public async Task<MessageModel> FailOrder(Guid orderId, [FromBody] FailOrderRequest request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            return MessageHelp.Error("Order not found", Code: 404);
        }

        if (order.Status == OrderStatus.Paid)
        {
            return MessageHelp.Success();
        }

        order.Status = string.Equals(request.Reason, "cancelled", StringComparison.OrdinalIgnoreCase)
            ? OrderStatus.Cancelled
            : OrderStatus.Failed;
        order.TransactionId ??= request.TransactionId;
        order.FailureReason = request.Reason;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MessageHelp.Success();
    }

    private string? GetUserId()
    {
        if (Request.Headers.TryGetValue("X-User-Id", out var values))
        {
            var headerValue = values.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(headerValue))
            {
                return headerValue;
            }
        }

        return null;
    }

    private static string BuildCallbackUrl(string? baseUrl, Guid orderId, bool includeTransactionPlaceholder)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return string.Empty;
        }

        var fragmentIndex = baseUrl.IndexOf('#');
        var fragment = fragmentIndex >= 0 ? baseUrl.Substring(fragmentIndex) : string.Empty;
        var withoutFragment = fragmentIndex >= 0 ? baseUrl[..fragmentIndex] : baseUrl;

        var questionIndex = withoutFragment.IndexOf('?');
        var path = questionIndex >= 0 ? withoutFragment[..questionIndex] : withoutFragment;
        var existingQuery = questionIndex >= 0 ? withoutFragment[(questionIndex + 1)..] : string.Empty;

        Dictionary<string, StringValues> queryParameters;
        if (string.IsNullOrWhiteSpace(existingQuery))
        {
            queryParameters = new Dictionary<string, StringValues>(StringComparer.OrdinalIgnoreCase);
        }
        else
        {
            try
            {
                queryParameters = new Dictionary<string, StringValues>(QueryHelpers.ParseQuery("?" + existingQuery), StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                queryParameters = new Dictionary<string, StringValues>(StringComparer.OrdinalIgnoreCase);
            }
        }

        queryParameters["orderId"] = orderId.ToString();

        if (includeTransactionPlaceholder)
        {
            const string placeholder = "(TRANSACTION_ID)";
            if (!queryParameters.TryGetValue("t", out var values) || !values.Any(value => value.Contains(placeholder, StringComparison.OrdinalIgnoreCase)))
            {
                queryParameters["t"] = placeholder;
            }
        }

        var builder = new StringBuilder(path);
        var first = true;
        foreach (var kvp in queryParameters)
        {
            foreach (var value in kvp.Value)
            {
                builder.Append(first ? '?' : '&');
                first = false;
                builder.Append(Uri.EscapeDataString(kvp.Key));
                builder.Append('=');

                var shouldPreserveValue = includeTransactionPlaceholder
                    && string.Equals(kvp.Key, "t", StringComparison.OrdinalIgnoreCase)
                    && string.Equals(value, "(TRANSACTION_ID)", StringComparison.Ordinal);

                builder.Append(shouldPreserveValue ? value : Uri.EscapeDataString(value));
            }
        }

        if (!string.IsNullOrEmpty(fragment))
        {
            builder.Append(fragment);
        }

        return builder.ToString();
    }
}

// DTOs

public class CreateOrderRequest
{
    [Required]
    public string SuccessUrl { get; set; } = string.Empty;

    [Required]
    public string CancelUrl { get; set; } = string.Empty;

    public List<CreateOrderItemRequest> Items { get; set; } = new();
}

public class PendingOrderRequest
{
    // 仅用于预创建订单，不要求 Success/Cancel URL
    [Required]
    public List<CreateOrderItemRequest> Items { get; set; } = new();
}

public class CreateOrderItemRequest
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string NmiSku { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public decimal UnitAmount { get; set; }

    public int Quantity { get; set; } = 1;

    public int Credits { get; set; }

    public string? Currency { get; set; }
}

public class CreateOrderResponse
{
    public Guid OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string CheckoutId { get; set; } = string.Empty;

    public string? CheckoutUrl { get; set; }
}

public class ConfirmOrderRequest
{
    [Required]
    public string TransactionId { get; set; } = string.Empty;
}

public class ConfirmOrderResponse
{
    public string Status { get; set; } = string.Empty;

    public int CreditsAwarded { get; set; }
}

public class FailOrderRequest
{
    public string? TransactionId { get; set; }

    public string? Reason { get; set; }
}
