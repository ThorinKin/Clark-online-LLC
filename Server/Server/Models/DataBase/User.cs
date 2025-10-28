// LoginServer/Server/Server/Models/DataBase/User.cs
using Microsoft.EntityFrameworkCore;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Server.Models.DataBase
{
    public class User
    {
        public User() { Id = Guid.NewGuid().ToString("N"); }

        [Column(TypeName = "varchar(50)")]
        public string Id { get; set; }

        [Column(TypeName = "nvarchar(50)")]
        public required string UserName { get; set; }

        [Column(TypeName = "varchar(100)"), Comment("密码hash")]
        public required string PasswordHash { get; set; }

        [Column(TypeName = "varchar(100)")]
        public required string Email { get; set; }

        [Column(TypeName = "varchar(20)")]
        public required string PhoneNumber { get; set; }

        [Comment("可用积分")]
        public int Credits { get; set; } = 0;  
    }
}
