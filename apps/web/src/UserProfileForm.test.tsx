import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { UserProfileForm } from "./UserProfileForm";

function fillForm(overrides: { name?: string; age?: string; habits?: string; goals?: string } = {}) {
  const name = overrides.name ?? "Alice";
  const age = overrides.age ?? "30";
  const habits = overrides.habits ?? "running, meditation";
  const goals = overrides.goals ?? "lose 5kg";

  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Age"), { target: { value: age } });
  fireEvent.change(screen.getByLabelText("Habits (comma-separated)"), { target: { value: habits } });
  fireEvent.change(screen.getByLabelText("Goals (comma-separated)"), { target: { value: goals } });
}

describe("UserProfileForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all form fields", () => {
    render(<UserProfileForm />);
    expect(screen.getByLabelText("Full name")).toBeTruthy();
    expect(screen.getByLabelText("Age")).toBeTruthy();
    expect(screen.getByLabelText("Habits (comma-separated)")).toBeTruthy();
    expect(screen.getByLabelText("Goals (comma-separated)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save profile" })).toBeTruthy();
  });

  it("shows success message after successful submission", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        name: "Alice",
        age: 30,
        habits: ["running", "meditation"],
        goals: ["lose 5kg"],
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    } as Response);

    render(<UserProfileForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(screen.getByText("Profile saved!")).toBeTruthy();
    });
    const success = screen.getByRole("region", { name: "profile-success" });
    expect(within(success).getByText("Alice")).toBeTruthy();
    expect(within(success).getByText(/profile ID is 1/)).toBeTruthy();
  });

  it("shows error message when API returns an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: ["name is required"] }),
    } as Response);

    render(<UserProfileForm />);
    fillForm();
    // Submit the form directly to bypass any HTML5 browser validation in jsdom
    fireEvent.submit(screen.getByRole("form", { name: "user-profile-form" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(screen.getByRole("alert").textContent).toBe("name is required");
  });

  it("disables submit button while submitting", async () => {
    let resolve!: (v: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    render(<UserProfileForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saving…" })).toBeTruthy();
    });
    expect((screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement).disabled).toBe(true);

    resolve({
      ok: true,
      json: async () => ({ id: "1", name: "Alice", age: 30, habits: [], goals: [], createdAt: "2026-01-01T00:00:00.000Z" }),
    } as Response);
  });

  it("resets form when 'Create another profile' is clicked", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "2", name: "Bob", age: 25, habits: [], goals: [], createdAt: "2026-01-01T00:00:00.000Z" }),
    } as Response);

    render(<UserProfileForm />);
    fillForm({ name: "Bob", age: "25", habits: "", goals: "" });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => { expect(screen.getByText("Profile saved!")).toBeTruthy(); });

    fireEvent.click(screen.getByRole("button", { name: "Create another profile" }));
    expect(screen.getByLabelText("Full name")).toBeTruthy();
    expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe("");
  });
});
