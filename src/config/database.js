import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const dbDir = path.join(root, 'database');
const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'app.db');


if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath, { fileMustExist: false });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export async function getDb() {
  return open({
    filename: "./database/app.db",
    driver: sqlite3.Database,
  });
}
export function runSchemaIfNeeded() {
  const schemaFile = path.join(dbDir, 'schema.sql');
  const seedsFile = path.join(dbDir, 'seeds.sql');

  const hasUsers = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();

  if (!hasUsers) {
    if (!fs.existsSync(schemaFile)) {
      console.error('❌ Missing schema.sql in database/');
      process.exit(1);
    }
    const sql = fs.readFileSync(schemaFile, 'utf8');
    db.exec(sql);

    if (fs.existsSync(seedsFile)) {
      db.exec(fs.readFileSync(seedsFile, 'utf8'));
    }

    console.log('✅ Database initialized with schema and seeds.');
  }
}
