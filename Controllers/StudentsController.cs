
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IMemoryCache _cache;

        public StudentsController(
            IStudentRepository repository,
            ILogger<StudentsController> logger,
            IMemoryCache cache)
        {
            _repository = repository;
            _logger = logger;
            _cache = cache;
        }

        // GET ALL STUDENTS
        // Only Teachers and Admins can view all students.
        [Authorize(Roles = "Teacher,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllStudents()
        {
            _logger.LogInformation(
                "Request to retrieve all students received.");

            try
            {
                var students = await _cache.GetOrCreateAsync(
                    "students:all",
                    async cacheEntry =>
                    {
                        cacheEntry.AbsoluteExpirationRelativeToNow =
                            TimeSpan.FromMinutes(5);

                        _logger.LogInformation(
                            "Students cache miss. Fetching records from database.");

                        return await _repository.GetAllStudents();
                    });

                _logger.LogInformation(
                    "All students retrieved successfully.");

                return Ok(students);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to retrieve students.");

                return StatusCode(500, new
                {
                    message = "Unable to retrieve students."
                });
            }
        }

        // GET ALL ADMINS
        // Only Admin users can view all Admin records.
        [Authorize(Roles = "Admin")]
        [HttpGet("admins")]
        public async Task<IActionResult> GetAllAdmins()
        {
            _logger.LogInformation(
                "Request to retrieve all admins received.");

            try
            {
                var admins = await _cache.GetOrCreateAsync(
                    "admins:all",
                    async cacheEntry =>
                    {
                        cacheEntry.AbsoluteExpirationRelativeToNow =
                            TimeSpan.FromMinutes(5);

                        _logger.LogInformation(
                            "Admins cache miss. Fetching records from database.");

                        return await _repository.GetAllAdmins();
                    });

                _logger.LogInformation(
                    "All admins retrieved successfully.");

                return Ok(admins);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to retrieve admins.");

                return StatusCode(500, new
                {
                    message = "Unable to retrieve admins."
                });
            }
        }

        // GET ALL TEACHERS
        // Only Admin users can view all Teacher records.
        [Authorize(Roles = "Admin")]
        [HttpGet("teachers")]
        public async Task<IActionResult> GetAllTeachers()
        {
            _logger.LogInformation(
                "Request to retrieve all teachers received.");

            try
            {
                var teachers = await _cache.GetOrCreateAsync(
                    "teachers:all",
                    async cacheEntry =>
                    {
                        cacheEntry.AbsoluteExpirationRelativeToNow =
                            TimeSpan.FromMinutes(5);

                        _logger.LogInformation(
                            "Teachers cache miss. Fetching records from database.");

                        return await _repository.GetAllTeachers();
                    });

                _logger.LogInformation(
                    "All teachers retrieved successfully.");

                return Ok(teachers);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to retrieve teachers.");

                return StatusCode(500, new
                {
                    message = "Unable to retrieve teachers."
                });
            }
        }

        // GET MY OWN PROFILE
        // A logged-in Student can retrieve their own profile.
        // Teachers and Admins can also use this endpoint.
        [Authorize(Roles = "Student,Teacher,Admin")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            _logger.LogInformation(
                "Request to retrieve the current user's profile received.");

            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userId, out var studentId) ||
                studentId <= 0)
            {
                _logger.LogWarning(
                    "Unable to identify the user requesting their profile.");

                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            try
            {
                var student = await _cache.GetOrCreateAsync(
                    $"student:{studentId}",
                    async cacheEntry =>
                    {
                        cacheEntry.AbsoluteExpirationRelativeToNow =
                            TimeSpan.FromMinutes(5);

                        _logger.LogInformation(
                            "Profile cache miss for student ID {StudentId}.",
                            studentId);

                        return await _repository.GetStudentById(studentId);
                    });

                if (student == null)
                {
                    _logger.LogWarning(
                        "No profile found for the current user.");

                    return NotFound(new
                    {
                        message = "Student profile not found."
                    });
                }

                _logger.LogInformation(
                    "Current user's profile retrieved successfully.");

                return Ok(student);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to retrieve the current user's profile.");

                return StatusCode(500, new
                {
                    message = "Unable to retrieve your profile."
                });
            }
        }

        // GET STUDENT BY ID
        // Students can view only their own details.
        // Teachers and Admins can view any student's details.
        [Authorize(Roles = "Student,Teacher,Admin")]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetStudentById(int id)
        {
            _logger.LogInformation(
                "Request to retrieve student ID {StudentId} received.",
                id);

            if (id <= 0)
            {
                _logger.LogWarning(
                    "Student retrieval rejected because the ID is invalid.");

                return BadRequest(new
                {
                    message = "Invalid student ID."
                });
            }

            if (User.IsInRole("Student") && !IsCurrentUser(id))
            {
                _logger.LogWarning(
                    "Student access denied for a different student record.");

                return Forbid();
            }

            try
            {
                var student = await _cache.GetOrCreateAsync(
                    $"student:{id}",
                    async cacheEntry =>
                    {
                        cacheEntry.AbsoluteExpirationRelativeToNow =
                            TimeSpan.FromMinutes(5);

                        _logger.LogInformation(
                            "Student cache miss for ID {StudentId}.",
                            id);

                        return await _repository.GetStudentById(id);
                    });

                if (student == null)
                {
                    _logger.LogWarning(
                        "Student ID {StudentId} was not found.",
                        id);

                    return NotFound(new
                    {
                        message = "Student not found."
                    });
                }

                _logger.LogInformation(
                    "Student ID {StudentId} retrieved successfully.",
                    id);

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
            _logger.LogInformation(
                "Student registration request received.");

            if (student == null ||
                string.IsNullOrWhiteSpace(student.FullName) ||
                string.IsNullOrWhiteSpace(student.Email) ||
                string.IsNullOrWhiteSpace(student.Password))
            {
                _logger.LogWarning(
                    "Student registration rejected because required fields are missing.");

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
                _logger.LogWarning(
                    "Student registration rejected because one or more fields are invalid.");

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
                    _logger.LogWarning(
                        "Student registration rejected because the email is already registered.");

                    return Conflict(new
                    {
                        message = "An account with this email already exists."
                    });
                }

                var id = await _repository.CreateStudent(student);

                // Invalidate cached student list.
                _cache.Remove("students:all");

                _logger.LogInformation(
                    "Student registration completed successfully. Student ID: {StudentId}.",
                    id);

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
        // Teachers and Admins can update any student's profile.
        [Authorize(Roles = "Student,Teacher,Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateStudent(
            int id,
            [FromBody] StudentUpdateDto student)
        {
            _logger.LogInformation(
                "Request to update student ID {StudentId} received.",
                id);

            if (id <= 0)
            {
                _logger.LogWarning(
                    "Student update rejected because the ID is invalid.");

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
                _logger.LogWarning(
                    "Student update rejected because required details are missing or invalid.");

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
                _logger.LogWarning(
                    "Student update rejected because one or more fields exceed the allowed length.");

                return BadRequest(new
                {
                    message = "One or more fields exceed the allowed length."
                });
            }

            if (User.IsInRole("Student") && !IsCurrentUser(id))
            {
                _logger.LogWarning(
                    "Student update denied for a different student record.");

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
                    _logger.LogWarning(
                        "Update failed because student ID {StudentId} was not found.",
                        id);

                    return NotFound(new
                    {
                        message = "Student not found."
                    });
                }

                // Invalidate cached student data.
                _cache.Remove("students:all");
                _cache.Remove($"student:{id}");

                _logger.LogInformation(
                    "Student ID {StudentId} updated successfully.",
                    id);

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
            _logger.LogInformation(
                "Request to delete student ID {StudentId} received.",
                id);

            if (id <= 0)
            {
                _logger.LogWarning(
                    "Student deletion rejected because the ID is invalid.");

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
                    _logger.LogWarning(
                        "Deletion failed because student ID {StudentId} was not found.",
                        id);

                    return NotFound(new
                    {
                        message = "Student not found."
                    });
                }

                // Invalidate cached student data.
                _cache.Remove("students:all");
                _cache.Remove($"student:{id}");

                _logger.LogInformation(
                    "Student ID {StudentId} deleted successfully.",
                    id);

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

        // Check whether the logged-in user owns the requested record.
        private bool IsCurrentUser(int studentId)
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(userId, out var currentUserId)
                && currentUserId == studentId;
        }
    }
}
