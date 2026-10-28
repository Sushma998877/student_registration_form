
import React, { useCallback, useEffect, useRef, useState } from "react";
import Login from "./Login";
import StudentRegistration from "./StudentRegistration";
import ToastNotification from "./ToastNotification";

// =========================================================
// API CONFIGURATION
// =========================================================

function normalizeApiBaseUrl(rawUrl) {
  const defaultUrl =
    "https://student-registration-api-sushma-f3c7cbfgf5c0afa7.indiasouthcentral-01.azurewebsites.net";

  let url = (rawUrl || defaultUrl).trim();

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }

  while (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  url = url.replace(/\/api$/i, "");

  return url;
}

const apiBaseUrl = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL
);

const apiUrl = `${apiBaseUrl}/api/Students`;
const loginUrl = `${apiBaseUrl}/api/Auth/login`;
const teacherUrl = `${apiBaseUrl}/api/Users/create-teacher`;

function isUnauthenticatedPage(page, targetPage, user) {
  return page === targetPage && !user;
}

// =========================================================
// APP
// =========================================================

export default function App() {
  // PAGE
  const [page, setPage] = useState(() =>
    localStorage.getItem("token") &&
    localStorage.getItem("role")
      ? "dashboard"
      : "register"
  );

  // USER
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) return null;

    return {
      token,
      role,
      studentId: localStorage.getItem("studentId") || "",
      fullName: localStorage.getItem("fullName") || "",
      email: localStorage.getItem("email") || "",
      age: localStorage.getItem("age") || "",
      mobileNumber: localStorage.getItem("mobileNumber") || "",
      course: localStorage.getItem("course") || "",
    };
  });

  // STUDENT PROFILE
  const [studentProfile, setStudentProfile] = useState(() => ({
    fullName: localStorage.getItem("fullName") || "",
    email: localStorage.getItem("email") || "",
    role: localStorage.getItem("role") || "",
    age: localStorage.getItem("age") || "",
    mobileNumber: localStorage.getItem("mobileNumber") || "",
    course: localStorage.getItem("course") || "",
  }));

  // STUDENTS
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // TEACHER
  const [teacherForm, setTeacherForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [message, setMessage] = useState("");
  const [notification, setNotification] = useState(null);
  const editFormRef = useRef(null);

  const showToast = useCallback((toastMessage, type = "success") => {
    setNotification({
      message: toastMessage,
      type,
    });
  }, []);

  const dismissToast = useCallback(() => {
    setNotification(null);
  }, []);

  // Scroll to the edit form when a student is selected.
  useEffect(() => {
    if (editingStudent) {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [editingStudent?.studentId]);

  // Load students for Admin and Teacher.
  useEffect(() => {
    if (
      user?.token &&
      ["Admin", "Teacher"].includes(user.role)
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
        const responseText = await response.text();
        let errorMessage =
          `Registration failed. Status: ${response.status}`;

        try {
          const data = JSON.parse(responseText);
          errorMessage =
            data.message || data.title || errorMessage;
        } catch {
          if (responseText) errorMessage = responseText;
        }

        throw new Error(errorMessage);
      }

      setMessage("");
      showToast("Registration successful. You can now sign in.");
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
      console.log("Login URL:", loginUrl);

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

      console.log("Login status:", response.status);
      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.title ||
          `Login failed. HTTP status: ${response.status}`
        );
      }

      if (!["Admin", "Teacher", "Student"].includes(data.role)) {
        throw new Error("The account has an unsupported role.");
      }

      if (!data.token) {
        throw new Error(
          "The server did not return an authentication token."
        );
      }

      const loggedInUser = {
        token: data.token,
        role: data.role,
        studentId: data.studentId ?? "",
        fullName: data.fullName ?? "",
        email: data.email ?? loginDetails.email.trim(),
        age: data.age ?? "",
        mobileNumber: data.mobileNumber ?? "",
        course: data.course ?? "",
      };

      Object.entries(loggedInUser).forEach(([key, value]) => {
        localStorage.setItem(key, String(value ?? ""));
      });

      setUser(loggedInUser);

      setStudentProfile({
        fullName: loggedInUser.fullName,
        email: loggedInUser.email,
        role: loggedInUser.role,
        age: loggedInUser.age,
        mobileNumber: loggedInUser.mobileNumber,
        course: loggedInUser.course,
      });

      setMessage("");
      showToast(
        `Login successful. Welcome back, ${loggedInUser.fullName || loggedInUser.role}.`
      );
      setPage("dashboard");
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
          `Failed to load students. HTTP status: ${response.status}`
        );
      }

      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);

      if (successMessage) {
        setMessage(successMessage);
      }
    } catch (error) {
      console.error("Load students error:", error);
      setMessage(error.message || "Unable to load students.");
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
      const token = user?.token || localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(teacherUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teacherForm),
      });

      const responseText = await response.text();
      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = { message: responseText };
      }

      if (response.status === 401) {
        throw new Error("401 Unauthorized: Please login again.");
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

      showToast("Teacher account created successfully.");
    } catch (error) {
      console.error("Create teacher error:", error);
      showToast(
        error.message || "Unable to create teacher account.",
        "error"
      );
    } finally {
      setCreatingTeacher(false);
    }
  }

  // =========================================================
  // EDIT STUDENT
  // =========================================================

  function startEdit(student) {
    setEditingStudent({
      studentId: student.studentId,
      fullName: student.fullName || "",
      email: student.email || "",
      password: "",
      age: student.age ?? "",
      mobileNumber: student.mobileNumber || "",
      course: student.course || "",
    });

    setMessage("");
  }

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

      const token = user?.token || localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      if (!editingStudent?.studentId) {
        throw new Error("Student ID is missing.");
      }

      const updateUrl =
        `${apiUrl}/${editingStudent.studentId}`;

      const updateData = {
        fullName: editingStudent.fullName,
        email: editingStudent.email,
        age: Number(editingStudent.age),
        mobileNumber: editingStudent.mobileNumber,
        course: editingStudent.course,
      };

      if (editingStudent.password.trim()) {
        updateData.password = editingStudent.password;
      }

      console.log("PUT URL:", updateUrl);

      const response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.status === 401) {
        throw new Error(
          "401 Unauthorized: Please logout and login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "403 Forbidden: You do not have permission to update students."
        );
      }

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = "Failed to update student.";

        try {
          const data = JSON.parse(responseText);
          errorMessage =
            data.message || data.title || errorMessage;
        } catch {
          if (responseText) errorMessage = responseText;
        }

        throw new Error(errorMessage);
      }

      setEditingStudent(null);
      showToast("Student updated successfully.");
      await loadStudents(token);
    } catch (error) {
      console.error("Update student error:", error);
      showToast(
        error.message || "Unable to update student.",
        "error"
      );
    }
  }

  // =========================================================
  // DELETE STUDENT
  // =========================================================

  async function deleteStudent(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this student?"
      )
    ) {
      return;
    }

    try {
      setMessage("");

      const token = user?.token || localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(`${apiUrl}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error(
          "401 Unauthorized: Your JWT token is invalid or expired."
        );
      }

      if (response.status === 403) {
        throw new Error("Only Admin users can delete students.");
      }

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = "Failed to delete student.";

        try {
          const data = JSON.parse(responseText);
          errorMessage =
            data.message || data.title || errorMessage;
        } catch {
          if (responseText) errorMessage = responseText;
        }

        throw new Error(errorMessage);
      }

      setEditingStudent(null);
      showToast("Student deleted successfully.");
      await loadStudents(token);
    } catch (error) {
      console.error("Delete student error:", error);
      showToast(
        error.message || "Unable to delete student.",
        "error"
      );
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function logout() {
    [
      "token",
      "role",
      "studentId",
      "fullName",
      "email",
      "age",
      "mobileNumber",
      "course",
    ].forEach((key) => localStorage.removeItem(key));

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
  // REGISTRATION PAGE
  // =========================================================

  if (isUnauthenticatedPage(page, "register", user)) {
    return (
      <>
        <ToastNotification
          notification={notification}
          onDismiss={dismissToast}
        />
        <StudentRegistration
          onRegistered={handleRegistration}
          onLogin={() => setPage("login")}
          onNotify={showToast}
        />
      </>
    );
  }

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (isUnauthenticatedPage(page, "login", user)) {
    return (
      <>
        <ToastNotification
          notification={notification}
          onDismiss={dismissToast}
        />
        <Login
          onSubmit={handleLogin}
          onRegister={() => setPage("register")}
          onNotify={showToast}
        />
      </>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  if (page === "dashboard" && user) {
    const isAdmin = user.role === "Admin";
    const isTeacher = user.role === "Teacher";
    const isStudent = user.role === "Student";
    const canManageStudents = isAdmin || isTeacher;

    const dashboardTitle =
      dashboardTitles[user.role] || "Student Dashboard";

    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "30px",
          background: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <ToastNotification
          notification={notification}
          onDismiss={dismissToast}
        />
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* HEADER */}
          <header style={dashboardHeaderStyle}>
            <div>
              <h1 style={dashboardTitleStyle}>
                {dashboardTitle}
              </h1>

              <p style={welcomeTextStyle}>
                Welcome <strong>{user.fullName}</strong>
              </p>

              <p style={roleTextStyle}>
                Role: <strong>{user.role}</strong>
              </p>
            </div>

            <button onClick={logout} style={buttonStyle}>
              Logout
            </button>
          </header>

          {/* MESSAGE */}
          {message && (
            <output style={messageStyle}>
              {message}
            </output>
          )}

          {/* ADMIN AND TEACHER STUDENT RECORDS */}
          {canManageStudents && (
            <section style={{ ...sectionCardStyle, marginTop: "25px" }}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>
                  Student Records
                </h2>

                <button
                  onClick={() => loadStudents()}
                  disabled={loadingStudents}
                  style={{
                    ...buttonStyle,
                    opacity: loadingStudents ? 0.7 : 1,
                    cursor: loadingStudents
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {loadingStudents
                    ? "Loading..."
                    : "View Students"}
                </button>
              </div>

              <StudentRecordsContent
                isAdmin={isAdmin}
                students={students}
                loading={loadingStudents}
                onDelete={deleteStudent}
                onEdit={startEdit}
              />
            </section>
          )}

          {/* STUDENT ACCOUNT */}
          {isStudent && (
            <section style={{ ...sectionCardStyle, marginTop: "25px" }}>
              <h2>My Account</h2>
              <p>
                <strong>Name:</strong>{" "}
                {studentProfile.fullName || user.fullName}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {studentProfile.email || user.email}
              </p>
              <p>
                <strong>Role:</strong>{" "}
                {studentProfile.role || user.role}
              </p>
              <p>
                <strong>Course:</strong>{" "}
                {studentProfile.course || user.course}
              </p>
              <p>
                <strong>Age:</strong>{" "}
                {studentProfile.age || user.age}
              </p>
              <p>
                <strong>Mobile Number:</strong>{" "}
                {studentProfile.mobileNumber || user.mobileNumber}
              </p>
            </section>
          )}

          {/* ADMIN CREATE TEACHER */}
          {isAdmin && (
            <section style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Create Teacher</h2>

              <p>
                Create a Teacher account from the Admin Dashboard.
              </p>

              <form onSubmit={createTeacher}>
                <div style={formGridStyle}>
                  <input
                    name="fullName"
                    value={teacherForm.fullName}
                    onChange={handleTeacherChange}
                    placeholder="Full Name"
                    autoComplete="name"
                    required
                    style={inputStyle}
                  />

                  <input
                    name="email"
                    type="email"
                    value={teacherForm.email}
                    onChange={handleTeacherChange}
                    placeholder="Email"
                    autoComplete="email"
                    required
                    style={inputStyle}
                  />

                  <input
                    name="password"
                    type="password"
                    value={teacherForm.password}
                    onChange={handleTeacherChange}
                    placeholder="Password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingTeacher}
                  style={{
                    ...buttonStyle,
                    marginTop: "16px",
                    opacity: creatingTeacher ? 0.7 : 1,
                  }}
                >
                  {creatingTeacher
                    ? "Creating..."
                    : "Create Teacher"}
                </button>
              </form>
            </section>
          )}

          {/* UPDATE STUDENT */}
          {editingStudent && (
            <section
              ref={editFormRef}
              style={{ ...sectionCardStyle, marginTop: "25px" }}
            >
              <h2 style={sectionTitleStyle}>Update Student</h2>

              <p>Editing {editingStudent.fullName}</p>

              <form onSubmit={updateStudent}>
                <div style={formGridStyle}>
                  <input
                    name="fullName"
                    value={editingStudent.fullName}
                    onChange={handleEditChange}
                    placeholder="Full Name"
                    required
                    style={inputStyle}
                  />

                  <input
                    name="email"
                    type="email"
                    value={editingStudent.email}
                    onChange={handleEditChange}
                    placeholder="Email"
                    required
                    style={inputStyle}
                  />

                  <input
                    name="password"
                    type="password"
                    value={editingStudent.password}
                    onChange={handleEditChange}
                    placeholder="New password (optional)"
                    autoComplete="new-password"
                    style={inputStyle}
                  />

                  <input
                    name="age"
                    type="number"
                    value={editingStudent.age}
                    onChange={handleEditChange}
                    placeholder="Age"
                    required
                    style={inputStyle}
                  />

                  <input
                    name="mobileNumber"
                    value={editingStudent.mobileNumber}
                    onChange={handleEditChange}
                    placeholder="Mobile Number"
                    required
                    style={inputStyle}
                  />

                  <input
                    name="course"
                    value={editingStudent.course}
                    onChange={handleEditChange}
                    placeholder="Course"
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={formActionsStyle}>
                  <button
                    type="submit"
                    style={buttonStyle}
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>
    );
  }

  return null;
}

// =========================================================
// STUDENT PROFILE ITEM
// =========================================================

function ProfileItem({ label, value }) {
  return (
    <div style={profileItemStyle}>
      <span style={profileLabelStyle}>{label}</span>
      <span style={profileValueStyle}>
        {value || "Not provided"}
      </span>
    </div>
  );
}

function StudentRecordsContent({
  isAdmin,
  students,
  loading,
  onDelete,
  onEdit,
}) {
  if (loading) {
    return <p>Loading students from database...</p>;
  }

  if (students.length === 0) {
    return <p>No student records found in the database.</p>;
  }

  return (
    <div style={tableWrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {[
              "ID",
              "Full Name",
              "Email",
              "Age",
              "Mobile",
              "Course",
              "Role",
              "Actions",
            ].map((heading) => (
              <th key={heading} style={tableHeaderStyle}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr key={student.studentId}>
              <td style={tableCellStyle}>{student.studentId}</td>
              <td style={tableCellStyle}>{student.fullName}</td>
              <td style={tableCellStyle}>{student.email}</td>
              <td style={tableCellStyle}>{student.age}</td>
              <td style={tableCellStyle}>{student.mobileNumber}</td>
              <td style={tableCellStyle}>{student.course}</td>
              <td style={tableCellStyle}>{student.role}</td>
              <td style={actionsCellStyle}>
                <div style={actionsContainerStyle}>
                  <button
                    onClick={() => onEdit(student)}
                    style={buttonStyle}
                  >
                    Update
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => onDelete(student.studentId)}
                      style={deleteButtonStyle}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================
// UI STYLES
// =========================================================

const dashboardTitles = {
  Admin: "Admin Dashboard",
  Teacher: "Teacher Dashboard",
  Student: "Student Dashboard",
};

const pageStyle = {
  minHeight: "100vh",
  padding: "30px",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#1f2937",
  boxSizing: "border-box",
};

const dashboardContainerStyle = {
  maxWidth: "1200px",
  width: "100%",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const dashboardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "20px",
  background: "#ffffff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  boxSizing: "border-box",
};

const dashboardTitleStyle = {
  margin: "0 0 8px",
  fontSize: "28px",
  color: "#1f2937",
};

const welcomeTextStyle = {
  margin: "0 0 6px",
  color: "#374151",
};

const roleTextStyle = {
  margin: 0,
  color: "#6b7280",
};

const sectionCardStyle = {
  display: "block",
  width: "100%",
  minWidth: 0,
  background: "#ffffff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  boxSizing: "border-box",
};

const messageStyle = {
  width: "100%",
  padding: "16px 20px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const sectionHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "15px",
  marginBottom: "20px",
  width: "100%",
};

const sectionTitleStyle = {
  margin: "0 0 16px",
  fontSize: "22px",
  color: "#1f2937",
};

const tableWrapperStyle = {
  width: "100%",
  maxWidth: "100%",
  overflowX: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
};

const tableStyle = {
  width: "100%",
  minWidth: "950px",
  borderCollapse: "collapse",
  tableLayout: "auto",
  background: "#ffffff",
};

const tableHeaderStyle = {
  padding: "14px 16px",
  borderBottom: "2px solid #e5e7eb",
  textAlign: "left",
  whiteSpace: "nowrap",
  background: "#f1f5f9",
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
};

const tableCellStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  fontSize: "14px",
};

const actionsCellStyle = {
  ...tableCellStyle,
  whiteSpace: "normal",
  minWidth: "150px",
};

const actionsContainerStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "15px",
  width: "100%",
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  background: "#ffffff",
};

const buttonStyle = {
  padding: "10px 18px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  cursor: "pointer",
  background: "#ffffff",
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "500",
  whiteSpace: "nowrap",
};

const deleteButtonStyle = {
  ...buttonStyle,
  color: "#b91c1c",
  borderColor: "#fecaca",
  background: "#fff7f7",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#f3f4f6",
};

const formActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "20px",
};

const profileGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const profileItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "16px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  background: "#fafafa",
  minWidth: 0,
  overflowWrap: "anywhere",
};

const profileLabelStyle = {
  color: "#6b7280",
  fontSize: "13px",
};

const profileValueStyle = {
  color: "#1f2937",
  fontSize: "15px",
  fontWeight: "600",
  overflowWrap: "anywhere",
};
