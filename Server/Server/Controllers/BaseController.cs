//Server/Controllers/BaseController.cs
using Microsoft.AspNetCore.Mvc;
using Server.Models.DataBase;

namespace Server.Controllers
{
    public class BaseController : ControllerBase
    {
        public ILogger Logger { get; private set; }
        public IConfiguration Configuration { get; private set; }
        public AppDbContext Context { get; private set; }

        public BaseController(ILogger logger, IConfiguration configuration, AppDbContext context)
        {
            Logger = logger;
            Configuration = configuration;
            Context = context;
        }
    }
}
