import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the app heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Fitness App" })).toBeTruthy();
});

test("renders the user profile form", () => {
  render(<App />);
  expect(screen.getByRole("form", { name: "user-profile-form" })).toBeTruthy();
});
