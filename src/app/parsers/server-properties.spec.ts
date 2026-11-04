import { getProperty, setProperty } from './server-properties';

describe('server-properties', () => {
  const sample =
    '#Minecraft server properties\nmotd=Hello\nlevel-name=worlds/foo\ndifficulty=easy\n';

  describe('getProperty', () => {
    it('reads a value', () => {
      expect(getProperty(sample, 'level-name')).toBe('worlds/foo');
    });

    it('returns undefined for a missing key', () => {
      expect(getProperty(sample, 'gamemode')).toBeUndefined();
    });

    it('ignores commented lines', () => {
      expect(getProperty('#level-name=old\nlevel-name=new\n', 'level-name')).toBe('new');
    });

    it('handles CRLF line endings', () => {
      expect(getProperty('motd=Hi\r\nlevel-name=world\r\n', 'level-name')).toBe('world');
    });

    it('unescapes backslash escapes', () => {
      expect(getProperty('motd=a\\:b\\=c\n', 'motd')).toBe('a:b=c');
    });

    it('does not match keys that only share a prefix', () => {
      expect(getProperty('level-name-old=x\n', 'level-name')).toBeUndefined();
    });

    it('returns an empty string for an empty value', () => {
      expect(getProperty('level-seed=\n', 'level-seed')).toBe('');
    });
  });

  describe('setProperty', () => {
    it('replaces an existing value and keeps other lines', () => {
      expect(setProperty(sample, 'level-name', 'worlds/bar')).toBe(
        '#Minecraft server properties\nmotd=Hello\nlevel-name=worlds/bar\ndifficulty=easy\n',
      );
    });

    it('appends a missing key before the trailing newline', () => {
      expect(setProperty('motd=Hi\n', 'gamemode', 'creative')).toBe('motd=Hi\ngamemode=creative\n');
    });

    it('appends a missing key when there is no trailing newline', () => {
      expect(setProperty('motd=Hi', 'gamemode', 'creative')).toBe('motd=Hi\ngamemode=creative');
    });

    it('keeps CRLF line endings', () => {
      expect(setProperty('motd=Hi\r\nlevel-name=a\r\n', 'level-name', 'b')).toBe(
        'motd=Hi\r\nlevel-name=b\r\n',
      );
    });

    it('escapes special characters', () => {
      expect(setProperty('motd=x', 'motd', 'a:b')).toBe('motd=a\\:b');
    });

    it('round-trips with getProperty', () => {
      const updated = setProperty(sample, 'motd', 'Hi #1 = best!');
      expect(getProperty(updated, 'motd')).toBe('Hi #1 = best!');
    });
  });
});
