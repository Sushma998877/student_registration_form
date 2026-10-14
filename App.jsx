import { useEffect, useRef, useState } from "react";
import React from "react";
import Login from "./Login";
import StudentRegistration from "./StudentRegistration";

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl) {
    return "https://student-registration-api-sushma-f3c7cbfgf5c0afa7.indiasouthcentral-01.azurewebsites.net";
  }

  if (!/^https?:\/\//i.test(rawUrl)) {
    return `https://${rawUrl.replace(/^\/+/, "")}`;
  }

  return rawUrl.replace(/\/+$/, "");
}

const apiBaseUrl = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ||
    "student-registration-api-sushma-f3c7cbfgf5c0afa7.indiasouthcentral-01.azurewebsites.net"
);

const apiUrl = `${apiBaseUrl}/api/Students`;
const loginUrl = `${apiBaseUrl}/api/Auth/login`;
const teacherUrl = `${apiBaseUrl}/api/Users/create-teacher`;

export default function App() {

  // =========================================================
  // PAGE
  // =========================================================

  const [page, setPage] = useState(() =>
    localStorage.getItem("token") &&
    localStorage.getItem("role")
      ? "dashboard"
      : "register"
  );

  // =========================================================
  // USER
  // =========================================================

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      return null;
    }

    return {
      token,
      role,
      studentId: localStorage.getItem("studentId") || "",
      fullName: localStorage.getItem("fullName") || "",
      email: localStorage.getItem("email") || "",
      age: localStorage.getItem("age") || "",
      mobileNumber:
        localStorage.getItem("mobileNumber") || "",
      course: localStorage.getItem("course") || "",
    };
  });

  // =========================================================
  // STUDENT PROFILE
  // =========================================================

  const [studentProfile, setStudentProfile] = useState(() => ({
    fullName: localStorage.getItem("fullName") || "",
    email: localStorage.getItem("email") || "",
    role: localStorage.getItem("role") || "",
    age: localStorage.getItem("age") || "",
    mobileNumber:
      localStorage.getItem("mobileNumber") || "",
    course: localStorage.getItem("course") || "",
  }));

  // =========================================================
  // STUDENTS
  // =========================================================

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);

  // =========================================================
  // TEACHER
  // =========================================================

  const [teacherForm, setTeacherForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [creatingTeacher, setCreatingTeacher] =
    useState(false);

  const [message, setMessage] = useState("");

  const editFormRef = useRef(null);

  // =========================================================
  // SCROLL TO EDIT FORM
  // =========================================================

  useEffect(() => {
    if (editingStudent) {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [editingStudent?.studentId]);

  // =========================================================
  // LOAD STUDENTS FOR ADMIN / TEACHER
  // =========================================================

  useEffect(() => {
    if (!user?.token) {
      return;
    }

    if (
      user.role === "Admin" ||
      user.role === "Teacher"
    ) {
      void loadStudents(user.token);
    }
  }, [user?.token, user?.role]);

  // =========================================================
  // REGISTRATION
  // =========================================================

  async function handleRegistration(studentDetails) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: studentDetails.name,
          email: studentDetails.email,
          password: studentDetails.password,
          age: Number(studentDetails.age),
          mobileNumber: studentDetails.mobile,
          course: studentDetails.course,
        }),
      });

      if (!response.ok) {
        let errorMessage =
          `Registration failed. Status: ${response.status}`;

        try {
          const responseText = await response.text();

          let errorData = null;

          try {
            errorData = JSON.parse(responseText);
          } catch {}

          if (errorData?.message) {
            errorMessage = errorData.message;
          }

          if (errorData?.title) {
            errorMessage = errorData.title;
          }
        } catch {}

        throw new Error(errorMessage);
      }

      setPage("login");
    } catch (error) {
      console.error("Registration error:", error);

      throw new Error(
        error.message || "Unable to register student."
      );
    }
  }

  // =========================================================
  // LOGIN
  // =========================================================

  async function handleLogin(loginDetails) {
    try {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginDetails.email.trim(),
          password: loginDetails.password,
        }),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {
          message:
            responseText ||
            "The server returned an unexpected response.",
        };
      }

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            "Email or password is incorrect."
        );
      }

      if (
        !["Admin", "Teacher", "Student"].includes(
          data.role
        )
      ) {
        throw new Error(
          "The account has an unsupported role."
        );
      }

      // =====================================================
      // SAVE LOGIN DETAILS
      // =====================================================

      localStorage.setItem(
        "token",
        data.token ?? ""
      );

      localStorage.setItem(
        "role",
        data.role ?? ""
      );

      localStorage.setItem(
        "studentId",
        data.studentId ?? ""
      );

      localStorage.setItem(
        "fullName",
        data.fullName ?? ""
      );

      localStorage.setItem(
        "email",
        data.email ?? ""
      );

      // =====================================================
      // SAVE AGE
      // =====================================================

      localStorage.setItem(
        "age",
        data.age ?? ""
      );

      // =====================================================
      // SAVE MOBILE NUMBER
      // =====================================================

      localStorage.setItem(
        "mobileNumber",
        data.mobileNumber ?? ""
      );

      // =====================================================
      // SAVE COURSE
      // =====================================================

      localStorage.setItem(
        "course",
        data.course ?? ""
      );

      // =====================================================
      // CREATE USER OBJECT
      // =====================================================

      const loggedInUser = {
        token: data.token ?? "",
        role: data.role ?? "",
        studentId: data.studentId ?? "",
        fullName: data.fullName ?? "",
        email: data.email ?? "",
        age: data.age ?? "",
        mobileNumber: data.mobileNumber ?? "",
        course: data.course ?? "",
      };

      setUser(loggedInUser);

      // =====================================================
      // CREATE STUDENT PROFILE
      // =====================================================

      setStudentProfile({
        fullName: data.fullName ?? "",
        email: data.email ?? "",
        role: data.role ?? "",
        age: data.age ?? "",
        mobileNumber: data.mobileNumber ?? "",
        course: data.course ?? "",
      });

      setPage("dashboard");
      setMessage("");

    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  async function loadStudents(
    currentToken = null,
    successMessage = ""
  ) {
    try {
      setLoadingStudents(true);
      setMessage("");

      const token =
        currentToken ||
        user?.token ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error(
          "Authentication failed. Please logout and login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You are not authorized to view student records."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load students."
        );
      }

      const data = await response.json();

      setStudents(
        Array.isArray(data) ? data : []
      );

      if (successMessage) {
        setMessage(successMessage);
      }

    } catch (error) {
      console.error(
        "Load students error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to load students."
      );

    } finally {
      setLoadingStudents(false);
    }
  }

  // =========================================================
  // TEACHER FORM
  // =========================================================

  function handleTeacherChange(event) {
    const { name, value } = event.target;

    setTeacherForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // =========================================================
  // CREATE TEACHER
  // =========================================================

  async function createTeacher(event) {
    event.preventDefault();

    setCreatingTeacher(true);
    setMessage("");

    try {
      const token =
        user?.token ||
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Authentication token not found. Please login again."
        );
        return;
      }

      const response = await fetch(teacherUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teacherForm),
      });

      const responseText =
        await response.text();

      let result = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        result = {
          message: responseText,
        };
      }

      if (response.status === 401) {
        throw new Error(
          "401 Unauthorized: Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "403 Forbidden: Only Admin users can create teachers."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.title ||
            `Teacher creation failed (${response.status}).`
        );
      }

      setTeacherForm({
        fullName: "",
        email: "",
        password: "",
      });

      setMessage(
        "Teacher account created successfully."
      );

    } catch (error) {
      console.error(
        "Create teacher error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to create teacher account."
      );

    } finally {
      setCreatingTeacher(false);
    }
  }

  // =========================================================
  // START EDIT
  // =========================================================

  function startEdit(student) {
    setEditingStudent({
      studentId: student.studentId,
      fullName: student.fullName || "",
      email: student.email || "",
      password: student.password || "",
      age: student.age ?? "",
      mobileNumber:
        student.mobileNumber || "",
      course: student.course || "",
    });

    setMessage("");
  }

  // =========================================================
  // EDIT CHANGE
  // =========================================================

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditingStudent((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // =========================================================
  // UPDATE STUDENT
  // =========================================================

  async function updateStudent(event) {
    event.preventDefault();

    try {
      setMessage("");

      const token =
        user?.token ||
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Authentication token not found. Please logout and login again."
        );
        return;
      }

      if (!editingStudent?.studentId) {
        setMessage(
          "Student ID is missing."
        );
        return;
      }

      const updateUrl =
        `${apiUrl}/${editingStudent.studentId}`;

      const updateData = {
        fullName:
          editingStudent.fullName,

        email:
          editingStudent.email,

        password:
          editingStudent.password,

        age: Number(
          editingStudent.age
        ),

        mobileNumber:
          editingStudent.mobileNumber,

        course:
          editingStudent.course,
      };

      console.log(
        "PUT URL:",
        updateUrl
      );

      console.log(
        "PUT data:",
        updateData
      );

      const response = await fetch(
        updateUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            updateData
          ),
        }
      );

      if (response.status === 401) {
        setMessage(
          "401 Unauthorized: Your JWT token is invalid or expired. Please logout and login again."
        );
        return;
      }

      if (response.status === 403) {
        setMessage(
          "403 Forbidden: Your account does not have permission to update students."
        );
        return;
      }

      if (!response.ok) {
        let errorMessage =
          "Failed to update student.";

        try {
          const responseText =
            await response.text();

          if (responseText) {
            try {
              const data =
                JSON.parse(responseText);

              if (data?.message) {
                errorMessage =
                  data.message;
              } else if (
                data?.title
              ) {
                errorMessage =
                  data.title;
              }

            } catch {
              errorMessage =
                responseText;
            }
          }

        } catch {}

        throw new Error(
          errorMessage
        );
      }

      setEditingStudent(null);

      await loadStudents(
        token,
        "Student updated successfully."
      );

    } catch (error) {
      console.error(
        "Update student error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to update student."
      );
    }
  }

  // =========================================================
  // DELETE STUDENT
  // =========================================================

  async function deleteStudent(id) {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this student?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const token =
        user?.token ||
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Authentication token not found. Please login again."
        );
        return;
      }

      const response =
        await fetch(
          `${apiUrl}/${id}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (response.status === 401) {
        setMessage(
          "401 Unauthorized: Your JWT token is invalid or expired."
        );
        return;
      }

      if (response.status === 403) {
        setMessage(
          "Only Admin users can delete students."
        );
        return;
      }

      if (!response.ok) {
        let errorMessage =
          "Failed to delete student.";

        try {
          const data =
            await response.json();

          if (data?.message) {
            errorMessage =
              data.message;
          }

        } catch {}

        throw new Error(
          errorMessage
        );
      }

      setMessage(
        "Student deleted successfully."
      );

      await loadStudents(token);

    } catch (error) {
      console.error(
        "Delete student error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to delete student."
      );
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("studentId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("age");
    localStorage.removeItem("mobileNumber");
    localStorage.removeItem("course");

    setUser(null);

    setStudentProfile({
      fullName: "",
      email: "",
      role: "",
      age: "",
      mobileNumber: "",
      course: "",
    });

    setStudents([]);
    setEditingStudent(null);

    setTeacherForm({
      fullName: "",
      email: "",
      password: "",
    });

    setPage("login");
    setMessage("");
  }

  // =========================================================
  // REGISTER PAGE
  // =========================================================

  if (page === "register" && !user) {
    return (
      <StudentRegistration
        onRegistered={handleRegistration}
        onLogin={() =>
          setPage("login")
        }
      />
    );
  }

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (page === "login" && !user) {
    return (
      <Login
        onSubmit={handleLogin}
        onRegister={() =>
          setPage("register")
        }
      />
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  if (page === "dashboard" && user) {

    const isAdmin =
      user.role === "Admin";

    const isTeacher =
      user.role === "Teacher";

    const isStudent =
      user.role === "Student";

    const canManageStudents =
      isAdmin || isTeacher;

    const dashboardTitle =
      isAdmin
        ? "Admin Dashboard"
        : isTeacher
          ? "Teacher Dashboard"
          : "Student Dashboard";

    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "30px",
          background: "#f5f7fb",
          fontFamily:
            "Arial, sans-serif",
        }}
      >

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >

          {/* =====================================================
              HEADER
          ===================================================== */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "25px",
              background: "#ffffff",
              padding: "20px",
              borderRadius: "12px",
            }}
          >

            <div>

              <h1
                style={{
                  margin:
                    "0 0 8px",
                }}
              >
                {dashboardTitle}
              </h1>

              <p
                style={{
                  margin: 0,
                }}
              >
                Welcome{" "}
                <strong>
                  {user.fullName}
                </strong>
              </p>

              <p
                style={{
                  margin:
                    "6px 0 0",
                }}
              >
                Role:{" "}
                <strong>
                  {user.role}
                </strong>
              </p>

            </div>

            <button
              onClick={logout}
              style={{
                padding:
                  "10px 18px",
                border: "none",
                borderRadius: "6px",
                cursor:
                  "pointer",
              }}
            >
              Logout
            </button>

          </div>

          {/* =====================================================
              MESSAGE
          ===================================================== */}

          {message && (
            <div
              style={{
                marginBottom:
                  "20px",
                padding: "12px",
                background:
                  "#ffffff",
                borderRadius: "8px",
              }}
            >
              {message}
            </div>
          )}

          {/* =====================================================
              ADMIN / TEACHER STUDENT RECORDS
          ===================================================== */}

          {canManageStudents && (
            <div
              style={{
                background:
                  "#ffffff",
                padding: "20px",
                borderRadius:
                  "12px",
                marginBottom:
                  "25px",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  marginBottom:
                    "20px",
                }}
              >

                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Student Records
                </h2>

                <button
                  onClick={() =>
                    loadStudents()
                  }
                  disabled={
                    loadingStudents
                  }
                  style={{
                    padding:
                      "10px 18px",
                    cursor:
                      loadingStudents
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {loadingStudents
                    ? "Loading..."
                    : "View Students"}
                </button>

              </div>

              {loadingStudents ? (
                <p>
                  Loading students
                  from database...
                </p>

              ) : students.length ===
                0 ? (

                <p>
                  No student
                  records found
                  in the database.
                </p>

              ) : (

                <div
                  style={{
                    overflowX:
                      "auto",
                  }}
                >

                  <table
                    style={{
                      width:
                        "100%",
                      borderCollapse:
                        "collapse",
                    }}
                  >

                    <thead>

                      <tr>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          ID
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Full Name
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Email
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Age
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Mobile
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Course
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Role
                        </th>

                        <th
                          style={
                            tableHeaderStyle
                          }
                        >
                          Actions
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {students.map(
                        (student) => (

                          <tr
                            key={
                              student.studentId
                            }
                          >

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                student.studentId
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                student.fullName
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                student.email
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                student.age
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                student.mobileNumber
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                student.course
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                student.role
                              }
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >

                              <button
                                onClick={() =>
                                  startEdit(
                                    student
                                  )
                                }
                                style={{
                                  marginRight:
                                    "8px",
                                  padding:
                                    "7px 12px",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                Update
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() =>
                                    deleteStudent(
                                      student.studentId
                                    )
                                  }
                                  style={{
                                    padding:
                                      "7px 12px",
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              )}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>
          )}

          {/* =====================================================
              STUDENT ACCOUNT
          ===================================================== */}

          {isStudent && (
            <div
              style={{
                background:
                  "#ffffff",
                padding: "25px",
                borderRadius:
                  "12px",
              }}
            >

              <h2>
                My Account
              </h2>

              <p>
                <strong>Name:</strong>{" "}
                {studentProfile.fullName ||
                  user.fullName}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {studentProfile.email ||
                  user.email}
              </p>

              <p>
                <strong>Role:</strong>{" "}
                {studentProfile.role ||
                  user.role}
              </p>

              <p>
                <strong>Course:</strong>{" "}
                {studentProfile.course ||
                  user.course}
              </p>

              <p>
                <strong>Age:</strong>{" "}
                {studentProfile.age ||
                  user.age}
              </p>

              <p>
                <strong>
                  Mobile Number:
                </strong>{" "}
                {studentProfile.mobileNumber ||
                  user.mobileNumber}
              </p>

            </div>
          )}

          {/* =====================================================
              ADMIN CREATE TEACHER
          ===================================================== */}

          {isAdmin && (
            <section
              style={{
                background:
                  "#ffffff",
                padding: "20px",
                borderRadius:
                  "12px",
                marginBottom:
                  "25px",
              }}
            >

              <h2>
                Create Teacher
              </h2>

              <p>
                Create a Teacher
                account from
                the Admin
                Dashboard.
              </p>

              <form
                onSubmit={
                  createTeacher
                }
              >

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "15px",
                  }}
                >

                  <input
                    name="fullName"
                    value={
                      teacherForm.fullName
                    }
                    onChange={
                      handleTeacherChange
                    }
                    placeholder="Full Name"
                    autoComplete="name"
                    required
                    style={
                      inputStyle
                    }
                  />

                  <input
                    name="email"
                    type="email"
                    value={
                      teacherForm.email
                    }
                    onChange={
                      handleTeacherChange
                    }
                    placeholder="Email"
                    autoComplete="email"
                    required
                    style={
                      inputStyle
                    }
                  />

                  <input
                    name="password"
                    type="password"
                    value={
                      teacherForm.password
                    }
                    onChange={
                      handleTeacherChange
                    }
                    placeholder="Password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    style={
                      inputStyle
                    }
                  />

                </div>

                <button
                  type="submit"
                  disabled={
                    creatingTeacher
                  }
                  style={{
                    marginTop:
                      "16px",
                    padding:
                      "10px 18px",
                    cursor:
                      creatingTeacher
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {creatingTeacher
                    ? "Creating..."
                    : "Create Teacher"}
                </button>

              </form>

            </section>
          )}

          {/* =====================================================
              UPDATE STUDENT
          ===================================================== */}

          {editingStudent && (
            <div
              ref={editFormRef}
              style={{
                background:
                  "#ffffff",
                padding: "25px",
                borderRadius:
                  "12px",
                marginTop:
                  "25px",
              }}
            >

              <h2>
                Update Student
              </h2>

              <p>
                Editing{" "}
                {
                  editingStudent.fullName
                }
              </p>

              <form
                onSubmit={
                  updateStudent
                }
              >

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "15px",
                  }}
                >

                  <input
                    name="fullName"
                    value={
                      editingStudent.fullName
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="Full Name"
                    required
                    style={
                      inputStyle
                    }
                  />

                  <input
                    name="email"
                    type="email"
                    value={
                      editingStudent.email
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="Email"
                    required
                    style={
                      inputStyle
                    }
                  />

                  <input
                    name="password"
                    type="password"
                    value={
                      editingStudent.password
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="Password"
                    required
                    style={
                      inputStyle
                    }
                  />

                  <input
                    name="age"
                    type="number"
                    value={
                      editingStudent.age
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="Age"
                    required
                    style={
                      inputStyle
                    }
                  />

                  <input
                    name="mobileNumber"
                    value={
                      editingStudent.mobileNumber
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="Mobile Number"
                    required
                    style={
                      inputStyle
                    }
                  />

                  <input
                    name="course"
                    value={
                      editingStudent.course
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="Course"
                    required
                    style={
                      inputStyle
                    }
                  />

                </div>

                <div
                  style={{
                    marginTop:
                      "20px",
                  }}
                >

                  <button
                    type="submit"
                    style={{
                      marginRight:
                        "10px",
                      padding:
                        "10px 18px",
                      cursor:
                        "pointer",
                    }}
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingStudent(
                        null
                      )
                    }
                    style={{
                      padding:
                        "10px 18px",
                      cursor:
                        "pointer",
                    }}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>
          )}

        </div>

      </main>
    );
  }

  return null;
}

// =========================================================
// STYLES
// =========================================================

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
};

const tableHeaderStyle = {
  padding: "12px",
  borderBottom:
    "2px solid #ddd",
  textAlign: "left",
  whiteSpace:
    "nowrap",
};

const tableCellStyle = {
  padding: "12px",
  borderBottom:
    "1px solid #ddd",
  textAlign: "left",
};