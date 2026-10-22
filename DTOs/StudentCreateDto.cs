namespace StudentRegistrationAPI.DTOs
{
    public class StudentCreateDto
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public int Age { get; set; }

        public string MobileNumber { get; set; } = string.Empty;

        public string Course { get; set; } = string.Empty;
    }

    public class StudentUpdateDto
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public int Age { get; set; }

        public string MobileNumber { get; set; } = string.Empty;

        public string Course { get; set; } = string.Empty;
    }
}