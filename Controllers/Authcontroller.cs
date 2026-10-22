
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace StudentRegistrationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IStudentRepository _repository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IStudentRepository repository,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _repository = repository;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginDto login)
        {
            if (login == null ||
                string.IsNullOrWhiteSpace(login.Email) ||
                string.IsNullOrEmpty(login.Password))
            {
                return BadRequest(new
                {
                    message = "Email and password are required."
                });
            }

            try
            {
                string email = login.Email.Trim();

                var student =
                    await _repository.GetStudentByEmail(email);

                if (student == null)
                {
                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                // Preserves existing password comparison.
                // Replace with password hashing before production.
                bool passwordMatches = string.Equals(
                    student.Password,
                    login.Password,
                    StringComparison.Ordinal);

                if (!passwordMatches)
                {
                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                // Read JWT configuration from ASP.NET Core configuration.
                var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
                var issuer = _configuration["Jwt:Issuer"];
                var audience = _configuration["Jwt:Audience"];

                if (string.IsNullOrWhiteSpace(jwtKey) ||
                    string.IsNullOrWhiteSpace(issuer) ||
                    string.IsNullOrWhiteSpace(audience))
                {
                    _logger.LogError(
                        "JWT configuration is missing or incomplete.");

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication configuration is unavailable."
                        });
                }

                byte[] keyBytes;

                try
                {
                    keyBytes = Convert.FromBase64String(jwtKey);
                }
                catch (FormatException ex)
                {
                    _logger.LogError(
                        ex,
                        "JWT signing key is not valid Base64.");

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication configuration is invalid."
                        });
                }

                if (keyBytes.Length < 32)
                {
                    _logger.LogError(
                        "JWT signing key must contain at least 256 bits.");

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication configuration is invalid."
                        });
                }

                var signingKey =
                    new SymmetricSecurityKey(keyBytes);

                var credentials = new SigningCredentials(
                    signingKey,
                    SecurityAlgorithms.HmacSha256);

                var role = string.IsNullOrWhiteSpace(student.Role)
                    ? "Student"
                    : student.Role.Trim();

                var claims = new[]
                {
                    new Claim(
                        ClaimTypes.NameIdentifier,
                        student.StudentId.ToString()),

                    new Claim(
                        ClaimTypes.Name,
                        student.FullName ?? string.Empty),

                    new Claim(
                        ClaimTypes.Email,
                        student.Email ?? string.Empty),

                    new Claim(
                        ClaimTypes.Role,
                        role)
                };

                var now = DateTime.UtcNow;

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    notBefore: now,
                    expires: now.AddHours(2),
                    signingCredentials: credentials);

                var jwtToken =
                    new JwtSecurityTokenHandler().WriteToken(token);

                return Ok(new
                {
                    token = jwtToken,
                    studentId = student.StudentId,
                    fullName = student.FullName,
                    email = student.Email,
                    age = student.Age,
                    mobileNumber = student.MobileNumber,
                    course = student.Course,
                    role = role
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred during login.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to process login. Please try again."
                    });
            }
        }
    }
}
