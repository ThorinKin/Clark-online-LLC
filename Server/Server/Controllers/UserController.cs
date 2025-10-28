//Server/Controllers/UserController.cs
using Microsoft.AspNetCore.Mvc;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly ICreditService _credits;

    public UserController(ICreditService credits)
    {
        _credits = credits;
    }

    // 从请求头拿用户ID（启用JWT后改为从 Claims 取）
    private string? GetUserId() =>
        Request.Headers.TryGetValue("X-User-Id", out var v) ? v.ToString() : null;

    [HttpGet("me/credits")]
    public async Task<IActionResult> GetMyCredits()
    {
        var uid = GetUserId();
        if (string.IsNullOrWhiteSpace(uid)) return Unauthorized(new { message = "Missing X-User-Id" });

        var c = await _credits.GetCreditsAsync(uid);
        return Ok(new { remaining = c });
    }

    // 手工充值
    [HttpPost("me/credits/add")]
    public async Task<IActionResult> AddCredits([FromQuery] int amount = 10)
    {
        var uid = GetUserId();
        if (string.IsNullOrWhiteSpace(uid)) return Unauthorized(new { message = "Missing X-User-Id" });
        if (amount <= 0) return BadRequest(new { message = "amount must be > 0" });

        await _credits.AddAsync(uid, amount);
        var c = await _credits.GetCreditsAsync(uid);
        return Ok(new { remaining = c });
    }
}
