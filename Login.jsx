import React, { useState } from "react";
import "./Login.css";

const initialForm = {
  email: "",
  password: "",
};

export default function Login({ onSubmit, onRegister, onNotify }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setMessage("");
    setIsError(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setIsError(false);
    setIsLoading(true);

    try {
      await onSubmit?.(form);

      setIsError(false);

      setMessage(
        "Login successful. Welcome to your student account."
      );
    } catch (error) {
      const errorMessage =
        error.message || "Login failed. Please try again.";

      setIsError(true);
      onNotify?.(errorMessage, "error");
      if (!onNotify) setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-content">
      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        <div className="login-heading">
          <p className="login-kicker">
            Student portal
          </p>

          <h1>Welcome back</h1>

          <p>
            Sign in to continue to your student account.
          </p>
        </div>

        <div className="login-fields">
          <div className="login-field">
            <label htmlFor="login-email">
              Email address
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        {message && (
          <p
            className={`login-message${
              isError
                ? " login-message-error"
                : ""
            }`}
            role={isError ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        <div className="login-actions">
          <p>
            Enter your registered email and password.
          </p>

          <button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>

      <p className="login-switch">
        New student?{" "}
        <button type="button" onClick={onRegister}>
          Create an account
        </button>
      </p>
      </div>
    </main>
  );
}
