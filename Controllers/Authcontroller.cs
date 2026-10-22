
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
                    _logger.LogWarning(
                        "Login failed because no matching account was found.");

                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                // Preserves your existing password comparison.
                // For production, use securely hashed passwords.
                bool passwordMatches = string.Equals(
                    student.Password,
                    login.Password,
                    StringComparison.Ordinal);

                if (!passwordMatches)
                {
                    _logger.LogWarning(
                        "Login failed because the password did not match.");

                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                // Read the same JWT settings used by Program.cs.
                var jwtKey = _configuration["Jwt:Key"];
                var issuer = _configuration["Jwt:Issuer"];
                var audience = _configuration["Jwt:Audience"];

                if (string.IsNullOrWhiteSpace(jwtKey) ||
                    string.IsNullOrWhiteSpace(issuer) ||
                    string.IsNullOrWhiteSpace(audience))
                {
                    _logger.LogError(
                        "JWT configuration is incomplete.");

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication is temporarily unavailable."
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
                        "JWT signing key configuration is invalid.");

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication is temporarily unavailable."
                        });
                }

                if (keyBytes.Length < 32)
                {
                    _logger.LogError(
                        "JWT signing key is shorter than 256 bits.");

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication is temporarily unavailable."
                        });
                }

                // Sign the token with the same key used by Program.cs.
                var signingKey = new SymmetricSecurityKey(keyBytes);

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

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    notBefore: DateTime.UtcNow,
                    expires: DateTime.UtcNow.AddHours(2),
                    signingCredentials: credentials);

                var jwtToken =
                    new JwtSecurityTokenHandler().WriteToken(token);

                _logger.LogInformation(
                    "Login succeeded for the matched account.");

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
