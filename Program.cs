
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using StudentRegistrationAPI.Repositories;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure logging for local development and Azure App Service
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddAzureWebAppDiagnostics();

// 2. Register controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 3. Configure Swagger with JWT Bearer authentication
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});

// 4. Register repository dependency injection
builder.Services.AddScoped<IStudentRepository, StudentRepository>();

// 5. Read JWT configuration
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
var issuer = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "JWT signing key is missing. Configure JWT_KEY securely.");
}

if (string.IsNullOrWhiteSpace(issuer) ||
    string.IsNullOrWhiteSpace(audience))
{
    throw new InvalidOperationException(
        "JWT issuer or audience is missing. Configure Jwt:Issuer and Jwt:Audience.");
}

// 6. Validate the Base64 JWT signing key
byte[] keyBytes;

try
{
    keyBytes = Convert.FromBase64String(jwtKey);
}
catch (FormatException ex)
{
    throw new InvalidOperationException(
        "JWT signing key must be a valid Base64 string.", ex);
}

if (keyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "JWT signing key must decode to at least 32 bytes (256 bits).");
}

// 7. Configure JWT authentication
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,

            ValidateAudience = true,
            ValidAudience = audience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
        };
    });

// 8. Configure authorization
builder.Services.AddAuthorization();

//cache memory
builder.Services.AddMemoryCache();

// 9. Configure CORS for the React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4173",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://127.0.0.1:4173",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "https://salmon-rock-016eb6310.4.azurestaticapps.net",
                "https://agreeable-mud-09a5d3110.3.azurestaticapps.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// 10. Create a logger for application lifecycle messages
var logger = app.Services.GetRequiredService<ILogger<Program>>();

// 11. Configure Swagger
app.UseSwagger();
app.UseSwaggerUI();

// 12. Redirect HTTP to HTTPS outside development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 13. Configure middleware in the correct order
app.UseRouting();

// CORS must run before authentication and authorization
app.UseCors("ReactPolicy");

app.UseAuthentication();
app.UseAuthorization();

// 14. Map controller endpoints
app.MapControllers();

// 15. Log application startup
logger.LogInformation(
    "Student Registration API is starting.");

// 16. Log application shutdown
app.Lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation(
        "Student Registration API is stopping.");
});

app.Run();
