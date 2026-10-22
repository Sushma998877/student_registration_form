using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace StudentRegistrationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IStudentRepository _repository;
        private readonly IConfiguration _configuration;

        public AuthController(
            IStudentRepository repository,
            IConfiguration configuration)
        {
            _repository = repository;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto login)
        {
            // =====================================================
            // FIND STUDENT BY EMAIL
            // =====================================================

            var student = await _repository.GetStudentByEmail(
                login.Email
            );

            // =====================================================
            // CHECK IF STUDENT EXISTS
            // =====================================================

            if (student == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password"
                });
            }

            // =====================================================
            // CHECK PASSWORD
            // =====================================================

            if (student.Password != login.Password)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password"
                });
            }

            // =====================================================
            // CREATE JWT CLAIMS
            // =====================================================

            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    student.StudentId.ToString()
                ),

                new Claim(
                    ClaimTypes.Name,
                    student.FullName ?? ""
                ),

                new Claim(
                    ClaimTypes.Email,
                    student.Email ?? ""
                ),

                new Claim(
                    ClaimTypes.Role,
                    student.Role ?? "Student"
                )
            };

            // =====================================================
            // GET JWT SECRET KEY
            // =====================================================

            var jwtKey = _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(jwtKey) ||
                Encoding.UTF8.GetByteCount(jwtKey) < 32)
            {
                throw new InvalidOperationException(
                    "JWT signing key is missing or too short."
                );
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

            // =====================================================
            // CREATE SIGNING CREDENTIALS
            // =====================================================

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            // =====================================================
            // CREATE JWT TOKEN
            // =====================================================

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            // =====================================================
            // CONVERT TOKEN TO STRING
            // =====================================================

            var jwtToken = new JwtSecurityTokenHandler()
                .WriteToken(token);

            // =====================================================
            // RETURN ALL STUDENT DETAILS
            // =====================================================

            return Ok(new
            {
                token = jwtToken,

                studentId = student.StudentId,

                fullName = student.FullName,

                email = student.Email,

                age = student.Age,

                mobileNumber = student.MobileNumber,

                course = student.Course,

                role = student.Role
            });
        }
    }
}