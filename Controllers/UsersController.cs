using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Repositories;

namespace StudentRegistrationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly IStudentRepository _repository;

        public UsersController(IStudentRepository repository)
        {
            _repository = repository;
        }

        [HttpPost("create-teacher")]
        public async Task<IActionResult> CreateTeacher(
            TeacherCreateDto teacher)
        {
            try
            {
                var id = await _repository.CreateTeacher(teacher);

                return Ok(new
                {
                    message = "Teacher created successfully",
                    userId = id,
                    role = "Teacher"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
    }
}