import { describe, expect, it } from "vitest";

describe("throwaway review gate check", () => {
  it("fails on purpose", () => {
    expect(1).toBe(2);
  });
});
