import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the fitness motivation heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Fitness Motivation" })).toBeTruthy();
});
