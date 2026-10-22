
using Dapper;
using Npgsql;
using StudentRegistrationAPI.DTOs;
using StudentRegistrationAPI.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace StudentRegistrationAPI.Repositories
{
    public class StudentRepository : IStudentRepository
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<StudentRepository> _logger;

        public StudentRepository(
            IConfiguration configuration,
            ILogger<StudentRepository> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        // CREATE DATABASE CONNECTION
        private NpgsqlConnection CreateConnection()
        {
            var connectionString =
                _configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                _logger.LogError(
                    "Database connection string DefaultConnection is missing.");

                throw new InvalidOperationException(
                    "Database connection string 'DefaultConnection' is not configured.");
            }

            var connectionStringBuilder =
                new NpgsqlConnectionStringBuilder(connectionString);

            _logger.LogInformation(
                "Database configuration: Host={DatabaseHost}, Port={DatabasePort}",
                connectionStringBuilder.Host,
                connectionStringBuilder.Port);

            return new NpgsqlConnection(
                connectionStringBuilder.ConnectionString);
        }

        // GET ALL STUDENTS
        public async Task<IEnumerable<Student>> GetAllStudents()
        {
            using var connection = CreateConnection();

            string sql = @"
                SELECT
                    id AS ""StudentId"",
                    fullname AS ""FullName"",
                    email AS ""Email"",
                    age AS ""Age"",
                    mobilenumber AS ""MobileNumber"",
                    course AS ""Course"",
                    role AS ""Role""
                FROM students
                WHERE role = 'Student'";

            return await connection.QueryAsync<Student>(sql);
        }

        // GET STUDENT BY ID
        public async Task<Student?> GetStudentById(int id)
        {
            using var connection = CreateConnection();

            string sql = @"
                SELECT
                    id AS ""StudentId"",
                    fullname AS ""FullName"",
                    email AS ""Email"",
                    age AS ""Age"",
                    mobilenumber AS ""MobileNumber"",
                    course AS ""Course"",
                    role AS ""Role""
                FROM students
                WHERE id = @StudentId
                  AND role = 'Student'";

            return await connection.QueryFirstOrDefaultAsync<Student>(
                sql,
                new { StudentId = id });
        }

        // GET STUDENT BY EMAIL
        public async Task<Student?> GetStudentByEmail(string email)
        {
            using var connection = CreateConnection();

            string sql = @"
                SELECT
                    id AS ""StudentId"",
                    fullname AS ""FullName"",
                    email AS ""Email"",
                    password AS ""Password"",
                    age AS ""Age"",
                    mobilenumber AS ""MobileNumber"",
                    course AS ""Course"",
                    role AS ""Role""
                FROM students
                WHERE LOWER(email) = LOWER(@Email)
                LIMIT 1";

            return await connection.QueryFirstOrDefaultAsync<Student>(
                sql,
                new { Email = email.Trim() });
        }

        // CREATE STUDENT
        public async Task<int> CreateStudent(StudentCreateDto student)
        {
            using var connection = CreateConnection();

            string sql = @"
                INSERT INTO students
                (
                    fullname,
                    email,
                    password,
                    age,
                    mobilenumber,
                    course,
                    role
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
                )
                RETURNING id;";

            return await connection.ExecuteScalarAsync<int>(
                sql,
                student);
        }

        // CREATE TEACHER
        public async Task<int> CreateTeacher(TeacherCreateDto teacher)
        {
            using var connection = CreateConnection();

            string checkSql = @"
                SELECT COUNT(1)
                FROM students
                WHERE LOWER(email) = LOWER(@Email)";

            var exists = await connection.ExecuteScalarAsync<int>(
                checkSql,
                new { teacher.Email });

            if (exists > 0)
            {
                throw new Exception(
                    "A user with this email already exists.");
            }

            string sql = @"
                INSERT INTO students
                (
                    fullname,
                    email,
                    password,
                    age,
                    mobilenumber,
                    course,
                    role
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
                )
                RETURNING id;";

            return await connection.ExecuteScalarAsync<int>(
                sql,
                teacher);
        }

        // UPDATE STUDENT PROFILE
        public async Task<bool> UpdateStudent(
            int id,
            StudentUpdateDto student)
        {
            using var connection = CreateConnection();

            string sql = @"
                UPDATE students
                SET
                    fullname = @FullName,
                    email = @Email,
                    age = @Age,
                    mobilenumber = @MobileNumber,
                    course = @Course
                WHERE id = @StudentId
                  AND role = 'Student'";

            var rows = await connection.ExecuteAsync(
                sql,
                new
                {
                    StudentId = id,
                    FullName = student.FullName,
                    Email = student.Email,
                    Age = student.Age,
                    MobileNumber = student.MobileNumber,
                    Course = student.Course
                });

            return rows > 0;
        }

        // DELETE STUDENT
        public async Task<bool> DeleteStudent(int id)
        {
            using var connection = CreateConnection();

            string sql = @"
                DELETE FROM students
                WHERE id = @StudentId
                  AND role = 'Student'";

            var rows = await connection.ExecuteAsync(
                sql,
                new { StudentId = id });

            return rows > 0;
        }
    }
}
