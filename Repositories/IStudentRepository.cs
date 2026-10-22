
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Models;

namespace StudentRegistrationAPI.Repositories
{
    public interface IStudentRepository
    {
        Task<IEnumerable<Student>> GetAllStudents();

        Task<Student?> GetStudentById(int id);

        Task<Student?> GetStudentByEmail(string email);

        Task<int> CreateStudent(StudentCreateDto student);

        Task<int> CreateTeacher(TeacherCreateDto teacher);

        Task<bool> UpdateStudent(
            int id,
            StudentUpdateDto student
        );

        Task<bool> DeleteStudent(int id);
    }
}
