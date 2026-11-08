import { describe, expect, it } from "vitest";
import {
  createLogger,
  isSensitiveKey,
  redact,
  REDACTED,
  type LogLevel,
} from "../server/logger";

const FIXED_TIME = new Date("2026-01-02T03:04:05.000Z");

function captureLogger(level?: LogLevel) {
  const lines: { line: string; level: LogLevel }[] = [];
  const logger = createLogger({
    level,
    now: () => FIXED_TIME,
    write: (line, lineLevel) => lines.push({ line, level: lineLevel }),
  });
  return { logger, lines };
}

describe("createLogger", () => {
  it("writes one JSON line with timestamp, level, message, and fields", () => {
    const { logger, lines } = captureLogger();
    logger.info("cart priced", { lineCount: 2 });

    expect(lines).toHaveLength(1);
    expect(lines[0].line).not.toContain("\n");
    expect(JSON.parse(lines[0].line)).toEqual({
      timestamp: "2026-01-02T03:04:05.000Z",
      level: "info",
      message: "cart priced",
      lineCount: 2,
    });
  });

  it("keeps multi-line messages on a single line", () => {
    const { logger, lines } = captureLogger();
    logger.error("first\nsecond");

    expect(lines[0].line).not.toContain("\n");
    expect(JSON.parse(lines[0].line).message).toBe("first\nsecond");
    expect(lines[0].level).toBe("error");
  });

  it("skips levels below the minimum (info by default)", () => {
    const { logger, lines } = captureLogger();
    logger.debug("hidden");
    logger.warn("shown");
    expect(lines.map((entry) => JSON.parse(entry.line).message)).toEqual([
      "shown",
    ]);

    const verbose = captureLogger("debug");
    verbose.logger.debug("visible");
    expect(verbose.lines).toHaveLength(1);
  });

  it("does not let fields overwrite timestamp, level, or message", () => {
    const { logger, lines } = captureLogger();
    logger.info("real", { level: "error", message: "fake", timestamp: 0 });

    expect(JSON.parse(lines[0].line)).toMatchObject({
      level: "info",
      message: "real",
      timestamp: "2026-01-02T03:04:05.000Z",
    });
  });

  it("redacts sensitive fields before writing", () => {
    const { logger, lines } = captureLogger();
    logger.warn("login failed", {
      email: "someone@example.com",
      request: { headers: { authorization: "Bearer abc", accept: "*/*" } },
    });

    const written = lines[0].line;
    expect(written).not.toContain("someone@example.com");
    expect(written).not.toContain("Bearer abc");
    expect(JSON.parse(written).request.headers).toEqual({
      authorization: REDACTED,
      accept: "*/*",
    });
  });
});

describe("isSensitiveKey", () => {
  it.each([
    "password",
    "Password",
    "accessToken",
    "refresh_token",
    "Authorization",
    "set-cookie",
    "cookies",
    "userEmail",
    "cardNumber",
    "credit_card",
    "apiKey",
    "x-api-key",
    "clientSecret",
  ])("treats %s as sensitive", (key) => {
    expect(isSensitiveKey(key)).toBe(true);
  });

  it.each(["discard", "productId", "quantity", "message", "tokenizer"])(
    "leaves %s alone",
    (key) => {
      expect(isSensitiveKey(key)).toBe(false);
    }
  );
});

describe("redact", () => {
  it("redacts nested objects and arrays without mutating the input", () => {
    const input = {
      users: [{ name: "Ada", password: "hunter2" }],
      card: { number: "4242424242424242" },
    };
    expect(redact(input)).toEqual({
      users: [{ name: "Ada", password: REDACTED }],
      card: REDACTED,
    });
    expect(input.users[0].password).toBe("hunter2");
  });

  it("marks circular references but keeps repeated shared objects", () => {
    const shared = { productId: "latte" };
    const node: Record<string, unknown> = { first: shared, second: shared };
    node.self = node;

    expect(redact(node)).toEqual({
      first: { productId: "latte" },
      second: { productId: "latte" },
      self: "[Circular]",
    });
  });

  it("serializes errors, dates, and bigints into JSON-safe values", () => {
    const error = new Error("boom");
    const result = redact({
      error,
      at: FIXED_TIME,
      big: BigInt(10),
    }) as Record<string, unknown>;

    expect(result.error).toMatchObject({ name: "Error", message: "boom" });
    expect(result.at).toBe("2026-01-02T03:04:05.000Z");
    expect(result.big).toBe("10");
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});
