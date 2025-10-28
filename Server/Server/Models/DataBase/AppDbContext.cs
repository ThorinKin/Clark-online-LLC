//LoginServer/Server/Server/Models/DataBase/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace Server.Models.DataBase
{
    public class AppDbContext:DbContext
    {
        public AppDbContext()
        {
        }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey("Id");
                entity.Property(u => u.Credits).HasDefaultValue(0); // 1015 added
            });

            modelBuilder.Entity<PaymentTransaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.InvoiceNumber).IsUnique();
                entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(64);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(32);
                entity.Property(e => e.Currency).IsRequired().HasMaxLength(8).HasDefaultValue("USD");
                entity.Property(e => e.Amount).HasColumnType("decimal(10,2)");
                entity.Property(e => e.ItemsJson).HasColumnType("longtext");
                entity.Property(e => e.HostedPaymentToken).HasMaxLength(512);
                entity.Property(e => e.GatewayTransactionId).HasMaxLength(64);
                entity.Property(e => e.CreatedAt).HasColumnType("datetime(6)");
                entity.Property(e => e.UpdatedAt).HasColumnType("datetime(6)");
            });
        }

        public DbSet<User> Users { get; set; }
        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
    }
}
