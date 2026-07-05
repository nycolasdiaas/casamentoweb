import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dbSchema from "./schema";

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const searchPath = process.env.DATABASE_SCHEMA;

const client = postgres(getConnectionString(), {
  prepare: false,
  ...(searchPath ? { connection: { search_path: searchPath } } : {}),
});

export const db = drizzle(client, { schema: dbSchema });
