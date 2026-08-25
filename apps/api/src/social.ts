export interface Story {
  id: string;
  author: string;
  body: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

export interface CreateStoryInput {
  author: string;
  body: string;
}

export interface VoteInput {
  direction: "up" | "down";
}

export interface StoriesPage {
  items: Story[];
  total: number;
}

const stories: Story[] = [];
let nextId = 1;

/** Reset module state — used by tests only. */
export function _reset(): void {
  stories.length = 0;
  nextId = 1;
}

export function createStory(input: CreateStoryInput): Story {
  const author = (input.author ?? "").trim();
  const body = (input.body ?? "").trim();
  if (!author) throw new Error("author is required");
  if (!body) throw new Error("body is required");

  const story: Story = {
    id: String(nextId++),
    author,
    body,
    upvotes: 0,
    downvotes: 0,
    createdAt: new Date().toISOString(),
  };
  stories.push(story);
  return story;
}

export function listStories(page = 1, pageSize = 20): StoriesPage {
  const p = Math.max(1, page);
  const ps = Math.min(100, Math.max(1, pageSize));
  const start = (p - 1) * ps;
  return {
    items: stories.slice(start, start + ps),
    total: stories.length,
  };
}

export function voteOnStory(id: string, direction: "up" | "down"): Story {
  const story = stories.find((s) => s.id === id);
  if (!story) throw new Error("story not found");
  if (direction === "up") {
    story.upvotes += 1;
  } else {
    story.downvotes += 1;
  }
  return story;
}
