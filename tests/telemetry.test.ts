import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureServerError,
  flushTelemetry,
  recordHealthCheck,
  recordOrderRejected,
  withTelemetry,
} from "../server/telemetry";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("withTelemetry", () => {
  it("returns the handler's response unchanged", async () => {
    const handler = withTelemetry("/api/test", () =>
      Response.json({ ok: true }, { status: 201 })
    );
    const response = await handler(new Request("http://localhost/api/test"));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("turns an unexpected error into a logged 500", async () => {
    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const handler = withTelemetry("/api/test", async () => {
      throw new Error("boom");
    });
    const response = await handler(
      new Request("http://localhost/api/test", { method: "POST" })
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      errors: ["Something went wrong on our side. Try again."],
    });
    const line = JSON.parse(String(stderr.mock.calls[0][0]));
    expect(line).toMatchObject({
      level: "error",
      message: "unhandled error",
      route: "/api/test",
      method: "POST",
      error: { name: "Error", message: "boom" },
    });
  });
});

describe("without exporters configured", () => {
  it("records metrics and errors without throwing or sending anything", async () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => {
      recordHealthCheck();
      recordOrderRejected("validation");
      captureServerError(
        new Error("x"),
        "/api/test",
        new Request("http://localhost/api/test")
      );
    }).not.toThrow();
    await expect(flushTelemetry()).resolves.toBeUndefined();
  });
});
