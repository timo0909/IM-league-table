CREATE TABLE athletes (
  id INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL,
  strava_athlete_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE weeks (
  id INTEGER PRIMARY KEY,
  week_start TEXT NOT NULL UNIQUE,
  week_end TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE weekly_scores (
  id INTEGER PRIMARY KEY,
  week_id INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  swim_score REAL NOT NULL,
  bike_score REAL NOT NULL,
  run_score REAL NOT NULL,
  total_score REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (week_id, athlete_id),
  FOREIGN KEY (week_id) REFERENCES weeks(id),
  FOREIGN KEY (athlete_id) REFERENCES athletes(id)
);

CREATE TABLE weekly_metrics (
  id INTEGER PRIMARY KEY,
  week_id INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  fatigue REAL NOT NULL,
  fitness REAL NOT NULL,
  form REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (week_id, athlete_id),
  FOREIGN KEY (week_id) REFERENCES weeks(id),
  FOREIGN KEY (athlete_id) REFERENCES athletes(id)
);

CREATE TABLE ai_commentary (
  id INTEGER PRIMARY KEY,
  week_id INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  commentary TEXT NOT NULL,
  model_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (week_id) REFERENCES weeks(id)
);
