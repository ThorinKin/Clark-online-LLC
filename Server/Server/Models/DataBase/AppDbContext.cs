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

            // Order
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(o => o.OrderNumber).IsUnique();
                entity.Property(o => o.TotalAmount).HasPrecision(18, 2);
                entity.Property(o => o.Currency).HasMaxLength(8);
                entity.HasMany(o => o.Items)
                      .WithOne(i => i.Order)
                      .HasForeignKey(i => i.OrderId);
            });

            // OrderItem
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.Property(i => i.UnitAmount).HasPrecision(18, 2);
                entity.Property(i => i.NmiSku).HasMaxLength(128);
            });


        }

        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
    }
}
