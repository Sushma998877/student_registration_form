import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";

import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("App API URL normalization", () => {
  it("adds HTTPS and removes trailing slash and /api suffix", async () => {
    // Set a URL without a protocol.
    vi.stubEnv(
      "VITE_API_BASE_URL",
      "api.example.com/api/"
    );

    // Import App after setting the environment variable.
    const { default: AppWithCustomUrl } =
      await import("../../App.jsx");

    localStorage.setItem("token", "admin-test-token");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("fullName", "Admin User");
    localStorage.setItem("email", "admin@example.com");

    const mockedFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    });

    vi.stubGlobal("fetch", mockedFetch);

    render(<AppWithCustomUrl />);

    expect(
      await screen.findByText(
        "No student records found in the database."
      )
    ).toBeInTheDocument();

    expect(mockedFetch).toHaveBeenCalledWith(
      "https://api.example.com/api/Students",
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer admin-test-token",
        },
      })
    );
  });
});