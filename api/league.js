import sqlite3 from 'sqlite3';
import { promisify } from 'node:util';

function openDatabase(dbPath) {
  const db = new sqlite3.Database(dbPath);
  return {
    all: promisify(db.all.bind(db)),
    get: promisify(db.get.bind(db)),
    close: promisify(db.close.bind(db)),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const weekLabel = req.query.week;
  if (!weekLabel || typeof weekLabel !== 'string') {
    res.status(400).json({ error: 'Missing week parameter.' });
    return;
  }

  const dbPath = process.env.DATABASE_PATH ?? 'league.sqlite';
  const db = openDatabase(dbPath);

  try {
    const week = await db.get(
      `
      SELECT id, label
      FROM weeks
      WHERE label = ?
      `,
      [weekLabel]
    );

    if (!week) {
      res.status(404).json({ error: 'Week not found.' });
      return;
    }

    const results = await db.all(
      `
      SELECT
        weekly_scores.athlete_id as athleteId,
        athletes.display_name as athleteName,
        weekly_scores.total_score as totalScore,
        weekly_scores.swim_score as swimScore,
        weekly_scores.bike_score as bikeScore,
        weekly_scores.run_score as runScore
      FROM weekly_scores
      JOIN athletes ON athletes.id = weekly_scores.athlete_id
      WHERE weekly_scores.week_id = ?
      ORDER BY weekly_scores.total_score DESC
      `,
      [week.id]
    );

    const commentaryRow = await db.get(
      `
      SELECT commentary
      FROM ai_commentary
      WHERE week_id = ?
      `,
      [week.id]
    );

    res.status(200).json({
      week: week.label,
      results,
      commentary: commentaryRow?.commentary ?? '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load league data.' });
  } finally {
    await db.close();
  }
}
