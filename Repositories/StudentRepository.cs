using Dapper;
using Microsoft.Data.SqlClient;
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Models;

namespace StudentRegistrationAPI.Repositories
{
    public class StudentRepository : IStudentRepository
    {
        private readonly IConfiguration _configuration;

        public StudentRepository(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private SqlConnection CreateConnection()
        {
            return new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection")
            );
        }

        public async Task<IEnumerable<Student>> GetAllStudents()
        {
            using var connection = CreateConnection();

            string sql = @"
                SELECT
                    StudentId,
                    FullName,
                    Email,
                    Password,
                    Age,
                    MobileNumber,
                    Course,
                    Role
                FROM Students
                WHERE Role = 'Student'";

            return await connection.QueryAsync<Student>(sql);
        }

        public async Task<Student?> GetStudentById(int id)
        {
            using var connection = CreateConnection();

            string sql = @"
                SELECT
                    StudentId,
                    FullName,
                    Email,
                    Password,
                    Age,
                    MobileNumber,
                    Course,
                    Role
                FROM Students
                WHERE StudentId = @StudentId
                AND Role = 'Student'";

            return await connection.QueryFirstOrDefaultAsync<Student>(
                sql,
                new
                {
                    StudentId = id
                }
            );
        }

        public async Task<Student?> GetStudentByEmail(string email)
        {
            using var connection = CreateConnection();

            string sql = @"
                SELECT
                    StudentId,
                    FullName,
                    Email,
                    Password,
                    Age,
                    MobileNumber,
                    Course,
                    Role
                FROM Students
                WHERE Email = @Email";

            return await connection.QueryFirstOrDefaultAsync<Student>(
                sql,
                new
                {
                    Email = email
                }
            );
        }

        public async Task<int> CreateStudent(StudentCreateDto student)
        {
            using var connection = CreateConnection();

            string sql = @"
                INSERT INTO Students
                (
                    FullName,
                    Email,
                    Password,
                    Age,
                    MobileNumber,
                    Course,
                    Role
                )
                VALUES
                (
                    @FullName,
                    @Email,
                    @Password,
                    @Age,
                    @MobileNumber,
                    @Course,
                    'Student'
                );

                SELECT CAST(SCOPE_IDENTITY() AS INT);
            ";

            return await connection.ExecuteScalarAsync<int>(
                sql,
                student
            );
        }

        public async Task<int> CreateTeacher(TeacherCreateDto teacher)
        {
            using var connection = CreateConnection();

            string checkSql = @"
                SELECT COUNT(1)
                FROM Students
                WHERE Email = @Email";

            var exists = await connection.ExecuteScalarAsync<int>(
                checkSql,
                new
                {
                    teacher.Email
                }
            );

            if (exists > 0)
            {
                throw new Exception(
                    "A user with this email already exists."
                );
            }

            string sql = @"
                INSERT INTO Students
                (
                    FullName,
                    Email,
                    Password,
                    Age,
                    MobileNumber,
                    Course,
                    Role
                )
                VALUES
                (
                    @FullName,
                    @Email,
                    @Password,
                    0,
                    '',
                    '',
                    'Teacher'
                );

                SELECT CAST(SCOPE_IDENTITY() AS INT);
            ";

            return await connection.ExecuteScalarAsync<int>(
                sql,
                teacher
            );
        }

        public async Task<bool> UpdateStudent(
            int id,
            StudentCreateDto student)
        {
            using var connection = CreateConnection();

            string sql = @"
                UPDATE Students
                SET
                    FullName = @FullName,
                    Email = @Email,
                    Password = @Password,
                    Age = @Age,
                    MobileNumber = @MobileNumber,
                    Course = @Course
                WHERE StudentId = @StudentId
                AND Role = 'Student'";

            var rows = await connection.ExecuteAsync(
                sql,
                new
                {
                    StudentId = id,
                    student.FullName,
                    student.Email,
                    student.Password,
                    student.Age,
                    student.MobileNumber,
                    student.Course
                }
            );

            return rows > 0;
        }

        public async Task<bool> DeleteStudent(int id)
        {
            using var connection = CreateConnection();

            string sql = @"
                DELETE FROM Students
                WHERE StudentId = @StudentId
                AND Role = 'Student'";

            var rows = await connection.ExecuteAsync(
                sql,
                new
                {
                    StudentId = id
                }
            );

            return rows > 0;
        }
    }
}