import { read } from 'nbtify';
import { Difficulty, GameMode } from '../models/world.model';

export interface LevelSettings {
  mode?: GameMode;
  difficulty?: Difficulty;
  /** True when the world uses the server's default game mode (Bedrock `GameType` 5). */
  usesDefaultMode: boolean;
}

/** Bedrock `GameType` value meaning "use the server default". */
const BEDROCK_DEFAULT_GAME_TYPE = 5;

/**
 * `GameType` values per edition.
 * Java: https://minecraft.wiki/w/Java_Edition_level_format
 * Bedrock: https://minecraft.wiki/w/Bedrock_Edition_level_format
 * (5 = "Default" on Bedrock, reported via `usesDefaultMode` instead.)
 */
const JAVA_GAME_MODES: Readonly<Record<number, GameMode>> = {
  0: 'survival',
  1: 'creative',
  2: 'adventure',
  3: 'spectator',
};

const BEDROCK_GAME_MODES: Readonly<Record<number, GameMode>> = {
  0: 'survival',
  1: 'creative',
  2: 'adventure',
  6: 'spectator',
};

/** `Difficulty` values, the same in both editions. */
const DIFFICULTIES: Readonly<Record<number, Difficulty>> = {
  0: 'peaceful',
  1: 'easy',
  2: 'normal',
  3: 'hard',
};

function lookup<T>(values: Readonly<Record<number, T>>, raw: unknown): T | undefined {
  return raw === undefined || raw === null ? undefined : values[Number(raw)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Reads game mode and difficulty from the bytes of a `level.dat`.
 *
 * - Java: gzipped big-endian NBT, settings inside the `Data` compound.
 * - Bedrock: 8-byte header + uncompressed little-endian NBT, settings at the root.
 *
 * nbtify detects the format. Missing or unknown values are left `undefined`.
 */
export async function readLevelSettings(bytes: ArrayBuffer | Uint8Array): Promise<LevelSettings> {
  const nbt = await read(bytes);
  const root = isRecord(nbt.data) ? nbt.data : {};

  if (nbt.bedrockLevel) {
    return {
      mode: lookup(BEDROCK_GAME_MODES, root['GameType']),
      difficulty: lookup(DIFFICULTIES, root['Difficulty']),
      usesDefaultMode: Number(root['GameType']) === BEDROCK_DEFAULT_GAME_TYPE,
    };
  }

  const data = isRecord(root['Data']) ? root['Data'] : {};
  return {
    mode: lookup(JAVA_GAME_MODES, data['GameType']),
    difficulty: lookup(DIFFICULTIES, data['Difficulty']),
    usesDefaultMode: false,
  };
}
