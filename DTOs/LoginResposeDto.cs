
namespace StudentRegistrationAPI.DTOs
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;

        public int StudentId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public int Age { get; set; }

        public string MobileNumber { get; set; } = string.Empty;

        public string Course { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;
    }
}
