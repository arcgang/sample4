export interface Game {
  id: string;
  name: string;
  description: string;
  type: "step_competition" | "calorie_burn" | "distance_challenge" | "workout_streak";
  minPlayers: number;
  maxPlayers: number;
  durationDays: number;
}

export interface GameGroup {
  id: string;
  gameId: string;
  gameName: string;
  players: string[];
  status: "waiting" | "active" | "completed";
  createdAt: string;
}

export interface JoinGroupRequest {
  groupId: string;
  playerName: string;
}

export interface CreateGroupRequest {
  gameId: string;
  playerName: string;
}

export interface GroupError {
  error: string;
}

// Platform-curated games catalog — users cannot publish their own
const catalog: Game[] = [
  {
    id: "game-1",
    name: "Step Champions",
    description: "Compete with friends to reach the highest daily step count over 7 days",
    type: "step_competition",
    minPlayers: 2,
    maxPlayers: 10,
    durationDays: 7,
  },
  {
    id: "game-2",
    name: "Calorie Blitz",
    description: "Burn the most calories in a 5-day asynchronous challenge",
    type: "calorie_burn",
    minPlayers: 2,
    maxPlayers: 8,
    durationDays: 5,
  },
  {
    id: "game-3",
    name: "Distance Derby",
    description: "Log the most running distance in 10 days",
    type: "distance_challenge",
    minPlayers: 2,
    maxPlayers: 10,
    durationDays: 10,
  },
  {
    id: "game-4",
    name: "Streak Squad",
    description: "Maintain the longest daily workout streak as a group",
    type: "workout_streak",
    minPlayers: 2,
    maxPlayers: 6,
    durationDays: 14,
  },
];

const groups: GameGroup[] = [];
let groupSeq = 1;

export function listGames(): Game[] {
  return catalog;
}

export function getGame(id: string): Game | undefined {
  return catalog.find((g) => g.id === id);
}

export function createGroup(req: CreateGroupRequest): GameGroup | GroupError {
  if (!req.gameId || !req.playerName) {
    return { error: "gameId and playerName are required" };
  }

  const game = catalog.find((g) => g.id === req.gameId);
  if (!game) {
    return { error: `game not found: ${req.gameId}` };
  }

  const group: GameGroup = {
    id: `group-${groupSeq++}`,
    gameId: game.id,
    gameName: game.name,
    players: [req.playerName],
    status: "waiting",
    createdAt: new Date().toISOString(),
  };

  groups.push(group);
  return group;
}

export function joinGroup(req: JoinGroupRequest): GameGroup | GroupError {
  if (!req.groupId || !req.playerName) {
    return { error: "groupId and playerName are required" };
  }

  const group = groups.find((g) => g.id === req.groupId);
  if (!group) {
    return { error: `group not found: ${req.groupId}` };
  }
  if (group.status !== "waiting") {
    return { error: "group is not accepting new players" };
  }

  const game = catalog.find((g) => g.id === group.gameId);
  if (game && group.players.length >= game.maxPlayers) {
    return { error: `group is full (max ${game.maxPlayers} players)` };
  }
  if (group.players.includes(req.playerName)) {
    return { error: "player already in this group" };
  }

  group.players.push(req.playerName);
  return group;
}

export function listGroups(): GameGroup[] {
  return groups;
}
