import {
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import App from "../../App.jsx";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App navigation", () => {
  it("shows the registration page when no user is logged in", () => {
    localStorage.clear();

    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Student Registration",
      })
    ).toBeInTheDocument();
  });

  it("navigates to the login page when Sign in is clicked", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      })
    ).toBeInTheDocument();
  });

  it("navigates back to registration when Create an account is clicked", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create an account",
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Student Registration",
      })
    ).toBeInTheDocument();
  });
});

describe("App API handling", () => {
  async function fillRegistrationForm(user) {
    await user.type(
      screen.getByLabelText(/full name/i),
      "Test Student"
    );
    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );
    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );
    await user.type(
      screen.getByLabelText(/^age$/i),
      "20"
    );
    await user.type(
      screen.getByLabelText(/mobile number/i),
      "9876543210"
    );
    await user.selectOptions(
      screen.getByLabelText(/^course$/i),
      "computer-science"
    );
  }

  async function openLoginAndFillForm(user) {
    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );
    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );
  }

  it("registers a student successfully", async () => {
    const user = userEvent.setup();

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: vi.fn().mockResolvedValue(""),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);
    await fillRegistrationForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back",
      })
    ).toBeInTheDocument();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Registration successful. You can now sign in."
    );

    expect(mockedFetch).toHaveBeenCalledOnce();

    const request = mockedFetch.mock.calls[0][1];

    expect(request.method).toBe("POST");
    expect(JSON.parse(request.body)).toEqual({
      fullName: "Test Student",
      email: "student@example.com",
      password: "Password123",
      age: 20,
      mobileNumber: "9876543210",
      course: "computer-science",
    });
  });

  it("displays an error when registration fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          message: "Email already exists.",
        })
      ),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);
    await fillRegistrationForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    expect(
      await screen.findByText("Email already exists.")
    ).toBeInTheDocument();
  });

  it("displays a plain-text error when registration fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(
        "Registration service unavailable"
      ),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);
    await fillRegistrationForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    expect(
      await screen.findByText(
        "Registration service unavailable"
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledOnce();
  });

  it("logs in successfully and saves the session", async () => {
    const user = userEvent.setup();

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          token: "test-token",
          role: "Student",
          studentId: "123",
          fullName: "Test Student",
          email: "student@example.com",
          age: 20,
          mobileNumber: "9876543210",
          course: "computer-science",
        })
      ),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);
    await openLoginAndFillForm(user);

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByRole("heading", {
        name: "Student Dashboard",
      })
    ).toBeInTheDocument();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Login successful. Welcome back, Test Student."
    );

    expect(localStorage.getItem("token")).toBe("test-token");
    expect(localStorage.getItem("role")).toBe("Student");
    expect(localStorage.getItem("email")).toBe(
      "student@example.com"
    );

    const request = mockedFetch.mock.calls[0][1];

    expect(request.method).toBe("POST");
    expect(JSON.parse(request.body)).toEqual({
      email: "student@example.com",
      password: "Password123",
    });
  });

  it("displays an error when login fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          message: "Invalid email or password.",
        })
      ),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);
    await openLoginAndFillForm(user);

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Invalid email or password.");

    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("App dashboard", () => {
  it("loads and displays student records for an Admin", async () => {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([
        {
          studentId: "101",
          fullName: "Asha Rao",
          email: "asha@example.com",
          age: 21,
          mobileNumber: "9876543210",
          course: "Science",
          role: "Student",
        },
      ]),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    expect(
      screen.getByText("asha@example.com")
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/Students"),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer admin-test-token",
        },
      })
    );
  });
});

describe("App teacher creation", () => {
  it("allows an Admin to create a teacher successfully", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({ message: "Created" })
        ),
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    await user.type(
      screen.getByPlaceholderText("Full Name"),
      "Test Teacher"
    );
    await user.type(
      screen.getByPlaceholderText("Email"),
      "teacher@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("Password"),
      "TeacherPass123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create Teacher",
      })
    );

    expect(
      await screen.findByText(
        "Teacher account created successfully."
      )
    ).toBeInTheDocument();

    const teacherRequest = mockedFetch.mock.calls.find(
      ([url, options]) =>
        String(url).includes("/api/Users/create-teacher") &&
        options?.method === "POST"
    );

    expect(teacherRequest).toBeDefined();

    expect(teacherRequest[1].headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer admin-test-token",
    });

    expect(JSON.parse(teacherRequest[1].body)).toEqual({
      fullName: "Test Teacher",
      email: "teacher@example.com",
      password: "TeacherPass123",
    });

    expect(
      screen.getByPlaceholderText("Full Name")
    ).toHaveValue("");
  });
});

