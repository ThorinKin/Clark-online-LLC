// Server/Program.cs
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Server.Models.DataBase;
using Server.Options;
using Server.Services;
using Server.Services.Nmi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<ICreditService, CreditService>(); // 扣减积分服务
builder.Services.Configure<NmiOptions>(builder.Configuration.GetSection(NmiOptions.SectionName));

//database
builder.Services.AddDbContext<AppDbContext>(options =>

{
    options.UseMySql(builder.Configuration.GetConnectionString("ServerDB"), ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("ServerDB")), builder =>
    {
        builder.EnableRetryOnFailure(0);
    });
});

builder.Services.AddHttpClient();
builder.Services.AddHttpClient<INmiClient, NmiClient>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<NmiOptions>>().Value;
    if (Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var baseUri))
    {
        client.BaseAddress = baseUri;
    }
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
});

// Compression 压缩请求
builder.Services.AddResponseCompression(options =>
{
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.EnableForHttps = true;
});

//Authentication
//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//.AddJwtBearer(options =>
//{
//    var isDevelopment = builder.Environment.IsDevelopment();
//    var expireDuration = builder.Configuration.GetValue<int>("JWTOptions:ExpireDuration", 30);
//    options.IncludeErrorDetails = isDevelopment;
//    options.RequireHttpsMetadata = !isDevelopment;
//    var key = builder.Configuration["JWTOptions:SecurityKey"] ?? "";
//    options.TokenValidationParameters = new TokenValidationParameters
//    {
//        ValidateIssuer = true,   //验证Issuer
//        ValidateAudience = true, //验证Audience
//        ValidateLifetime = true,  //验证生命周期
//        ValidateIssuerSigningKey = true, //验证密钥
//        ValidIssuer = builder.Configuration["JWTOptions:Issuer"],
//        ValidAudience = builder.Configuration["JWTOptions:Audience"],
//        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
//    };
//});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", options => options.SetIsOriginAllowed(x => _ = true)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()
        .SetPreflightMaxAge(TimeSpan.FromHours(1))
        .WithExposedHeaders("Content-Disposition"));
});

builder.Services.AddHttpContextAccessor();
var app = builder.Build();

app.UseRouting();
app.UseCors("CorsPolicy");
app.UseResponseCompression();
//app.UseAuthentication();// ↑上面注释掉的 Authentication 部分
app.UseAuthorization();
app.MapControllers();
app.Run();
