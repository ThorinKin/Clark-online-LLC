// Server/Services/UserCredit.cs
using Microsoft.EntityFrameworkCore;
using Server.Models.DataBase;

namespace Server.Services;

public interface ICreditService
{
    Task<int> GetCreditsAsync(string userId, CancellationToken ct = default);
    Task<bool> TryConsumeAsync(string userId, int amount, CancellationToken ct = default);
    Task AddAsync(string userId, int amount, CancellationToken ct = default); 
}

public class CreditService : ICreditService
{
    private readonly AppDbContext _db;
    public CreditService(AppDbContext db) { _db = db; }

    public async Task<int> GetCreditsAsync(string userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null) throw new InvalidOperationException("User not found");
        return user.Credits;
    }

    public async Task<bool> TryConsumeAsync(string userId, int amount, CancellationToken ct = default)
    {
        // Ô­×Ó¿Û¼õ£º½öµ±Óà¶î³ä×ãÊ±¿Û¼õ
        var affected = await _db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE Users SET Credits = Credits - {amount} WHERE Id = {userId} AND Credits >= {amount}", ct);
        return affected == 1;
    }

    public async Task AddAsync(string userId, int amount, CancellationToken ct = default)
    {
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE Users SET Credits = Credits + {amount} WHERE Id = {userId}", ct);
    }
}

