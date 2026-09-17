import { describe, expect, it } from "vitest";
import { randomBytes, createHash } from "node:crypto";

describe("invitation token hashing", () => {
  it("produces consistent SHA-256 hashes", () => {
    const token = randomBytes(32).toString("hex");

    const first = createHash("sha256").update(token).digest("hex");

    const second = createHash("sha256").update(token).digest("hex");

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it("does not produce the original token", () => {
    const token = randomBytes(32).toString("hex");

    const hash = createHash("sha256").update(token).digest("hex");

    expect(hash).not.toBe(token);
  });
});
