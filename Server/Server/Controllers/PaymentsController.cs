using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models.DataBase;
using Server.Payments;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
	private static readonly HashSet<string> SuccessfulStatuses = new(
		new[] { "settledSuccessfully", "capturedPendingSettlement", "authorizedPendingCapture" },
		StringComparer.OrdinalIgnoreCase);

	private static readonly HashSet<string> FailedStatuses = new(
		new[] { "voided", "declined", "expired" },
		StringComparer.OrdinalIgnoreCase);

	private readonly AppDbContext _db;
	private readonly ICreditService _creditService;
	private readonly IAuthorizeNetClient _authorizeNet;
	private readonly ILogger<PaymentsController> _logger;

	public PaymentsController(
		AppDbContext db,
		ICreditService creditService,
		IAuthorizeNetClient authorizeNet,
		ILogger<PaymentsController> logger)
	{
		_db = db;
		_creditService = creditService;
		_authorizeNet = authorizeNet;
		_logger = logger;
	}

	private string? GetUserId() =>
		Request.Headers.TryGetValue("X-User-Id", out var value) ? value.ToString() : null;

	[HttpPost("hosted-session")]
	public async Task<IActionResult> CreateHostedSession(
		[FromBody] CreateHostedSessionRequest request,
		CancellationToken cancellationToken)
	{
		var userId = GetUserId();
		if (string.IsNullOrWhiteSpace(userId))
		{
			return Unauthorized(new { message = "Missing X-User-Id" });
		}

		if (request?.Items == null || request.Items.Count == 0)
		{
			return BadRequest(new { message = "At least one cart item is required." });
		}

		if (!TryCreateUri(request.SuccessUrl, out var successUri))
		{
			return BadRequest(new { message = "Invalid successUrl." });
		}

		if (!TryCreateUri(request.CancelUrl, out var cancelUri))
		{
			return BadRequest(new { message = "Invalid cancelUrl." });
		}

		var lineItems = new List<AuthorizeNetLineItem>();
		var storedItems = new List<PaymentItemSnapshot>();
		decimal totalAmount = 0;
		var totalCredits = 0;

		foreach (var item in request.Items)
		{
			if (string.IsNullOrWhiteSpace(item.ProductId) || item.Quantity <= 0)
			{
				return BadRequest(new { message = "Invalid product information." });
			}

			if (!ProductCatalog.TryGetProduct(item.ProductId, out var product))
			{
				return BadRequest(new { message = $"Unknown product id: {item.ProductId}" });
			}

			var amount = product.Price * item.Quantity;
			totalAmount += amount;
			totalCredits += product.Credits * item.Quantity;

			lineItems.Add(new AuthorizeNetLineItem(
				product.Id,
				product.Name,
				product.Price,
				item.Quantity));

			storedItems.Add(new PaymentItemSnapshot
			{
				ProductId = product.Id,
				Quantity = item.Quantity,
				UnitPrice = product.Price,
				Credits = product.Credits,
				Name = product.Name,
			});
		}

		totalAmount = Math.Round(totalAmount, 2, MidpointRounding.AwayFromZero);

		if (totalAmount <= 0 || totalCredits <= 0)
		{
			return BadRequest(new { message = "Cart total must be greater than zero." });
		}

		var invoiceNumber = await GenerateInvoiceNumberAsync(cancellationToken);

		HostedPaymentSession session;
		try
		{
			session = await _authorizeNet.CreateHostedPaymentSessionAsync(
				invoiceNumber,
				totalAmount,
				lineItems,
				successUri!,
				cancelUri!,
				cancellationToken);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Failed to create Authorize.net hosted payment session for invoice {Invoice}", invoiceNumber);
			return StatusCode(502, new { message = "Unable to initiate payment session." });
		}

		var now = DateTime.UtcNow;
		var transaction = new PaymentTransaction
		{
			InvoiceNumber = invoiceNumber,
			UserId = userId,
			Amount = totalAmount,
			Credits = totalCredits,
			Currency = "USD",
			Status = PaymentTransactionStatus.Pending,
			HostedPaymentToken = session.Token,
			ItemsJson = JsonSerializer.Serialize(storedItems),
			CreatedAt = now,
			UpdatedAt = now,
		};

		_db.PaymentTransactions.Add(transaction);
		await _db.SaveChangesAsync(cancellationToken);

		return Ok(new
		{
			session.token,
			paymentUrl = session.PaymentUrl,
			invoiceNumber,
			amount = totalAmount,
			currency = "USD",
			credits = totalCredits,
		});
	}

	[HttpPost("confirm")]
	public async Task<IActionResult> ConfirmPayment(
		[FromBody] ConfirmPaymentRequest request,
		CancellationToken cancellationToken)
	{
		var userId = GetUserId();
		if (string.IsNullOrWhiteSpace(userId))
		{
			return Unauthorized(new { message = "Missing X-User-Id" });
		}

		if (string.IsNullOrWhiteSpace(request.InvoiceNumber))
		{
			return BadRequest(new { message = "invoiceNumber is required." });
		}

		var transaction = await _db.PaymentTransactions
			.FirstOrDefaultAsync(t => t.InvoiceNumber == request.InvoiceNumber && t.UserId == userId, cancellationToken);

		if (transaction == null)
		{
			return NotFound(new { message = "Invoice not found." });
		}

		if (transaction.Status == PaymentTransactionStatus.Completed)
		{
			return Ok(CreatePaymentResponse(transaction));
		}

		if (transaction.Status == PaymentTransactionStatus.Cancelled || transaction.Status == PaymentTransactionStatus.Failed)
		{
			return Ok(new
			{
				status = transaction.Status,
				invoiceNumber = transaction.InvoiceNumber,
				transactionId = transaction.GatewayTransactionId,
				amount = transaction.Amount,
				currency = transaction.Currency,
				credits = transaction.Credits,
				message = "Payment was not completed.",
			});
		}

		var transactionId = request.TransactionId ?? transaction.GatewayTransactionId;
		TransactionDetails? details = null;
		if (!string.IsNullOrWhiteSpace(transactionId))
		{
			details = await _authorizeNet.GetTransactionDetailsAsync(transactionId!, cancellationToken);
		}

		if (details != null && !string.IsNullOrWhiteSpace(details.InvoiceNumber) &&
			!string.Equals(details.InvoiceNumber, transaction.InvoiceNumber, StringComparison.OrdinalIgnoreCase))
		{
			_logger.LogWarning(
				"Authorize.net returned invoice {ReturnedInvoice} that does not match local invoice {Invoice}",
				details.InvoiceNumber,
				transaction.InvoiceNumber);
		}

		if (details != null && SuccessfulStatuses.Contains(details.Status))
		{
			await CompleteTransactionAsync(transaction, details.TransactionId, cancellationToken);
			return Ok(CreatePaymentResponse(transaction));
		}

		if (details != null && FailedStatuses.Contains(details.Status))
		{
			transaction.Status = PaymentTransactionStatus.Failed;
			transaction.GatewayTransactionId = details.TransactionId;
			transaction.UpdatedAt = DateTime.UtcNow;
			await _db.SaveChangesAsync(cancellationToken);

			return Ok(new
			{
				status = PaymentTransactionStatus.Failed,
				invoiceNumber = transaction.InvoiceNumber,
				message = "The payment was declined or voided.",
			});
		}

		return Ok(new
		{
			status = PaymentTransactionStatus.Pending,
			invoiceNumber = transaction.InvoiceNumber,
			message = "Waiting for payment confirmation.",
		});
	}

	[HttpPost("cancel")]
	public async Task<IActionResult> CancelPayment(
		[FromBody] CancelPaymentRequest request,
		CancellationToken cancellationToken)
	{
		var userId = GetUserId();
		if (string.IsNullOrWhiteSpace(userId))
		{
			return Unauthorized(new { message = "Missing X-User-Id" });
		}

		if (string.IsNullOrWhiteSpace(request.InvoiceNumber))
		{
			return BadRequest(new { message = "invoiceNumber is required." });
		}

		var transaction = await _db.PaymentTransactions
			.FirstOrDefaultAsync(t => t.InvoiceNumber == request.InvoiceNumber && t.UserId == userId, cancellationToken);

		if (transaction == null)
		{
			return NotFound(new { message = "Invoice not found." });
		}

		if (transaction.Status == PaymentTransactionStatus.Completed)
		{
			return BadRequest(new { message = "Completed payments cannot be cancelled." });
		}

		transaction.Status = PaymentTransactionStatus.Cancelled;
		transaction.UpdatedAt = DateTime.UtcNow;
		await _db.SaveChangesAsync(cancellationToken);

		return Ok(new { status = PaymentTransactionStatus.Cancelled });
	}

	[HttpPost("webhook")]
	public async Task<IActionResult> HandleWebhook(CancellationToken cancellationToken)
	{
		using var reader = new StreamReader(Request.Body);
		var payload = await reader.ReadToEndAsync(cancellationToken);
		var signature = Request.Headers["X-ANET-Signature"].FirstOrDefault();

		if (!_authorizeNet.ValidateSignature(payload, signature))
		{
			return Unauthorized();
		}

		JsonDocument? document = null;
		try
		{
			document = JsonDocument.Parse(payload);
		}
		catch (JsonException ex)
		{
			_logger.LogWarning(ex, "Invalid JSON payload from Authorize.net webhook");
			return BadRequest();
		}

		using (document)
		{
			if (!document.RootElement.TryGetProperty("eventType", out var eventTypeElement))
			{
				return Ok();
			}

			var eventType = eventTypeElement.GetString();
			if (string.IsNullOrWhiteSpace(eventType) ||
				!eventType.StartsWith("net.authorize.payment.", StringComparison.OrdinalIgnoreCase))
			{
				return Ok();
			}

			if (!document.RootElement.TryGetProperty("payload", out var payloadElement))
			{
				return Ok();
			}

			var transactionId = payloadElement.TryGetProperty("id", out var idElement)
				? idElement.GetString()
				: null;

			var invoiceNumber = payloadElement.TryGetProperty("order", out var orderElement) &&
								 orderElement.TryGetProperty("invoiceNumber", out var invoiceElement)
				? invoiceElement.GetString()
				: null;

			if (string.IsNullOrWhiteSpace(invoiceNumber))
			{
				_logger.LogWarning("Authorize.net webhook missing invoice number. Event: {Event}", eventType);
				return Ok();
			}

			var transaction = await _db.PaymentTransactions
				.FirstOrDefaultAsync(t => t.InvoiceNumber == invoiceNumber, cancellationToken);

			if (transaction == null)
			{
				_logger.LogWarning("Received webhook for unknown invoice {Invoice}", invoiceNumber);
				return Ok();
			}

			if (!string.IsNullOrWhiteSpace(transactionId))
			{
				var details = await _authorizeNet.GetTransactionDetailsAsync(transactionId, cancellationToken);
				if (details != null && SuccessfulStatuses.Contains(details.Status))
				{
					await CompleteTransactionAsync(transaction, details.TransactionId, cancellationToken);
				}
				else if (details != null && FailedStatuses.Contains(details.Status))
				{
					transaction.Status = PaymentTransactionStatus.Failed;
					transaction.GatewayTransactionId = details.TransactionId;
					transaction.UpdatedAt = DateTime.UtcNow;
					await _db.SaveChangesAsync(cancellationToken);
				}
			}
		}

		return Ok();
	}

	private async Task<string> GenerateInvoiceNumberAsync(CancellationToken cancellationToken)
	{
		for (var i = 0; i < 10; i++)
		{
			var invoice = $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
			var exists = await _db.PaymentTransactions
				.AnyAsync(t => t.InvoiceNumber == invoice, cancellationToken);
			if (!exists)
			{
				return invoice;
			}
		}

		throw new InvalidOperationException("Unable to generate a unique invoice number.");
	}

	private object CreatePaymentResponse(PaymentTransaction transaction) => new
	{
		status = PaymentTransactionStatus.Completed,
		invoiceNumber = transaction.InvoiceNumber,
		transactionId = transaction.GatewayTransactionId,
		amount = transaction.Amount,
		currency = transaction.Currency,
		creditsAdded = transaction.Credits,
	};

	private static bool TryCreateUri(string? input, out Uri? uri)
	{
		uri = null;
		if (string.IsNullOrWhiteSpace(input))
		{
			return false;
		}

		if (!Uri.TryCreate(input, UriKind.Absolute, out var parsed) ||
			!(parsed.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase) ||
			  parsed.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase)))
		{
			return false;
		}

		uri = parsed;
		return true;
	}

	private async Task CompleteTransactionAsync(
		PaymentTransaction transaction,
		string? gatewayTransactionId,
		CancellationToken cancellationToken)
	{
		if (transaction.Status == PaymentTransactionStatus.Completed)
		{
			return;
		}

		await using var dbTransaction = await _db.Database.BeginTransactionAsync(cancellationToken);
		await _creditService.AddAsync(transaction.UserId, transaction.Credits, cancellationToken);

		transaction.Status = PaymentTransactionStatus.Completed;
		transaction.GatewayTransactionId = gatewayTransactionId ?? transaction.GatewayTransactionId;
		transaction.UpdatedAt = DateTime.UtcNow;
		await _db.SaveChangesAsync(cancellationToken);
		await dbTransaction.CommitAsync(cancellationToken);
	}

	private sealed class PaymentItemSnapshot
	{
		public string ProductId { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public int Quantity { get; set; }
		public decimal UnitPrice { get; set; }
		public int Credits { get; set; }
	}
}

public sealed class CreateHostedSessionRequest
{
	public List<CreateHostedSessionItem> Items { get; set; } = new();
	public string? SuccessUrl { get; set; }
	public string? CancelUrl { get; set; }
}

public sealed class CreateHostedSessionItem
{
	public string ProductId { get; set; } = string.Empty;
	public int Quantity { get; set; }
}

public sealed class ConfirmPaymentRequest
{
	public string InvoiceNumber { get; set; } = string.Empty;
	public string? TransactionId { get; set; }
}

public sealed class CancelPaymentRequest
{
	public string InvoiceNumber { get; set; } = string.Empty;
}