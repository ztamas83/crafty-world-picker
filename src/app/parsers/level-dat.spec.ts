import { Int32, Int8, write } from 'nbtify';
import { readLevelSettings } from './level-dat';

function javaLevelDat(data: Record<string, unknown>): Promise<Uint8Array> {
  return write({ Data: data }, { rootName: '', endian: 'big', compression: 'gzip', bedrockLevel: false });
}

function bedrockLevelDat(root: Record<string, unknown>): Promise<Uint8Array> {
  // nbtify writes the 8-byte header from StorageVersion (10 = modern saves).
  return write(
    { StorageVersion: new Int32(10), ...root },
    { rootName: '', endian: 'little', compression: null, bedrockLevel: true },
  );
}

describe('readLevelSettings', () => {
  describe('Java Edition', () => {
    it('reads game mode and difficulty from Data', async () => {
      const bytes = await javaLevelDat({ GameType: new Int32(1), Difficulty: new Int8(3) });
      expect(await readLevelSettings(bytes)).toEqual({ mode: 'creative', difficulty: 'hard', usesDefaultMode: false });
    });

    it('maps zero values', async () => {
      const bytes = await javaLevelDat({ GameType: new Int32(0), Difficulty: new Int8(0) });
      expect(await readLevelSettings(bytes)).toEqual({ mode: 'survival', difficulty: 'peaceful', usesDefaultMode: false });
    });

    it('maps 3 to spectator', async () => {
      const bytes = await javaLevelDat({ GameType: new Int32(3) });
      expect((await readLevelSettings(bytes)).mode).toBe('spectator');
    });

    it('leaves missing or out-of-range fields undefined', async () => {
      const bytes = await javaLevelDat({ GameType: new Int32(9) });
      expect(await readLevelSettings(bytes)).toEqual({ mode: undefined, difficulty: undefined, usesDefaultMode: false });
    });
  });

  describe('Bedrock Edition', () => {
    it('reads game mode and difficulty from the root', async () => {
      const bytes = await bedrockLevelDat({ GameType: new Int32(2), Difficulty: new Int32(2) });
      expect(await readLevelSettings(bytes)).toEqual({ mode: 'adventure', difficulty: 'normal', usesDefaultMode: false });
    });

    it('maps 6 to spectator', async () => {
      const bytes = await bedrockLevelDat({ GameType: new Int32(6), Difficulty: new Int32(1) });
      expect(await readLevelSettings(bytes)).toEqual({ mode: 'spectator', difficulty: 'easy', usesDefaultMode: false });
    });

    it('flags 5 (Default) as using the server default mode', async () => {
      const bytes = await bedrockLevelDat({ GameType: new Int32(5), Difficulty: new Int32(0) });
      expect(await readLevelSettings(bytes)).toEqual({
        mode: undefined,
        difficulty: 'peaceful',
        usesDefaultMode: true,
      });
    });
  });

  it('rejects data that is not NBT', async () => {
    await expect(readLevelSettings(new Uint8Array([1, 2, 3]))).rejects.toThrow(
      /Expected an opening List or Compound tag/,
    );
  });
});