describe("App student dashboard and logout", () => {
  function setStudentSession() {
    localStorage.setItem("token", "student-test-token");
    localStorage.setItem("role", "Student");
    localStorage.setItem("studentId", "101");
    localStorage.setItem("fullName", "Test Student");
    localStorage.setItem("email", "student@example.com");
    localStorage.setItem("age", "20");
    localStorage.setItem("mobileNumber", "9876543210");
    localStorage.setItem("course", "Computer Science");
  }

  it("displays the logged-in student's dashboard and account details", () => {
    setStudentSession();

    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Student Dashboard",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "My Account",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("student@example.com")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Computer Science")
    ).toBeInTheDocument();
  });

  it("logs out the student and returns to the login page", async () => {
    const user = userEvent.setup();

    setStudentSession();

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Logout" })
    );

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      })
    ).toBeInTheDocument();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("email")).toBeNull();
  });
});

describe("App student editing", () => {
  it("allows a Teacher to update an existing student", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "teacher-test-token");
    localStorage.setItem("role", "Teacher");
    localStorage.setItem("fullName", "Teacher User");
    localStorage.setItem("email", "teacher@example.com");

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });

    const existingStudent = {
      studentId: "101",
      fullName: "Asha Rao",
      email: "asha@example.com",
      age: 21,
      mobileNumber: "9876543210",
      course: "Science",
      role: "Student",
    };

    const updatedStudent = {
      ...existingStudent,
      fullName: "Asha Updated",
    };

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([existingStudent]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: vi.fn().mockResolvedValue(""),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([updatedStudent]),
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    expect(
      screen.getByRole("heading", { name: "Update Student" })
    ).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("Full Name");

    await user.clear(nameInput);
    await user.type(nameInput, "Asha Updated");

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Student updated successfully."
    );

    expect(
      await screen.findByText("Asha Updated")
    ).toBeInTheDocument();

    const updateRequest = mockedFetch.mock.calls.find(
      ([url, options]) =>
        options?.method === "PUT" &&
        String(url).includes("/api/Students/101")
    );

    expect(updateRequest).toBeDefined();

    const updateBody = JSON.parse(updateRequest[1].body);

    expect(updateBody.fullName).toBe("Asha Updated");
    expect(updateBody.email).toBe("asha@example.com");
    expect(updateBody.age).toBe(21);
    expect(updateBody).not.toHaveProperty("password");
  });
});

describe("App student deletion", () => {
  it("deletes a student after Admin confirmation", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    const student = {
      studentId: "101",
      fullName: "Asha Rao",
      email: "asha@example.com",
      age: 21,
      mobileNumber: "9876543210",
      course: "Science",
      role: "Student",
    };

    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([student]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Delete" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this student?"
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Student deleted successfully."
    );

    expect(
      screen.queryByText("Asha Rao")
    ).not.toBeInTheDocument();

    const deleteRequest = mockedFetch.mock.calls.find(
      ([url, options]) =>
        options?.method === "DELETE" &&
        String(url).includes("/api/Students/101")
    );

    expect(deleteRequest).toBeDefined();

    expect(deleteRequest[1].headers).toEqual({
      Authorization: "Bearer admin-test-token",
    });
  });
});

describe("App student deletion cancellation", () => {
  it("does not delete a student when the Admin cancels confirmation", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    vi.spyOn(window, "confirm").mockReturnValue(false);

    const student = {
      studentId: "101",
      fullName: "Asha Rao",
      email: "asha@example.com",
      age: 21,
      mobileNumber: "9876543210",
      course: "Science",
      role: "Student",
    };

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([student]),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Delete" })
    );

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(mockedFetch).toHaveBeenCalledOnce();
    expect(mockedFetch.mock.calls[0][1].method).toBe("GET");

    expect(
      screen.getByText("Asha Rao")
    ).toBeInTheDocument();
  });
});

describe("App student-loading errors", () => {
  function setAdminSession() {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");
  }

  it("shows an error when the session is unauthorized", async () => {
    setAdminSession();

    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })
    );

    render(<App />);

    expect(
      await screen.findByText(
        "Authentication failed. Please logout and login again."
      )
    ).toBeInTheDocument();
  });

  it("shows an error when the user is forbidden from viewing student records", async () => {
    setAdminSession();

    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      })
    );

    render(<App />);

    expect(
      await screen.findByText(
        "You are not authorized to view student records."
      )
    ).toBeInTheDocument();
  });
});

