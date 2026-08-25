import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { App } from "./App";

const CATEGORIES = [
  "Proteins",
  "Grains & Cereals",
  "Fruits",
  "Vegetables",
  "Dairy",
  "Snacks & Supplements",
  "Beverages",
];

function mockFetch(
  categoriesPayload: { categories: string[] },
  itemsPayload: { items: unknown[]; total: number },
): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/food/categories")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(categoriesPayload),
        });
      }
      if (url.includes("/food/items")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(itemsPayload),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App catalog view", () => {
  it("shows the heading 'Healthy Food Store'", async () => {
    mockFetch({ categories: CATEGORIES }, { items: [], total: 0 });
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Healthy Food Store" }),
    ).toBeTruthy();
  });

  it("shows all 7 food categories in the filter dropdown after load", async () => {
    mockFetch({ categories: CATEGORIES }, { items: [], total: 0 });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Proteins" })).toBeTruthy(),
    );
    for (const cat of CATEGORIES) {
      expect(screen.getByRole("option", { name: cat })).toBeTruthy();
    }
  });

  it("shows empty-state message when no items exist", async () => {
    mockFetch({ categories: CATEGORIES }, { items: [], total: 0 });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/No food items yet/)).toBeTruthy(),
    );
  });

  it("displays item name and formatted price $12.99 for priceCents 1299", async () => {
    mockFetch(
      { categories: CATEGORIES },
      {
        items: [
          {
            id: 1,
            name: "Chicken Breast",
            category: "Proteins",
            priceCents: 1299,
          },
        ],
        total: 1,
      },
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Chicken Breast")).toBeTruthy(),
    );
    expect(screen.getByText("$12.99")).toBeTruthy();
  });

  it("shows category heading 'Fruits' when a Fruits item exists", async () => {
    mockFetch(
      { categories: CATEGORIES },
      {
        items: [{ id: 2, name: "Apple", category: "Fruits", priceCents: 99 }],
        total: 1,
      },
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Fruits" })).toBeTruthy(),
    );
  });

  it("shows error message when categories fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      ),
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeTruthy(),
    );
  });
});

describe("App vendor upload view", () => {
  beforeEach(() => {
    mockFetch({ categories: CATEGORIES }, { items: [], total: 0 });
  });

  it("switches to the upload view when 'Vendor Upload' button is clicked", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Vendor Upload" }));
    expect(screen.getByRole("heading", { name: "Vendor Upload" })).toBeTruthy();
  });

  it("shows 'Add Item' and 'Upload Items' buttons in the upload view", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Vendor Upload" }));
    expect(screen.getByRole("button", { name: "Add Item" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload Items" })).toBeTruthy();
  });

  it("shows client-side error when single-item form is submitted with empty name", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Vendor Upload" }));
    await waitFor(() =>
      expect(screen.getByLabelText(/Category \*/)).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));
    await waitFor(() =>
      expect(screen.getByText("Name is required")).toBeTruthy(),
    );
  });

  it("shows JSON parse error when bulk form is submitted with invalid JSON", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Vendor Upload" }));
    fireEvent.change(screen.getByLabelText(/JSON payload/), {
      target: { value: "not json" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Items" }));
    await waitFor(() =>
      expect(screen.getByText(/Invalid JSON/)).toBeTruthy(),
    );
  });
});
