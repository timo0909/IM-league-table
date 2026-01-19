import express from 'express';
import sqlite3 from 'sqlite3';
import { promisify } from 'node:util';

// Run with: node server.js

const app = express();
const port = 3000;
const dbPath = process.env.DATABASE_PATH ?? 'league.sqlite';

const db = new sqlite3.Database(dbPath);
const allAsync = promisify(db.all.bind(db));
const getAsync = promisify(db.get.bind(db));

app.get('/api/weeks', async (req, res) => {
  try {
    const rows = await allAsync(
      `
      SELECT label
      FROM weeks
      ORDER BY week_start ASC
      `
    );

    res.json({ weeks: rows.map((row) => row.label) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load weeks.' });
  }
});

app.get('/api/league', async (req, res) => {
  const weekLabel = req.query.week;

  if (!weekLabel) {
    res.status(400).json({ error: 'Missing week parameter.' });
    return;
  }

  try {
    const week = await getAsync(
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

    const results = await allAsync(
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

    const commentaryRow = await getAsync(
      `
      SELECT commentary
      FROM ai_commentary
      WHERE week_id = ?
      `,
      [week.id]
    );

    res.json({
      week: week.label,
      results,
      commentary: commentaryRow?.commentary ?? '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load league data.' });
  }
});

app.listen(port, () => {
  console.info(`[server] listening on port ${port}`);
});

process.on('SIGINT', () => {
  db.close(() => {
    process.exit(0);
  });
});
