import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";

const mockStory = {
  id: "1",
  author: "Alice",
  body: "Ran 10km today!",
  upvotes: 3,
  downvotes: 1,
  createdAt: "2099-01-01T00:00:00.000Z",
};

function makeStoriesResponse(items: typeof mockStory[] = [], total?: number) {
  return { items, total: total ?? items.length };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeStoriesResponse(),
      text: async () => "",
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("renders the Social Board heading", async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Social Board" })).toBeTruthy();
});

test("shows loading state initially", () => {
  render(<App />);
  expect(screen.getByText("Loading…")).toBeTruthy();
});

test("shows empty-state message when no stories are returned", async () => {
  render(<App />);
  await waitFor(() =>
    expect(screen.getByText("No stories yet. Be the first to share!")).toBeTruthy(),
  );
});

test("renders stories returned by the API", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeStoriesResponse([mockStory]),
      text: async () => "",
    }),
  );
  render(<App />);
  await waitFor(() => expect(screen.getByText("Ran 10km today!")).toBeTruthy());
  expect(screen.getByText("Alice")).toBeTruthy();
});

test("shows error message when the API call fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "Service unavailable",
    }),
  );
  render(<App />);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toBeTruthy(),
  );
});

test("renders the share-a-story form with author and body fields", async () => {
  render(<App />);
  await waitFor(() =>
    expect(screen.queryByText("Loading…")).toBeFalsy(),
  );
  expect(screen.getByLabelText("Your name")).toBeTruthy();
  expect(screen.getByLabelText("Your story")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Post Story" })).toBeTruthy();
});

test("submitting the form posts to /social and prepends the new story", async () => {
  const newStory = {
    id: "1",
    author: "Bob",
    body: "First marathon done!",
    upvotes: 0,
    downvotes: 0,
    createdAt: "2099-06-01T00:00:00.000Z",
  };

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => makeStoriesResponse(),
      text: async () => "",
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => newStory,
      text: async () => "",
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);
  await waitFor(() => expect(screen.queryByText("Loading…")).toBeFalsy());

  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Bob" },
  });
  fireEvent.change(screen.getByLabelText("Your story"), {
    target: { value: "First marathon done!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Post Story" }));

  await waitFor(() =>
    expect(screen.getByText("First marathon done!")).toBeTruthy(),
  );

  const postCall = fetchMock.mock.calls[1];
  expect(postCall[0]).toContain("/social");
  expect(postCall[1]?.method).toBe("POST");
});

test("upvote button sends up vote to the API", async () => {
  const updatedStory = { ...mockStory, upvotes: 4 };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => makeStoriesResponse([mockStory]),
      text: async () => "",
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => updatedStory,
      text: async () => "",
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);
  await waitFor(() => screen.getByText("Ran 10km today!"));

  fireEvent.click(screen.getByRole("button", { name: /Upvote story by Alice/i }));

  await waitFor(() => {
    const voteCall = fetchMock.mock.calls[1];
    expect(voteCall[0]).toContain("/social/1/vote");
    expect(JSON.parse(voteCall[1]?.body as string).direction).toBe("up");
  });
});

test("downvote button sends down vote to the API", async () => {
  const updatedStory = { ...mockStory, downvotes: 2 };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => makeStoriesResponse([mockStory]),
      text: async () => "",
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => updatedStory,
      text: async () => "",
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);
  await waitFor(() => screen.getByText("Ran 10km today!"));

  fireEvent.click(
    screen.getByRole("button", { name: /Downvote story by Alice/i }),
  );

  await waitFor(() => {
    const voteCall = fetchMock.mock.calls[1];
    expect(voteCall[0]).toContain("/social/1/vote");
    expect(JSON.parse(voteCall[1]?.body as string).direction).toBe("down");
  });
});
