# Ironman League Database Schema (Proposed)

This document defines the initial SQLite schema for the Ironman League web app. It focuses on the **tables, columns, and relationships** only (no application code).

## Overview

- 3 athletes compete weekly.
- Data is ingested from Strava activities.
- Scores tracked weekly, including swim/bike/run categories.
- AI referee provides **commentary only** (no scoring logic).

## Tables

### 1) `athletes`
Stores the core athlete records.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY | Surrogate key. |
| `display_name` | TEXT | NOT NULL | Public name in standings. |
| `strava_athlete_id` | TEXT | UNIQUE, NOT NULL | External identifier from Strava. |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp. |
| `updated_at` | TEXT | NOT NULL | ISO-8601 timestamp. |

**Relationships**
- One athlete has many `strava_activities`.
- One athlete has many `weekly_scores`.
- One athlete has many `weekly_metrics`.

---

### 2) `weeks`
Represents competition weeks. All scoring is tied to a week.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY | Surrogate key. |
| `week_start` | TEXT | NOT NULL, UNIQUE | ISO-8601 date (week boundary). |
| `week_end` | TEXT | NOT NULL | ISO-8601 date. |
| `label` | TEXT | NOT NULL | Human label (e.g., "2025-W12"). |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp. |
| `updated_at` | TEXT | NOT NULL | ISO-8601 timestamp. |

**Relationships**
- One week has many `weekly_scores`.
- One week has many `weekly_metrics`.
- One week has many `ai_commentary` entries.

---

### 3) `strava_activities`
Raw activity data ingested from Strava. Used for deriving weekly and overall scores.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY | Surrogate key. |
| `athlete_id` | INTEGER | NOT NULL, FK → `athletes.id` | Owner athlete. |
| `strava_activity_id` | TEXT | UNIQUE, NOT NULL | External identifier from Strava. |
| `activity_type` | TEXT | NOT NULL, CHECK (`activity_type` IN ('swim', 'bike', 'run')) | Discipline type. |
| `start_time` | TEXT | NOT NULL | ISO-8601 timestamp. |
| `duration_seconds` | INTEGER | NOT NULL | Activity duration in seconds. |
| `distance_meters` | REAL | NOT NULL | Activity distance in meters. |
| `effort_score` | REAL | NOT NULL | Activity effort score derived from Strava data. |
| `source_payload` | TEXT | NOT NULL | Raw JSON payload (string). |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp. |
| `updated_at` | TEXT | NOT NULL | ISO-8601 timestamp. |

**Relationships**
- Many activities belong to one `athlete`.

---

### 4) `weekly_scores`
Weekly scoring per athlete with discipline breakdown and totals.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY | Surrogate key. |
| `week_id` | INTEGER | NOT NULL, FK → `weeks.id` | Competition week. |
| `athlete_id` | INTEGER | NOT NULL, FK → `athletes.id` | Athlete. |
| `swim_score` | REAL | NOT NULL | Weekly swim score. |
| `bike_score` | REAL | NOT NULL | Weekly bike score. |
| `run_score` | REAL | NOT NULL | Weekly run score. |
| `total_score` | REAL | NOT NULL | Sum of swim/bike/run. |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp. |
| `updated_at` | TEXT | NOT NULL | ISO-8601 timestamp. |

**Relationships**
- Many weekly scores belong to one `week` and one `athlete`.

**Uniqueness**
- Enforce `UNIQUE (week_id, athlete_id)` to keep one score row per athlete per week.

---

### 5) `weekly_metrics`
Training load metrics per athlete per week.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY | Surrogate key. |
| `week_id` | INTEGER | NOT NULL, FK → `weeks.id` | Competition week. |
| `athlete_id` | INTEGER | NOT NULL, FK → `athletes.id` | Athlete. |
| `fatigue` | REAL | NOT NULL | Weekly fatigue metric. |
| `fitness` | REAL | NOT NULL | Weekly fitness metric. |
| `form` | REAL | NOT NULL | Weekly form metric. |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp. |
| `updated_at` | TEXT | NOT NULL | ISO-8601 timestamp. |

**Relationships**
- Many weekly metrics belong to one `week` and one `athlete`.

**Uniqueness**
- Enforce `UNIQUE (week_id, athlete_id)` to keep one metrics row per athlete per week.

---

### 6) `ai_commentary`
Stores AI referee commentary only (no scoring logic). Scoped to a week.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY | Surrogate key. |
| `week_id` | INTEGER | NOT NULL, FK → `weeks.id` | Commentary scope. |
| `prompt` | TEXT | NOT NULL | Prompt used to generate commentary. |
| `commentary` | TEXT | NOT NULL | Generated narrative text. |
| `model_name` | TEXT | NOT NULL | Model identifier (e.g., "gpt-4o"). |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp. |

**Relationships**
- Many commentary entries belong to one `week`.

---

## Relationship Diagram (Text)

- `athletes (1) ──< strava_activities (many)`
- `athletes (1) ──< weekly_scores (many)`
- `athletes (1) ──< weekly_metrics (many)`
- `weeks (1) ──< weekly_scores (many)`
- `weeks (1) ──< weekly_metrics (many)`
- `weeks (1) ──< ai_commentary (many)`

## Indexing Notes

Recommended indexes for query performance:
- `strava_activities(athlete_id, start_time)`
- `weekly_scores(week_id, total_score)`
- `weekly_scores(athlete_id, week_id)`
- `weekly_metrics(week_id, athlete_id)`
