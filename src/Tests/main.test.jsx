
import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";

const { renderMock } = vi.hoisted(() => ({
  renderMock: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: renderMock,
  })),
}));

vi.mock("../../App", () => ({
  default: () => null,
}));

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
  vi.resetModules();
});

describe("main.jsx application entry point", () => {
  it("creates a React root and renders the application", async () => {
    document.body.innerHTML = '<div id="root"></div>';

    const rootElement = document.getElementById("root");

    await import("../main.jsx");

    expect(createRoot).toHaveBeenCalledWith(rootElement);
    expect(renderMock).toHaveBeenCalledOnce();
  });
});
