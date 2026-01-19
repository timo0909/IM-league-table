-- Clear existing data
DELETE FROM ai_commentary;
DELETE FROM weekly_scores;
DELETE FROM weekly_metrics;
DELETE FROM weeks;
DELETE FROM athletes;

-- Athletes
INSERT INTO athletes (id, display_name, strava_athlete_id, created_at, updated_at) VALUES
(1, 'Asha', 'demo-asha', datetime('now'), datetime('now')),
(2, 'Devin', 'demo-devin', datetime('now'), datetime('now')),
(3, 'Mira', 'demo-mira', datetime('now'), datetime('now'));

-- Week
INSERT INTO weeks (id, week_start, week_end, label, created_at, updated_at) VALUES
(1, '2026-01-19', '2026-01-25', '2026-W03', datetime('now'), datetime('now'));

-- Weekly scores
INSERT INTO weekly_scores (
  week_id, athlete_id,
  swim_score, bike_score, run_score, total_score,
  created_at, updated_at
) VALUES
(1, 1, 82.4, 88.1, 84.6, 85.0, datetime('now'), datetime('now')),
(1, 2, 74.2, 91.3, 86.9, 84.1, datetime('now'), datetime('now')),
(1, 3, 88.9, 79.4, 82.1, 83.5, datetime('now'), datetime('now'));

-- AI commentary
INSERT INTO ai_commentary (
  week_id, prompt, commentary, model_name, created_at
) VALUES
(
  1,
  'demo',
  'Week 2026-W03 had Asha on top with the most balanced card on the table. Devin’s bike score did the heavy lifting, while Mira stayed impressively steady across all three disciplines.\n\nSwim Specialist of the Week: Mira.\n\nNo heroics, no meltdowns — the league behaved itself.',
  'demo',
  datetime('now')
);
