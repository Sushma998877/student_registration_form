
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import Login from "../../Login.jsx";

afterEach(() => {
  cleanup();
});

describe("Login", () => {
  async function fillValidLoginForm(user) {
    await user.type(
      screen.getByLabelText(/email address/i),
      "student@example.com"
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      "Password123"
    );
  }

  it("displays the login form and required fields", () => {
    render(
      <Login
        onSubmit={vi.fn()}
        onRegister={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Welcome back" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/email address/i)
    ).toBeRequired();

    expect(
      screen.getByLabelText(/^password$/i)
    ).toBeRequired();

    expect(
      screen.getByLabelText(/email address/i)
    ).toHaveAttribute("type", "email");

    expect(
      screen.getByRole("button", { name: "Login" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Create an account" })
    ).toBeInTheDocument();
  });

  it("submits valid login details and displays a success message", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <Login
        onSubmit={onSubmit}
        onRegister={vi.fn()}
      />
    );

    await fillValidLoginForm(user);

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(onSubmit).toHaveBeenCalledOnce();

    expect(onSubmit).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "Password123",
    });

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent(
      "Login successful. Welcome to your student account."
    );
  });

  it("displays an error when login fails", async () => {
    const user = userEvent.setup();

    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Invalid email or password."));

    render(
      <Login
        onSubmit={onSubmit}
        onRegister={vi.fn()}
      />
    );

    await fillValidLoginForm(user);

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    const errorMessage = await screen.findByRole("alert");

    expect(errorMessage).toHaveTextContent(
      "Invalid email or password."
    );

    expect(errorMessage).toHaveClass("login-message-error");
  });

  it("shows a fallback message when login fails without an error message", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({});

    render(
      <Login
        onSubmit={onSubmit}
        onRegister={vi.fn()}
      />
    );

    await fillValidLoginForm(user);

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Login failed. Please try again.");
  });

  it("clears the error message when the user changes a field", async () => {
    const user = userEvent.setup();

    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Invalid email or password."));

    render(
      <Login
        onSubmit={onSubmit}
        onRegister={vi.fn()}
      />
    );

    await fillValidLoginForm(user);

    await user.click(
      screen.getByRole("button", { name: "Login" })
    );

    expect(
      await screen.findByRole("alert")
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/email address/i),
      "x"
    );

    expect(
      screen.queryByRole("alert")
    ).not.toBeInTheDocument();
  });

  it("calls onRegister when Create an account is clicked", async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn();

    render(
      <Login
        onSubmit={vi.fn()}
        onRegister={onRegister}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Create an account" })
    );

    expect(onRegister).toHaveBeenCalledOnce();
  });

  it("shows a loading state while login is in progress", async () => {
    const user = userEvent.setup();

    let resolveLogin;

    const onSubmit = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );

    render(
      <Login
        onSubmit={onSubmit}
        onRegister={vi.fn()}
      />
    );

    await fillValidLoginForm(user);

    const loginButton = screen.getByRole("button", {
      name: "Login",
    });

    await user.click(loginButton);

    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent("Logging in...");

    resolveLogin();

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent("Login successful.");

    expect(loginButton).toBeEnabled();
  });
});