describe("App student update errors", () => {
  function prepareTeacherAndStudent() {
    localStorage.setItem("token", "teacher-test-token");
    localStorage.setItem("role", "Teacher");
    localStorage.setItem("fullName", "Teacher User");
    localStorage.setItem("email", "teacher@example.com");

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  }

  const student = {
    studentId: "101",
    fullName: "Asha Rao",
    email: "asha@example.com",
    age: 21,
    mobileNumber: "9876543210",
    course: "Science",
    role: "Student",
  };

  async function openEditForm(user) {
    await user.click(
      screen.getByRole("button", { name: "Update" })
    );
  }

  it("shows a permission error when updating a student returns 403", async () => {
    const user = userEvent.setup();

    prepareTeacherAndStudent();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([student]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await openEditForm(user);

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    expect(
      await screen.findByText(
        "403 Forbidden: You do not have permission to update students."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("displays the server error when updating a student returns 500", async () => {
    const user = userEvent.setup();

    prepareTeacherAndStudent();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([student]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            message: "Update service unavailable",
          })
        ),
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await openEditForm(user);

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    expect(
      await screen.findByText("Update service unavailable")
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});

describe("App teacher creation errors", () => {
  async function startTeacherCreation(user, mockedFetch) {
    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText(
        "No student records found in the database."
      )
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Full Name"),
      "Test Teacher"
    );
    await user.type(
      screen.getByPlaceholderText("Email"),
      "teacher@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("Password"),
      "TeacherPass123"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Teacher" })
    );
  }

  function setAdminSession() {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");
  }

  it("shows a permission error when the API returns 403", async () => {
    const user = userEvent.setup();

    setAdminSession();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({ message: "Forbidden" })
        ),
      });

    await startTeacherCreation(user, mockedFetch);

    expect(
      await screen.findByText(
        "403 Forbidden: Only Admin users can create teachers."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("displays a server error when teacher creation returns 500", async () => {
    const user = userEvent.setup();

    setAdminSession();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            message: "Teacher service temporarily unavailable",
          })
        ),
      });

    await startTeacherCreation(user, mockedFetch);

    expect(
      await screen.findByText(
        "Teacher service temporarily unavailable"
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});

describe("App student deletion errors", () => {
  function setAdminSession() {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");
  }

  const student = {
    studentId: "101",
    fullName: "Asha Rao",
    email: "asha@example.com",
    age: 21,
    mobileNumber: "9876543210",
    course: "Science",
    role: "Student",
  };

  async function loadStudentList(mockedFetch) {
    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();
  }

  it("shows a permission error when deleting a student returns 403", async () => {
    const user = userEvent.setup();

    setAdminSession();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([student]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

    await loadStudentList(mockedFetch);

    await user.click(
      screen.getByRole("button", { name: "Delete" })
    );

    expect(
      await screen.findByText(
        "Only Admin users can delete students."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  });

  it("displays a server error when deleting a student returns 500", async () => {
    const user = userEvent.setup();

    setAdminSession();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      // Initial request: load the student list.
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([student]),
      })
      // Delete request: API returns HTTP 500.
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            message: "Delete service temporarily unavailable",
          })
        ),
      });

    await loadStudentList(mockedFetch);

    await user.click(
      screen.getByRole("button", { name: "Delete" })
    );

    expect(
      await screen.findByText(
        "Delete service temporarily unavailable"
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});

describe("App login validation errors", () => {
  async function submitLogin(user) {
    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );
  }

  it("rejects a login response with an unsupported role", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            token: "test-token",
            role: "Guest",
            fullName: "Test User",
          })
        ),
      })
    );

    render(<App />);
    await submitLogin(user);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "The account has an unsupported role."
    );

    expect(localStorage.getItem("token")).toBeNull();
  });

  it("rejects a login response without an authentication token", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            role: "Student",
            fullName: "Test Student",
          })
        ),
      })
    );

    render(<App />);
    await submitLogin(user);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "The server did not return an authentication token."
    );

    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("App student loading server errors", () => {
  it("displays an error when the student API returns HTTP 500", async () => {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText(
        "Failed to load students. HTTP status: 500"
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledOnce();
  });
});

describe("App teacher creation authentication errors", () => {
  it("shows an error when teacher creation returns 401", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText(
        "No student records found in the database."
      )
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Full Name"),
      "Test Teacher"
    );
    await user.type(
      screen.getByPlaceholderText("Email"),
      "teacher@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("Password"),
      "TeacherPass123"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Teacher" })
    );

    expect(
      await screen.findByText(
        "401 Unauthorized: Please login again."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});

describe("App student list response branches", () => {
  it("shows the empty state when the API response is not an array", async () => {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        message: "Unexpected response format",
      }),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText(
        "No student records found in the database."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledOnce();
  });
});

describe("App login response parsing", () => {
  it("displays a plain-text error when the login API does not return JSON", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(
        "Service temporarily unavailable"
      ),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Service temporarily unavailable"
    );

    expect(mockedFetch).toHaveBeenCalledOnce();
  });
});

