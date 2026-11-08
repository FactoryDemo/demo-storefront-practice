export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

/** Receives one serialized JSON log line (no trailing newline). */
export type LogWriter = (line: string, level: LogLevel) => void;

export type Logger = {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
};

export type LoggerOptions = {
  /** Lowest level that is written. Defaults to "info". */
  level?: LogLevel;
  write?: LogWriter;
  now?: () => Date;
};

export const REDACTED = "[REDACTED]";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Words that mark a field as sensitive wherever they appear in its key. */
const SENSITIVE_KEY_WORDS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "email",
  "card",
  "cvv",
  "ssn",
  "apikey",
]);

/**
 * True when a key names sensitive data. Keys are split into words
 * (camelCase, snake_case, kebab-case), so `accessToken`, `user_email`, and
 * `set-cookie` match while `discard` does not. Adjacent word pairs are
 * also checked so `apiKey` and `x-api-key` match "apikey".
 */
export function isSensitiveKey(key: string): boolean {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
  const pairs = words.slice(1).map((word, index) => words[index] + word);
  return [...words, ...pairs].some(
    (word) =>
      SENSITIVE_KEY_WORDS.has(word) ||
      SENSITIVE_KEY_WORDS.has(word.replace(/s$/, ""))
  );
}

/** Deep copy of `value` with sensitive keys replaced by REDACTED. */
export function redact(value: unknown): unknown {
  return redactValue(value, new Set());
}

function redactValue(value: unknown, ancestors: Set<object>): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (ancestors.has(value)) {
    return "[Circular]";
  }
  ancestors.add(value);
  const copy = Array.isArray(value)
    ? value.map((item) => redactValue(item, ancestors))
    : redactEntries(value as Record<string, unknown>, ancestors);
  ancestors.delete(value);
  return copy;
}

function redactEntries(
  record: Record<string, unknown>,
  ancestors: Set<object>
): Record<string, unknown> {
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(record)) {
    copy[key] = isSensitiveKey(key) ? REDACTED : redactValue(item, ancestors);
  }
  return copy;
}

function writeToStdio(line: string, level: LogLevel): void {
  const stream =
    level === "warn" || level === "error" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
}

/**
 * A logger that writes one JSON object per line with `timestamp`, `level`,
 * `message`, and any extra fields, after redacting sensitive keys.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const minimumRank = LEVEL_RANK[options.level ?? "info"];
  const write = options.write ?? writeToStdio;
  const now = options.now ?? (() => new Date());

  function log(level: LogLevel, message: string, fields: LogFields = {}) {
    if (LEVEL_RANK[level] < minimumRank) {
      return;
    }
    const entry: LogFields = {
      timestamp: now().toISOString(),
      level,
      message,
    };
    const safeFields = redactEntries(fields, new Set());
    for (const [key, value] of Object.entries(safeFields)) {
      if (!(key in entry)) {
        entry[key] = value;
      }
    }
    write(JSON.stringify(entry), level);
  }

  return {
    debug: (message, fields) => log("debug", message, fields),
    info: (message, fields) => log("info", message, fields),
    warn: (message, fields) => log("warn", message, fields),
    error: (message, fields) => log("error", message, fields),
  };
}

export const logger = createLogger();
