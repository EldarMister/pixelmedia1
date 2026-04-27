import pg from "pg";

const { Pool } = pg;

export const hasDatabase = Boolean(process.env.DATABASE_URL);
export const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.REQUIRE_DATABASE === "true" ||
  Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID);

if (isProduction && !hasDatabase) {
  throw new Error("DATABASE_URL is required in production");
}

export const pool = hasDatabase
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        isProduction
          ? { rejectUnauthorized: false }
          : undefined
    })
  : null;

export async function query(text, params = []) {
  if (!pool) {
    const error = new Error("DATABASE_URL is not configured");
    error.code = "NO_DATABASE";
    throw error;
  }

  return pool.query(text, params);
}

export async function transaction(callback) {
  if (!pool) {
    const error = new Error("DATABASE_URL is not configured");
    error.code = "NO_DATABASE";
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
