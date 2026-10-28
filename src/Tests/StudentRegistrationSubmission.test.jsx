import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import StudentRegistration from "../../StudentRegistration.jsx";

afterEach(() => {
  cleanup();
});

describe("StudentRegistration submission", () => {
  async function fillValidForm(user) {
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

  it("submits valid student details", async () => {
    const user = userEvent.setup();
    const onRegistered = vi.fn().mockResolvedValue(undefined);

    render(
      <StudentRegistration
        onRegistered={onRegistered}
        onLogin={vi.fn()}
      />
    );

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    await waitFor(() => {
      expect(onRegistered).toHaveBeenCalledOnce();
    });

    expect(onRegistered).toHaveBeenCalledWith({
      name: "Test Student",
      email: "student@example.com",
      password: "Password123",
      age: "20",
      mobile: "9876543210",
      course: "computer-science",
    });

    // The form should reset after successful registration.
    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email address/i)).toHaveValue("");
  });

  it("displays an error when registration fails", async () => {
    const user = userEvent.setup();

    const onRegistered = vi
      .fn()
      .mockRejectedValue(new Error("Email already exists."));

    render(
      <StudentRegistration
        onRegistered={onRegistered}
        onLogin={vi.fn()}
      />
    );

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    expect(
      await screen.findByText("Email already exists.")
    ).toBeInTheDocument();

    // The form should retain the entered details after failure.
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Test Student");
  });

  it("shows a fallback message when registration fails without an error message", async () => {
    const user = userEvent.setup();

    const onRegistered = vi.fn().mockRejectedValue({});

    render(
      <StudentRegistration
        onRegistered={onRegistered}
        onLogin={vi.fn()}
      />
    );

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    expect(
      await screen.findByText("Registration failed.")
    ).toBeInTheDocument();

    // The form should retain the entered details after failure.
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Test Student");
  });

  it("displays a green success message after registration succeeds", async () => {
    const user = userEvent.setup();
    const onRegistered = vi.fn().mockResolvedValue(undefined);

    render(
      <StudentRegistration
        onRegistered={onRegistered}
        onLogin={vi.fn()}
      />
    );

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", { name: "Register now" })
    );

    const successMessage = await screen.findByText(
      "Registration successful."
    );

    expect(successMessage).toBeInTheDocument();
    expect(successMessage).toHaveStyle({
    color: "rgb(0, 128, 0)",
    });

    // Confirm the form resets after successful registration.
    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
  });

  it("calls onLogin when Sign in is clicked", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();

    render(
      <StudentRegistration
        onRegistered={vi.fn()}
        onLogin={onLogin}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    expect(onLogin).toHaveBeenCalledOnce();
  });
});
