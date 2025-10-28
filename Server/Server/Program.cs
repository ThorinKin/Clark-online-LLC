// Server/Program.cs
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Server.Models.DataBase;
using Server.Services;
using Server.Payments;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<ICreditService, CreditService>(); // 扣减积分服务
builder.Services.Configure<AuthorizeNetOptions>(builder.Configuration.GetSection("AuthorizeNet"));
builder.Services.AddSingleton<IAuthorizeNetClient, AuthorizeNetClient>();

//database
builder.Services.AddDbContext<AppDbContext>(options => 
{
    options.UseMySql(builder.Configuration.GetConnectionString("ServerDB"),ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("ServerDB")), builder =>
    {
        builder.EnableRetryOnFailure(0);
    });
});

builder.Services.AddHttpClient();

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
//        ValidateIssuer = true,  
//        ValidateAudience = true,
//        ValidateLifetime = true,
//        ValidateIssuerSigningKey = true,
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

