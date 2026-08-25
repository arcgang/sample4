import { describe, it, expect } from "vitest";
import { listGames, getGame, createGroup, joinGroup } from "./games.js";

describe("listGames", () => {
  it("returns a non-empty platform-curated catalog", () => {
    const games = listGames();
    expect(games.length).toBeGreaterThan(0);
  });

  it("every game has minPlayers=2 and maxPlayers<=10", () => {
    const games = listGames();
    for (const game of games) {
      expect(game.minPlayers).toBe(2);
      expect(game.maxPlayers).toBeLessThanOrEqual(10);
    }
  });

  it("includes a step_competition game", () => {
    const games = listGames();
    const stepGame = games.find((g) => g.type === "step_competition");
    expect(stepGame).toBeTruthy();
  });
});

describe("getGame", () => {
  it("returns the game matching the given id", () => {
    const game = getGame("game-1");
    expect(game?.id).toBe("game-1");
    expect(game?.type).toBe("step_competition");
  });

  it("returns undefined for an unknown id", () => {
    const game = getGame("game-999");
    expect(game).toBeUndefined();
  });
});

describe("createGroup", () => {
  it("creates a waiting group with the creator as first player", () => {
    const result = createGroup({ gameId: "game-1", playerName: "Alice" });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.status).toBe("waiting");
      expect(result.players).toContain("Alice");
      expect(result.gameId).toBe("game-1");
    }
  });

  it("returns an error for an unknown gameId", () => {
    const result = createGroup({ gameId: "game-999", playerName: "Bob" });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("game not found: game-999");
    }
  });

  it("returns an error when playerName is missing", () => {
    const result = createGroup({ gameId: "game-1", playerName: "" });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("gameId and playerName are required");
    }
  });
});

describe("joinGroup", () => {
  it("adds a second player to a waiting group", () => {
    const created = createGroup({ gameId: "game-2", playerName: "Carol" });
    expect("error" in created).toBe(false);
    if ("error" in created) return;

    const result = joinGroup({ groupId: created.id, playerName: "Dave" });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.players).toContain("Carol");
      expect(result.players).toContain("Dave");
      expect(result.players.length).toBe(2);
    }
  });

  it("returns an error when joining a non-existent group", () => {
    const result = joinGroup({ groupId: "group-999", playerName: "Eve" });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("group not found: group-999");
    }
  });

  it("returns an error when the same player tries to join twice", () => {
    const created = createGroup({ gameId: "game-3", playerName: "Frank" });
    expect("error" in created).toBe(false);
    if ("error" in created) return;

    const result = joinGroup({ groupId: created.id, playerName: "Frank" });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("player already in this group");
    }
  });
});
