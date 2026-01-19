import sqlite3 from 'sqlite3';
import { promisify } from 'node:util';

function openDatabase(dbPath) {
  const db = new sqlite3.Database(dbPath);
  return {
    all: promisify(db.all.bind(db)),
    close: promisify(db.close.bind(db)),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const dbPath = process.env.DATABASE_PATH ?? 'league.sqlite';
  const db = openDatabase(dbPath);

  try {
    const rows = await db.all(
      `
      SELECT label
      FROM weeks
      ORDER BY week_start ASC
      `
    );

    res.status(200).json({ weeks: rows.map((row) => row.label) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load weeks.' });
  } finally {
    await db.close();
  }
}
