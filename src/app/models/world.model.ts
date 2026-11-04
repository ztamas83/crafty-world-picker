export const GAME_DIFFICULTIES = ['peaceful', 'easy', 'normal', 'hard'] as const;
export const GAME_MODES = ['survival', 'creative', 'adventure', 'spectator'] as const;

export type Difficulty = (typeof GAME_DIFFICULTIES)[number];
export type GameMode = (typeof GAME_MODES)[number];
export type GameStatus = 'stopped' | 'started';

export interface World {
  id: string;
  status: GameStatus;
  name: string;
  mode?: GameMode;
  difficulty?: Difficulty;
}

export interface NewWorld {
  name: string;
  mode: GameMode;
  difficulty: Difficulty;
}
