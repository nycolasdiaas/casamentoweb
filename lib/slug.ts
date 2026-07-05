import { nanoid } from "nanoid";

const SLUG_LENGTH = 8;
const MAX_ATTEMPTS = 5;

export async function generateUniqueSlug(
  slugExists: (slug: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = nanoid(SLUG_LENGTH);
    if (!(await slugExists(candidate))) {
      return candidate;
    }
  }

  throw new Error(
    `Failed to generate a unique slug after ${MAX_ATTEMPTS} attempts`
  );
}
