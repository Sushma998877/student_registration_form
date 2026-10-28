
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import StudentRegistration from "../../StudentRegistration.jsx";

afterEach(() => {
  cleanup();
});

describe("StudentRegistration validation", () => {
  it("marks all fields as required", () => {
    render(
      <StudentRegistration
        onRegistered={vi.fn()}
        onLogin={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/full name/i)).toBeRequired();
    expect(screen.getByLabelText(/email address/i)).toBeRequired();
    expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    expect(screen.getByLabelText(/^age$/i)).toBeRequired();
    expect(screen.getByLabelText(/mobile number/i)).toBeRequired();
    expect(screen.getByLabelText(/^course$/i)).toBeRequired();
  });

  it("requires a valid email format", () => {
    render(
      <StudentRegistration
        onRegistered={vi.fn()}
        onLogin={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/email address/i))
      .toHaveAttribute("type", "email");
  });

  it("requires a password of at least 8 characters", () => {
    render(
      <StudentRegistration
        onRegistered={vi.fn()}
        onLogin={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/^password$/i))
      .toHaveAttribute("minLength", "8");
  });
});
