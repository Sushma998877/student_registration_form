import { useState } from "react";
import React from "react";
import "./StudentRegistration.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  age: "",
  mobile: "",
  course: "",
};

export default function StudentRegistration({
  onRegistered,
  onLogin,
  onNotify,
}) {
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
  }

  
async function handleSubmit(event) {
  event.preventDefault();

  setMessage("");
  setIsError(false);
  setIsLoading(true);

  try {
    await onRegistered?.(form);

    setForm(initialForm);
    setIsError(false);
    setMessage("Registration successful.");
  } catch (error) {
    const errorMessage = error.message || "Registration failed.";

    setIsError(true);
    onNotify?.(errorMessage, "error");
    if (!onNotify) setMessage(errorMessage);
  } finally {
    setIsLoading(false);
  }
}

  return (
    <main className="registration-page">
      <div className="registration-content">
      <form className="registration-form" onSubmit={handleSubmit}>

        <div className="form-heading">
          <p className="form-kicker">Admissions portal</p>

          <h1>Student Registration</h1>

          <p>
            Enter your details to create your student account.
          </p>
        </div>

        <div className="form-grid">

          <div className="form-field form-field-wide">
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="age">Age</label>

            <input
              id="age"
              name="age"
              type="number"
              value={form.age}
              onChange={handleChange}
              min="13"
              max="100"
              placeholder="e.g. 18"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="mobile">Mobile number</label>

            <input
              id="mobile"
              name="mobile"
              type="tel"
              value={form.mobile}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="Enter your mobile number"
              required
            />
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="course">Course</label>

            <select
              id="course"
              name="course"
              value={form.course}
              onChange={handleChange}
              required
            >
              <option value="">Select a course</option>
              <option value="computer-science">
                Computer Science
              </option>
              <option value="business-management">
                Business Management
              </option>
              <option value="commerce">
                Commerce
              </option>
              <option value="arts">
                Arts and Humanities
              </option>
              <option value="science">
                Science
              </option>
            </select>
          </div>

        </div>

        {message && (
          <p
            style={{
              color: isError ? "red" : "green",
              marginTop: "15px",
            }}
          >
            {message}
          </p>
        )}

        <div className="form-actions">
          <p>All fields are required.</p>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register now"}
          </button>
        </div>

      </form>

      <p className="registration-switch">
        Already have an account?{" "}
        <button type="button" onClick={onLogin}>
          Sign in
        </button>
      </p>
      </div>
    </main>
  );
}

