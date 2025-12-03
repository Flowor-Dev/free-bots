import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function initializeDatabase() {
  db = await open({
    filename: path.join(__dirname, '../../database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS joins (
      date TEXT PRIMARY KEY,
      count INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_joins_date ON joins(date);
  `);

  console.log('Database successfully initialized');
}

export async function incrementJoinCount(date) {
  await db.run(`
    INSERT INTO joins (date, count) 
    VALUES (?, 1)
    ON CONFLICT(date) DO UPDATE SET count = count + 1
  `, [date]);
}

export async function getJoinData(days) {
  const result = await db.all(`
    SELECT date, count 
    FROM joins 
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date ASC
  `, [days.toString()]);
  return result || [];
}

export async function closeDatabase() {
  if (db) {
    await db.close();
  }
}

