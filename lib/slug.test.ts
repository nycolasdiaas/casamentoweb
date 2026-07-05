import { describe, it, expect, vi } from "vitest";
import { generateUniqueSlug } from "./slug";

describe("generateUniqueSlug", () => {
  it("returns a URL-safe slug of the expected length", async () => {
    const slugExists = vi.fn().mockResolvedValue(false);

    const slug = await generateUniqueSlug(slugExists);

    expect(slug).toMatch(/^[A-Za-z0-9_-]{8}$/);
  });

  it("retries with a new slug when the first one collides", async () => {
    const slugExists = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const slug = await generateUniqueSlug(slugExists);

    expect(slugExists).toHaveBeenCalledTimes(2);
    expect(slug).toMatch(/^[A-Za-z0-9_-]{8}$/);
  });

  it("gives up after too many collisions", async () => {
    const slugExists = vi.fn().mockResolvedValue(true);

    await expect(generateUniqueSlug(slugExists)).rejects.toThrow();
  });
});
