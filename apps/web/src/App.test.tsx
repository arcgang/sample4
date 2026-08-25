import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";

const fetchMock = vi.fn<typeof fetch>();

describe("App", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders inventory items from GET /inventory", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: 1, name: "Treadmill", quantity: 4 },
          { id: 2, name: "Yoga Mat", quantity: 25 },
        ],
      }),
    } as Response);

    render(<App />);

    expect(screen.getByText("Loading inventory...")).toBeTruthy();
    expect(await screen.findByText("Treadmill: 4")).toBeTruthy();
    expect(screen.getByText("Yoga Mat: 25")).toBeTruthy();
  });

  test("submits Spin Bike with quantity 6 to POST /inventory", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 4, name: "Spin Bike", quantity: 6 }),
      } as Response);

    render(<App />);

    await screen.findByText("No inventory items yet.");

    fireEvent.change(screen.getByLabelText("Equipment name"), {
      target: { value: "Spin Bike" },
    });
    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add inventory" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "http://localhost:3000/inventory",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Spin Bike", quantity: 6 }),
        }),
      );
    });

    expect(await screen.findByText("Spin Bike: 6")).toBeTruthy();
  });
});
