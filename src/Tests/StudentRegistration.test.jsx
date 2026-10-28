
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import StudentRegistration from "../../StudentRegistration.jsx";

afterEach(() => {
  cleanup();
});

describe("StudentRegistration", () => {
  it("displays the registration form and all required fields", () => {
    render(
      <StudentRegistration
        onRegistered={vi.fn()}
        onLogin={vi.fn()}
      />
    );

    // Check the heading
    expect(
      screen.getByRole("heading", {
        name: "Student Registration",
      })
    ).toBeInTheDocument();

    // Check all form fields
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^age$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^course$/i)).toBeInTheDocument();

    // Check the registration button
    expect(
      screen.getByRole("button", { name: "Register now" })
    ).toBeInTheDocument();

    // Check the sign-in button
    expect(
      screen.getByRole("button", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("does not submit when all fields are empty", () => {
    const onRegistered = vi.fn();

    render(
      <StudentRegistration
        onRegistered={onRegistered}
        onLogin={vi.fn()}
      />
    );

    // Check that all fields are required
    expect(screen.getByLabelText(/full name/i)).toBeRequired();
    expect(screen.getByLabelText(/email address/i)).toBeRequired();
    expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    expect(screen.getByLabelText(/^age$/i)).toBeRequired();
    expect(screen.getByLabelText(/mobile number/i)).toBeRequired();
    expect(screen.getByLabelText(/^course$/i)).toBeRequired();

    // Click Register without entering any values
    fireEvent.click(
      screen.getByRole("button", { name: "Register now" })
    );

    // Registration callback should not be called
    expect(onRegistered).not.toHaveBeenCalled();
  });
});