describe("App login empty response", () => {
  it("uses the HTTP status fallback when the login API returns an empty response", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(""),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Login failed. HTTP status: 500");

    expect(mockedFetch).toHaveBeenCalledOnce();
  });
});

describe("App student update with password", () => {
  it("includes the new password in the update request when provided", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "teacher-test-token");
    localStorage.setItem("role", "Teacher");
    localStorage.setItem("fullName", "Teacher User");
    localStorage.setItem("email", "teacher@example.com");

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });

    const student = {
      studentId: "101",
      fullName: "Asha Rao",
      email: "asha@example.com",
      age: 21,
      mobileNumber: "9876543210",
      course: "Science",
      role: "Student",
    };

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([student]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: vi.fn().mockResolvedValue(""),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([student]),
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    await user.type(
      screen.getByPlaceholderText("New password (optional)"),
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    expect(
      await screen.findByText("Student updated successfully.")
    ).toBeInTheDocument();

    const updateRequest = mockedFetch.mock.calls.find(
      ([url, options]) =>
        options?.method === "PUT" &&
        String(url).includes("/api/Students/101")
    );

    expect(updateRequest).toBeDefined();

    expect(JSON.parse(updateRequest[1].body)).toMatchObject({
      fullName: "Asha Rao",
      email: "asha@example.com",
      password: "NewPassword123",
    });
  });
});

describe("App student editing with missing details", () => {
  it("uses empty values when optional student details are missing", async () => {
    const user = userEvent.setup();

    localStorage.setItem("token", "teacher-test-token");
    localStorage.setItem("role", "Teacher");
    localStorage.setItem("fullName", "Teacher User");
    localStorage.setItem("email", "teacher@example.com");

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });

    const studentWithMissingDetails = {
      studentId: "101",
      fullName: "Incomplete Student",
      role: "Student",
    };

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([
        studentWithMissingDetails,
      ]),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Incomplete Student")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    expect(
      screen.getByRole("heading", { name: "Update Student" })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Full Name")
    ).toHaveValue("Incomplete Student");

    expect(
      screen.getByPlaceholderText("Email")
    ).toHaveValue("");

    expect(
      screen.getByPlaceholderText("Age")
    ).toHaveValue(null);

    expect(
      screen.getByPlaceholderText("Mobile Number")
    ).toHaveValue("");
  });
});

