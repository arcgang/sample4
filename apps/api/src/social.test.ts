import { describe, it, expect, beforeEach } from "vitest";
import {
  createStory,
  listStories,
  voteOnStory,
  _reset,
} from "./social.js";

describe("social board", () => {
  beforeEach(() => {
    _reset();
  });

  describe("createStory", () => {
    it("creates a story with the given author and body", () => {
      const story = createStory({ author: "Alice", body: "My first run!" });
      expect(story.author).toBe("Alice");
      expect(story.body).toBe("My first run!");
      expect(story.upvotes).toBe(0);
      expect(story.downvotes).toBe(0);
    });

    it("assigns incrementing string ids starting at 1", () => {
      const s1 = createStory({ author: "Alice", body: "Story one" });
      const s2 = createStory({ author: "Bob", body: "Story two" });
      expect(s1.id).toBe("1");
      expect(s2.id).toBe("2");
    });

    it("ids restart from 1 on a new reset", () => {
      createStory({ author: "Alice", body: "Story one" });
      _reset();
      const s = createStory({ author: "Bob", body: "Story two" });
      expect(s.id).toBe("1");
    });

    it("rejects a missing author", () => {
      expect(() => createStory({ author: "", body: "Hello" })).toThrow(
        "author is required",
      );
    });

    it("rejects a missing body", () => {
      expect(() => createStory({ author: "Alice", body: "" })).toThrow(
        "body is required",
      );
    });
  });

  describe("listStories", () => {
    it("returns an empty page when no stories exist", () => {
      const page = listStories();
      expect(page.items.length).toBe(0);
      expect(page.total).toBe(0);
    });

    it("returns all stories with correct total", () => {
      createStory({ author: "Alice", body: "First" });
      createStory({ author: "Bob", body: "Second" });
      const page = listStories();
      expect(page.total).toBe(2);
      expect(page.items.length).toBe(2);
    });

    it("paginates results correctly", () => {
      for (let i = 1; i <= 5; i++) {
        createStory({ author: `User${i}`, body: `Story ${i}` });
      }
      const page = listStories(1, 2);
      expect(page.items.length).toBe(2);
      expect(page.total).toBe(5);
      expect(page.items[0].body).toBe("Story 1");
    });
  });

  describe("voteOnStory", () => {
    it("increments upvotes when direction is up", () => {
      const story = createStory({ author: "Alice", body: "Upvote me" });
      const updated = voteOnStory(story.id, "up");
      expect(updated.upvotes).toBe(1);
      expect(updated.downvotes).toBe(0);
    });

    it("increments downvotes when direction is down", () => {
      const story = createStory({ author: "Alice", body: "Downvote me" });
      const updated = voteOnStory(story.id, "down");
      expect(updated.downvotes).toBe(1);
      expect(updated.upvotes).toBe(0);
    });

    it("accumulates multiple votes", () => {
      const story = createStory({ author: "Alice", body: "Popular story" });
      voteOnStory(story.id, "up");
      voteOnStory(story.id, "up");
      voteOnStory(story.id, "down");
      const updated = voteOnStory(story.id, "up");
      expect(updated.upvotes).toBe(3);
      expect(updated.downvotes).toBe(1);
    });

    it("throws when story id does not exist", () => {
      expect(() => voteOnStory("999", "up")).toThrow("story not found");
    });
  });
});
