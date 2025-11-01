// Server/Server/Controllers/WebhookController.cs
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KarXT.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.Models.DataBase;
using Server.Options;
using Server.Services;
using Server.Services.Nmi;

namespace Server.Controllers;

[ApiController]
[Route("api/webhooks/nmi")]
public class WebhookController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly INmiClient _nmiClient;
    private readonly ICreditService _creditService;
    private readonly ILogger<WebhookController> _logger;
    private readonly NmiOptions _options;

    public WebhookController(
        AppDbContext context,
        INmiClient nmiClient,
        ICreditService creditService,
        IOptions<NmiOptions> options,
        ILogger<WebhookController> logger)
    {
        _context = context;
        _nmiClient = nmiClient;
        _creditService = creditService;
        _logger = logger;
        _options = options.Value;
    }

    [HttpPost]
    public async Task<IActionResult> HandleAsync(CancellationToken cancellationToken)
    {
        Request.EnableBuffering();
        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync(cancellationToken);
            Request.Body.Position = 0;
        }

        if (!VerifySignature(rawBody))
        {
            _logger.LogWarning("NMI webhook signature validation failed");
            return Unauthorized();
        }

        using var document = JsonDocument.Parse(rawBody);
        var root = document.RootElement;

        var transactionId = TryGetString(root, "transaction_id")
            ?? TryGetString(root, "data", "transaction_id");

        if (string.IsNullOrWhiteSpace(transactionId))
        {
            _logger.LogWarning("Received NMI webhook without transaction_id: {Payload}", rawBody);
            return Ok(MessageHelp.Success());
        }

        var orderIdValue = TryGetString(root, "data", "metadata", "order_id")
            ?? TryGetString(root, "metadata", "order_id");

        Order? order = null;

        if (Guid.TryParse(orderIdValue, out var orderId))
        {
            order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        }

        order ??= await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.TransactionId == transactionId, cancellationToken);

        if (order is null)
        {
            _logger.LogWarning("Webhook transaction {TransactionId} does not match any order", transactionId);
            return Ok(MessageHelp.Success());
        }

        if (order.Status == OrderStatus.Paid)
        {
            return Ok(MessageHelp.Success());
        }

        try
        {
            var transaction = await _nmiClient.GetTransactionAsync(transactionId, cancellationToken);

            if (!string.Equals(transaction.Status, "approved", StringComparison.OrdinalIgnoreCase))
            {
                order.Status = OrderStatus.Failed;
                order.TransactionId = transactionId;
                order.FailureReason = $"Webhook status {transaction.Status}";
                order.UpdatedAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                return Ok(MessageHelp.Success());
            }

            var affected = await _context.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE Orders
                SET Status = {(int)OrderStatus.Paid},
                    TransactionId = {transactionId},
                    PaidAt = {DateTimeOffset.UtcNow},
                    UpdatedAt = {DateTimeOffset.UtcNow},
                    FailureReason = {null}
                WHERE Id = {order.Id} AND Status <> {(int)OrderStatus.Paid}",
                cancellationToken);

            if (affected == 1)
            {
                await _creditService.AddAsync(order.UserId, order.TotalCredits, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process webhook for transaction {TransactionId}", transactionId);
        }
        return Ok(MessageHelp.Success());
    }

    private bool VerifySignature(string rawBody)
    {
        var signingKey = _options.WebhookSigningKey;
        if (string.IsNullOrWhiteSpace(signingKey))
        {
            return true;
        }

        if (!Request.Headers.TryGetValue("Webhook-Signature", out var signatureHeader) &&
            !Request.Headers.TryGetValue("Signature", out signatureHeader))
        {
            return false;
        }

        var headerValue = signatureHeader.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(headerValue))
        {
            return false;
        }

        string? timestamp = null;
        string? signature = null;
        foreach (var part in headerValue.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var segments = part.Split('=', 2, StringSplitOptions.TrimEntries);
            if (segments.Length != 2)
            {
                continue;
            }

            if (segments[0] == "t")
            {
                timestamp = segments[1];
            }
            else if (segments[0] == "s")
            {
                signature = segments[1];
            }
        }

        var payload = timestamp is null ? rawBody : $"{timestamp}.{rawBody}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(signingKey));
        var expected = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));

        if (string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        try
        {
            var provided = Convert.FromHexString(signature);
            return CryptographicOperations.FixedTimeEquals(provided, expected);
        }
        catch
        {
            return false;
        }
    }

    private static string? TryGetString(JsonElement element, params string[] path)
    {
        foreach (var segment in path)
        {
            if (!element.TryGetProperty(segment, out element))
            {
                return null;
            }
        }

        return element.ValueKind == JsonValueKind.String ? element.GetString() : null;
    }
}