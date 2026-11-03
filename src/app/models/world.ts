export type Difficulty =  "peaceful" | "easy" | "normal" | "hard";
export type GameMode = "survival" | "creative" | "adventure" | "spectator";
export type GameStatus = "stopped" | "started";

export interface World {
  id: string;
  name: string;
  mode: GameMode;
  difficulty: Difficulty;
  status: GameStatus;
}