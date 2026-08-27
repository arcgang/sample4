import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomePage } from "./WelcomePage";

describe("WelcomePage", () => {
  it("displays the user name in the heading", () => {
    render(
      <WelcomePage
        user={{ name: "Alice", level: "Intermediate" }}
        onLogout={() => {}}
      />
    );
    expect(screen.getByRole("heading", { name: /Alice/ })).toBeTruthy();
  });

  it("displays the user level", () => {
    render(
      <WelcomePage
        user={{ name: "Bob", level: "Advanced" }}
        onLogout={() => {}}
      />
    );
    expect(screen.getByText(/Advanced/)).toBeTruthy();
  });

  it("calls onLogout when the log out button is clicked", () => {
    const onLogout = vi.fn();
    render(
      <WelcomePage
        user={{ name: "Carol", level: "Beginner" }}
        onLogout={onLogout}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
