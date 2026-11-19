
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Models;

namespace StudentRegistrationAPI.Repositories
{
    public interface IStudentRepository
    {
        // Retrieve all student records
        Task<IEnumerable<Student>> GetAllStudents();

        // Retrieve all admin records
        Task<IEnumerable<Student>> GetAllAdmins();

        // Retrieve all teacher records
        Task<IEnumerable<Student>> GetAllTeachers();

        // Retrieve a student by ID
        Task<Student?> GetStudentById(int id);

        // Retrieve a student by email
        Task<Student?> GetStudentByEmail(string email);

        // Create a new student
        Task<int> CreateStudent(StudentCreateDto student);

        // Create a new teacher
        Task<int> CreateTeacher(TeacherCreateDto teacher);

        // Update student details
        Task<bool> UpdateStudent(
            int id,
            StudentUpdateDto student
        );

        // Delete a student
        Task<bool> DeleteStudent(int id);
    }
}
