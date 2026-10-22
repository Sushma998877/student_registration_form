
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Repositories;
using System.Security.Claims;

namespace StudentRegistrationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentRepository _repository;
        private readonly ILogger<StudentsController> _logger;

        public StudentsController(
            IStudentRepository repository,
            ILogger<StudentsController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        // GET ALL STUDENTS
        // Only Admin and Teacher can view all students.
        [Authorize(Roles = "Teacher,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllStudents()
        {
            try
            {
                var students = await _repository.GetAllStudents();
                return Ok(students);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve students.");

                return StatusCode(500, new
                {
                    message = "Unable to retrieve students."
                });
            }
        }

        // GET STUDENT BY ID
        // Students can view only their own details.
        // Teachers and Admins can view any student.
        [Authorize(Roles = "Student,Teacher,Admin")]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetStudentById(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid student ID."
                });
            }

            if (User.IsInRole("Student") && !IsCurrentUser(id))
            {
                return Forbid();
            }

            try
            {
                var student = await _repository.GetStudentById(id);

                if (student == null)
                {
                    return NotFound(new
                    {
                        message = "Student not found."
                    });
                }

                return Ok(student);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to retrieve student ID {StudentId}.",
                    id);

                return StatusCode(500, new
                {
                    message = "Unable to retrieve the student."
                });
            }
        }

        // REGISTER STUDENT
        // Public registration.
        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> CreateStudent(
            [FromBody] StudentCreateDto student)
        {
            if (student == null ||
                string.IsNullOrWhiteSpace(student.FullName) ||
                string.IsNullOrWhiteSpace(student.Email) ||
                string.IsNullOrWhiteSpace(student.Password))
            {
                return BadRequest(new
                {
                    message = "Name, email, and password are required."
                });
            }

            student.FullName = student.FullName.Trim();
            student.Email = student.Email.Trim();

            if (student.FullName.Length > 150 ||
                student.Email.Length > 254 ||
                student.Password.Length > 128 ||
                student.Age < 1 ||
                student.Age > 120 ||
                string.IsNullOrWhiteSpace(student.MobileNumber) ||
                student.MobileNumber.Trim().Length > 20 ||
                string.IsNullOrWhiteSpace(student.Course) ||
                student.Course.Trim().Length > 100)
            {
                return BadRequest(new
                {
                    message = "Please provide valid student details."
                });
            }

            try
            {
                var existingStudent =
                    await _repository.GetStudentByEmail(student.Email);

                if (existingStudent != null)
                {
                    return Conflict(new
                    {
                        message = "An account with this email already exists."
                    });
                }

                // Preserve the current password-storage behavior.
                var id = await _repository.CreateStudent(student);

                return StatusCode(
                    StatusCodes.Status201Created,
                    new
                    {
                        message = "Student registered successfully.",
                        studentId = id,
                        role = "Student"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while registering a student.");

                return StatusCode(500, new
                {
                    message = "Unable to register the student. Please try again."
                });
            }
        }

        // UPDATE STUDENT PROFILE
        // Students can update only their own profile.
        // Teachers and Admins can update any student.
        [Authorize(Roles = "Student,Teacher,Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateStudent(
            int id,
            [FromBody] StudentUpdateDto student)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid student ID."
                });
            }

            if (student == null ||
                string.IsNullOrWhiteSpace(student.FullName) ||
                string.IsNullOrWhiteSpace(student.Email) ||
                student.Age < 1 ||
                student.Age > 120 ||
                string.IsNullOrWhiteSpace(student.MobileNumber) ||
                string.IsNullOrWhiteSpace(student.Course))
            {
                return BadRequest(new
                {
                    message = "Please provide valid student details."
                });
            }

            if (student.FullName.Trim().Length > 150 ||
                student.Email.Trim().Length > 254 ||
                student.MobileNumber.Trim().Length > 20 ||
                student.Course.Trim().Length > 100)
            {
                return BadRequest(new
                {
                    message = "One or more fields exceed the allowed length."
                });
            }

            if (User.IsInRole("Student") && !IsCurrentUser(id))
            {
                return Forbid();
            }

            try
            {
                student.FullName = student.FullName.Trim();
                student.Email = student.Email.Trim();
                student.MobileNumber = student.MobileNumber.Trim();
                student.Course = student.Course.Trim();

                var updated = await _repository.UpdateStudent(id, student);

                if (!updated)
                {
                    return NotFound(new
                    {
                        message = "Student not found."
                    });
                }

                return Ok(new
                {
                    message = "Student updated successfully."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to update student ID {StudentId}.",
                    id);

                return StatusCode(500, new
                {
                    message = "Unable to update the student. Please try again."
                });
            }
        }

        // DELETE STUDENT
        // Only Admin can delete student records.
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid student ID."
                });
            }

            try
            {
                var deleted = await _repository.DeleteStudent(id);

                if (!deleted)
                {
                    return NotFound(new
                    {
                        message = "Student not found."
                    });
                }

                return Ok(new
                {
                    message = "Student deleted successfully."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to delete student ID {StudentId}.",
                    id);

                return StatusCode(500, new
                {
                    message = "Unable to delete the student. Please try again."
                });
            }
        }

        // Check whether the logged-in student owns the requested record.
        private bool IsCurrentUser(int studentId)
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(userId, out var currentUserId)
                && currentUserId == studentId;
        }
    }
}
