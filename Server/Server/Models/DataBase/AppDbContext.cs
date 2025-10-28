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
        }

        public DbSet<User> Users { get; set; }
    }
}