// Additional coverage tests for App.jsx
describe("App additional coverage tests", () => {
  const coverageStudent = {
    studentId: "101",
    fullName: "Asha Rao",
    email: "asha@example.com",
    age: 21,
    mobileNumber: "9876543210",
    course: "Science",
    role: "Student",
  };

  const setCoverageTeacherSession = () => {
    localStorage.setItem("token", "teacher-test-token");
    localStorage.setItem("role", "Teacher");
    localStorage.setItem("fullName", "Teacher User");
    localStorage.setItem("email", "teacher@example.com");
  };

  const setCoverageAdminSession = () => {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");
  };

  const studentsResponse = (students = [coverageStudent]) => ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(students),
  });

  it("shows an error when student update returns HTTP 401", async () => {
    const user = userEvent.setup();

    setCoverageTeacherSession();

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(studentsResponse())
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

    vi.stubGlobal("fetch", mockedFetch);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    expect(
      await screen.findByText(
        "401 Unauthorized: Please logout and login again."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("displays a plain-text error when student update fails", async () => {
    const user = userEvent.setup();

    setCoverageTeacherSession();

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(studentsResponse())
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(
          "Student update service unavailable"
        ),
      });

    vi.stubGlobal("fetch", mockedFetch);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    expect(
      await screen.findByText(
        "Student update service unavailable"
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the student ID is missing during update", async () => {
    const user = userEvent.setup();

    setCoverageTeacherSession();

    const studentWithoutId = {
      fullName: "Asha Rao",
      email: "asha@example.com",
      age: 21,
      mobileNumber: "9876543210",
      course: "Science",
      role: "Student",
    };

    const mockedFetch = vi.fn().mockResolvedValueOnce(
      studentsResponse([studentWithoutId])
    );

    vi.stubGlobal("fetch", mockedFetch);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    expect(
      await screen.findByText("Student ID is missing.")
    ).toBeInTheDocument();

    // Only the initial GET should have been sent.
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("shows an error when student deletion returns HTTP 401", async () => {
    const user = userEvent.setup();

    setCoverageAdminSession();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(studentsResponse())
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Delete" })
    );

    expect(
      await screen.findByText(
        "401 Unauthorized: Your JWT token is invalid or expired."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("displays a plain-text error when student deletion fails", async () => {
    const user = userEvent.setup();

    setCoverageAdminSession();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(studentsResponse())
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(
          "Student deletion service unavailable"
        ),
      });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Delete" })
    );

    expect(
      await screen.findByText(
        "Student deletion service unavailable"
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("reloads student records when View Students is clicked", async () => {
    const user = userEvent.setup();

    setCoverageAdminSession();

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(studentsResponse())
      .mockResolvedValueOnce(studentsResponse());

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "View Students" })
    );

    // Wait for the second request to complete.
    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("closes the student edit form when Cancel is clicked", async () => {
    const user = userEvent.setup();

    setCoverageTeacherSession();

    const mockedFetch = vi.fn().mockResolvedValueOnce(
      studentsResponse()
    );

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    expect(
      await screen.findByText("Asha Rao")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    expect(
      screen.getByRole("button", { name: "Save Changes" })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Cancel" })
    );

    expect(
      screen.queryByRole("button", { name: "Save Changes" })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
  });
});
describe("App registration error fallback branches", () => {
  async function fillRegistrationForm(user) {
    await user.type(
      screen.getByLabelText(/full name/i),
      "Test Student"
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );

    await user.type(
      screen.getByLabelText(/^age$/i),
      "20"
    );

    await user.type(
      screen.getByLabelText(/mobile number/i),
      "9876543210"
    );

    await user.selectOptions(
      screen.getByLabelText(/^course$/i),
      "computer-science"
    );
  }

  it("uses the title field when registration fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          title: "Registration was rejected",
        })
      ),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);
    await fillRegistrationForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    expect(
      await screen.findByText("Registration was rejected")
    ).toBeInTheDocument();
  });

  it("uses the default message when registration returns empty JSON fields", async () => {
    const user = userEvent.setup();

    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: vi.fn().mockResolvedValue("{}"),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);
    await fillRegistrationForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    expect(
      await screen.findByText("Registration failed. Status: 422")
    ).toBeInTheDocument();
  });
});
describe("App highlighted branch coverage", () => {
  const student = {
    studentId: "101",
    fullName: "Asha Rao",
    email: "asha@example.com",
    age: 21,
    mobileNumber: "9876543210",
    course: "Science",
    role: "Student",
  };

  function setAdminSession() {
    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");
  }

  function setTeacherSession() {
    localStorage.setItem("token", "teacher-test-token");
    localStorage.setItem("role", "Teacher");
    localStorage.setItem("fullName", "Teacher User");
    localStorage.setItem("email", "teacher@example.com");

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  }

  function studentListResponse() {
    return {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([student]),
    };
  }

  async function createTeacherWithResponse(user, postResponse) {
    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce(postResponse);

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    await screen.findByText(
      "No student records found in the database."
    );

    await user.type(
      screen.getByPlaceholderText("Full Name"),
      "Test Teacher"
    );

    await user.type(
      screen.getByPlaceholderText("Email"),
      "teacher@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "TeacherPass123"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Teacher" })
    );

    return mockedFetch;
  }

  async function updateStudentWithResponse(user, updateResponse) {
    setTeacherSession();

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(studentListResponse())
      .mockResolvedValueOnce(updateResponse);

    vi.stubGlobal("fetch", mockedFetch);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);

    await screen.findByText("Asha Rao");

    await user.click(
      screen.getByRole("button", { name: "Update" })
    );

    await user.click(
      screen.getByRole("button", { name: "Save Changes" })
    );

    return mockedFetch;
  }

  async function deleteStudentWithResponse(user, deleteResponse) {
    setAdminSession();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(studentListResponse())
      .mockResolvedValueOnce(deleteResponse);

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    await screen.findByText("Asha Rao");

    await user.click(
      screen.getByRole("button", { name: "Delete" })
    );

    return mockedFetch;
  }

  // LOGIN: loggedInUser.email falls back to the entered email.
  it("uses the entered email when the login response omits email", async () => {
    const user = userEvent.setup();

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          token: "test-token",
          role: "Student",
          fullName: "Test Student",
        })
      ),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByRole("heading", {
        name: "Student Dashboard",
      })
    ).toBeInTheDocument();

    expect(localStorage.getItem("email")).toBe(
      "student@example.com"
    );
  });

  // LOAD STUDENTS: error.message is empty, so the fallback is used.
  it("uses the fallback message when loading students fails with an empty error", async () => {
    setAdminSession();

    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error(""))
    );

    render(<App />);

    expect(
      await screen.findByText("Unable to load students.")
    ).toBeInTheDocument();
  });

  // CREATE TEACHER: responseText is empty, so result becomes {}.
  it("handles a successful teacher creation with an empty response body", async () => {
    const user = userEvent.setup();

    setAdminSession();

    const mockedFetch = await createTeacherWithResponse(user, {
      ok: true,
      status: 201,
      text: vi.fn().mockResolvedValue(""),
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Teacher account created successfully."
    );

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  // CREATE TEACHER: result.title is used when result.message is absent.
  it("uses the title field for a teacher creation error", async () => {
    const user = userEvent.setup();

    setAdminSession();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = await createTeacherWithResponse(user, {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          title: "Teacher creation was rejected",
        })
      ),
    });

    expect(
      await screen.findByText(
        "Teacher creation was rejected"
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  // CREATE TEACHER: neither message nor title exists.
  it("uses the default message when a teacher error has no message or title", async () => {
    const user = userEvent.setup();

    setAdminSession();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockedFetch = await createTeacherWithResponse(user, {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("{}"),
    });

    expect(
      await screen.findByText(
        "Teacher creation failed (500)."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  // UPDATE STUDENT: data.title is used.
  it("uses the title field for a student update error", async () => {
    const user = userEvent.setup();

    const mockedFetch = await updateStudentWithResponse(user, {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          title: "Student update was rejected",
        })
      ),
    });

    expect(
      await screen.findByText("Student update was rejected")
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  // UPDATE STUDENT: use errorMessage when JSON has neither field.
  it("uses the default message when a student update error has no message or title", async () => {
    const user = userEvent.setup();

    const mockedFetch = await updateStudentWithResponse(user, {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("{}"),
    });

    expect(
      await screen.findByText("Failed to update student.")
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  // DELETE STUDENT: data.title is used.
  it("uses the title field for a student deletion error", async () => {
    const user = userEvent.setup();

    const mockedFetch = await deleteStudentWithResponse(user, {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          title: "Student deletion was rejected",
        })
      ),
    });

    expect(
      await screen.findByText("Student deletion was rejected")
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  // DELETE STUDENT: use errorMessage when JSON has neither field.
  it("uses the default message when a student deletion error has no message or title", async () => {
    const user = userEvent.setup();

    const mockedFetch = await deleteStudentWithResponse(user, {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("{}"),
    });

    expect(
      await screen.findByText("Failed to delete student.")
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});
describe("App student profile fallback branches", () => {
  it("handles a Student session with missing profile details", () => {
    // Only set the values required to enter the Student Dashboard.
    localStorage.setItem("token", "student-test-token");
    localStorage.setItem("role", "Student");

    // Leave fullName, email, age, mobileNumber, and course unset.
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Student Dashboard",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "My Account",
      })
    ).toBeInTheDocument();

    // The profile fields should render safely when their values are empty.
    expect(screen.getByText("Name:")).toBeInTheDocument();
    expect(screen.getByText("Email:")).toBeInTheDocument();
    expect(screen.getByText("Course:")).toBeInTheDocument();
    expect(screen.getByText("Age:")).toBeInTheDocument();
    expect(screen.getByText("Mobile Number:")).toBeInTheDocument();
  });
});