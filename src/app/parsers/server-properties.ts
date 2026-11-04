/**
 * Helpers for reading and editing Minecraft `server.properties` content.
 *
 * Format: Java properties, one `key=value` per line, `#` or `!` starts a comment.
 * Java's `Properties.store` escapes `#`, `!`, `=` and `:` with a backslash,
 * so values are unescaped on read and escaped on write.
 * Unicode escapes (`\uXXXX`) are not handled.
 */

const ESCAPABLE = /[\\#!=:]/g;

function escapeValue(value: string): string {
  return value.replace(ESCAPABLE, (c) => `\\${c}`);
}

function unescapeValue(value: string): string {
  return value.replace(/\\(.)/g, '$1');
}

function isComment(line: string): boolean {
  const trimmed = line.trimStart();
  return trimmed.startsWith('#') || trimmed.startsWith('!');
}

function matchKey(line: string, key: string): string | undefined {
  if (isComment(line)) {
    return undefined;
  }
  const match = line.match(/^\s*([^=:\s]+)\s*[=:]\s*(.*)$/);
  return match && match[1] === key ? match[2] : undefined;
}

function lineEnding(content: string): string {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

/** Returns the value of `key`, or `undefined` if the key is not present. */
export function getProperty(content: string | undefined, key: string): string | undefined {
  if (content === undefined) {
    return undefined;
  }

  for (const line of content.split(/\r?\n/)) {
    const raw = matchKey(line, key);
    if (raw !== undefined) {
      return unescapeValue(raw.trimEnd());
    }
  }
  return undefined;
}

/**
 * Returns new content with `key` set to `value`.
 * Replaces the first existing line for `key`, or appends a new line.
 * Other lines and the original line ending style are kept.
 */
export function setProperty(content: string, key: string, value: string): string;
export function setProperty(
  content: string | undefined,
  key: string,
  value: string,
): string | undefined;
export function setProperty(
  content: string | undefined,
  key: string,
  value: string,
): string | undefined {
  if (content === undefined) {
    return undefined;
  }
  const eol = lineEnding(content);
  const lines = content.split(/\r?\n/);
  const newLine = `${key}=${escapeValue(value)}`;

  const index = lines.findIndex((line) => matchKey(line, key) !== undefined);
  if (index >= 0) {
    lines[index] = newLine;
    return lines.join(eol);
  }

  const endsWithNewline = lines.at(-1) === '';
  if (endsWithNewline) {
    lines.splice(lines.length - 1, 0, newLine);
  } else {
    lines.push(newLine);
  }
  return lines.join(eol);
}
