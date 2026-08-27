import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "./App";

test("renders the login form heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /Fitness App/i })).toBeTruthy();
});

test("shows the welcome page after logging in with a name and level", () => {
  render(<App />);

  fireEvent.change(screen.getByLabelText(/Your name/i), {
    target: { value: "Jordan" },
  });
  fireEvent.change(screen.getByLabelText(/Fitness level/i), {
    target: { value: "Elite" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

  expect(screen.getByRole("heading", { name: /Jordan/ })).toBeTruthy();
  expect(screen.getByText(/Elite/)).toBeTruthy();
});

test("returns to login form after logging out", () => {
  render(<App />);

  fireEvent.change(screen.getByLabelText(/Your name/i), {
    target: { value: "Sam" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Log in/i }));
  fireEvent.click(screen.getByRole("button", { name: /Log out/i }));

  expect(screen.getByRole("heading", { name: /Fitness App/i })).toBeTruthy();
});
