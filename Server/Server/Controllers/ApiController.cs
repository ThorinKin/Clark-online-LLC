// Server/Controllers/ApiController.cs
using KarXT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models.DataBase;
using System.Text.Json.Nodes;

namespace Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ApiController : BaseController
    {
        public ApiController(ILogger<ApiController> logger,
            IConfiguration configuration,
            AppDbContext context)
            : base(logger, configuration,context)
        {
        }

        [HttpGet("Hello")]
        public IActionResult Hello()
        {
            return Ok("Hello");
        }

        [HttpPost("Register")]
        public async Task<MessageModel> Register(JsonObject data)
        {
            var newUser = new User
            {
                UserName= data["name"]?.GetValue<string>()??"",
                PasswordHash= data["password"]?.GetValue<string>()??"",
                Email= data["email"]?.GetValue<string>()??"",
                PhoneNumber= data["phone"]?.GetValue<string>()??""
            };
            await Context.Users.AddAsync(newUser);
            await Context.SaveChangesAsync();

            return MessageHelp.Success(new
            {
                id = newUser.Id,
                userName = newUser.UserName,
                email = newUser.Email
            });
        }
        [HttpPost("Login")]
        public async Task<MessageModel> Login(JsonObject data)
        {
            var email = data["email"]?.GetValue<string>();
            var password = data["password"]?.GetValue<string>();
            var user = await Context.Users
                .FirstOrDefaultAsync(t => t.Email == email && t.PasswordHash == password);

            if (user != null)
            {
                // 1016增加返回用户关键信息，带 Id
                return MessageHelp.Success(new
                {
                    id = user.Id,
                    userName = user.UserName,
                    email = user.Email
                });
            }
            else
            {
                return MessageHelp.Error("Incorrect password");
            }
        }

    }
}
