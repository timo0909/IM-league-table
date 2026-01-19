-- Athletes
CREATE TABLE athletes (
  id INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL
);

-- Weeks
CREATE TABLE weeks (
  id INTEGER PRIMARY KEY,
  label TEXT NOT NULL
);

-- Weekly scores
CREATE TABLE weekly_scores (
  id INTEGER PRIMARY KEY,
  week_id INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  swim_score REAL,
  bike_score REAL,
  run_score REAL,
  total_score REAL
);

-- AI commentary
CREATE TABLE ai_commentary (
  id INTEGER PRIMARY KEY,
  week_id INTEGER NOT NULL,
  commentary TEXT
);

-- Demo data
INSERT INTO athletes (id, display_name) VALUES
(1, 'Asha'),
(2, 'Devin'),
(3, 'Mira');

INSERT INTO weeks (id, label) VALUES
(1, '2026-W03');

INSERT INTO weekly_scores (
  week_id, athlete_id, swim_score, bike_score, run_score, total_score
) VALUES
(1, 1, 82.4, 88.1, 84.6, 85.0),
(1, 2, 74.2, 91.3, 86.9, 84.1),
(1, 3, 88.9, 79.4, 82.1, 83.5);

INSERT INTO ai_commentary (week_id, commentary) VALUES
(1, 'Demo week: Asha leads with balance, Devin dominates the bike, Mira stays consistent.');
