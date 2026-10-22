
using System.ComponentModel.DataAnnotations;

namespace StudentRegistrationAPI.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Enter a valid email address.")]
        [StringLength(254, ErrorMessage = "Email cannot exceed 254 characters.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(
            128,
            MinimumLength = 1,
            ErrorMessage = "Password must not exceed 128 characters.")]
        public string Password { get; set; } = string.Empty;
    }
}
