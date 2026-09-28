using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Repositories;

namespace StudentRegistrationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentRepository _repository;

        public StudentsController(IStudentRepository repository)
        {
            _repository = repository;
        }

        [Authorize(Roles = "Teacher,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _repository.GetAllStudents();

            return Ok(students);
        }

        [Authorize(Roles = "Teacher,Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStudentById(int id)
        {
            var student = await _repository.GetStudentById(id);

            if (student == null)
            {
                return NotFound(new
                {
                    message = "Student not found"
                });
            }

            return Ok(student);
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> CreateStudent(
            StudentCreateDto student)
        {
            try
            {
                var id = await _repository.CreateStudent(student);

                return Ok(new
                {
                    message = "Student created successfully",
                    studentId = id,
                    role = "Student"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        [Authorize(Roles = "Teacher,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStudent(
            int id,
            StudentCreateDto student)
        {
            var updated = await _repository.UpdateStudent(
                id,
                student
            );

            if (!updated)
            {
                return NotFound(new
                {
                    message = "Student not found"
                });
            }

            return Ok(new
            {
                message = "Student updated successfully"
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var deleted = await _repository.DeleteStudent(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Student not found"
                });
            }

            return Ok(new
            {
                message = "Student deleted successfully"
            });
        }
    }
}