import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasDatabase, pool, query } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

export async function runMigrations() {
  if (!hasDatabase) return { skipped: true, reason: "DATABASE_URL is not configured" };
  if (process.env.AUTO_MIGRATE === "false") return { skipped: true, reason: "AUTO_MIGRATE=false" };

  const sqlPath = path.join(rootDir, "db", "init.sql");
  const sql = await fs.readFile(sqlPath, "utf8");
  await query(sql);
  return { skipped: false };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await runMigrations();
    if (result.skipped) {
      console.log(`Database migration skipped: ${result.reason}`);
    } else {
      console.log("Database schema is ready.");
    }
    if (pool) await pool.end();
  } catch (error) {
    console.error("Database migration failed:", error);
    if (pool) await pool.end();
    process.exit(1);
  }
}
