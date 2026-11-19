
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
            _logger.LogInformation(
                "Login request received.");

            if (login == null ||
                string.IsNullOrWhiteSpace(login.Email) ||
                string.IsNullOrEmpty(login.Password))
            {
                _logger.LogWarning(
                    "Login request rejected because required fields are missing.");

                return BadRequest(new
                {
                    message = "Email and password are required."
                });
            }

            string stage = "Starting login";

            try
            {
                string email = login.Email.Trim();

                // STEP 1: Retrieve the student from PostgreSQL.
                stage = "Database lookup";

                _logger.LogInformation(
                    "Starting database lookup for login.");

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

                _logger.LogInformation(
                    "Database lookup completed successfully.");

                // STEP 2: Validate the password.
                stage = "Password validation";

                // Preserves the existing password comparison.
                // Use password hashing before production.
                bool passwordMatches = string.Equals(
                    student.Password,
                    login.Password,
                    StringComparison.Ordinal);

                if (!passwordMatches)
                {
                    _logger.LogWarning(
                        "Login failed because password validation was unsuccessful.");

                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                _logger.LogInformation(
                    "Password validation succeeded.");

                // STEP 3: Read JWT configuration.
                stage = "JWT configuration";

                var jwtKey =
                    Environment.GetEnvironmentVariable("JWT_KEY");

                var issuer = _configuration["Jwt:Issuer"];
                var audience = _configuration["Jwt:Audience"];

                if (string.IsNullOrWhiteSpace(jwtKey) ||
                    string.IsNullOrWhiteSpace(issuer) ||
                    string.IsNullOrWhiteSpace(audience))
                {
                    _logger.LogError(
                        "JWT configuration is missing. " +
                        "KeyPresent={KeyPresent}, " +
                        "IssuerPresent={IssuerPresent}, " +
                        "AudiencePresent={AudiencePresent}",
                        !string.IsNullOrWhiteSpace(jwtKey),
                        !string.IsNullOrWhiteSpace(issuer),
                        !string.IsNullOrWhiteSpace(audience));

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication configuration is unavailable."
                        });
                }

                // STEP 4: Validate the Base64 signing key.
                stage = "JWT signing key validation";

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
                        "JWT signing key is too short. " +
                        "DecodedLength={Length}",
                        keyBytes.Length);

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "Authentication configuration is invalid."
                        });
                }

                _logger.LogInformation(
                    "JWT signing key validation succeeded.");

                // STEP 5: Generate the JWT token.
                stage = "JWT token generation";

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

                _logger.LogInformation(
                    "JWT token generated successfully.");

                // STEP 6: Return the existing login response.
                var response = new
                {
                    token = jwtToken,
                    studentId = student.StudentId,
                    fullName = student.FullName,
                    email = student.Email,
                    age = student.Age,
                    mobileNumber = student.MobileNumber,
                    course = student.Course,
                    role = role
                };

                _logger.LogInformation(
                    "Login completed successfully.");

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Login failed at stage {Stage}.",
                    stage);

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
