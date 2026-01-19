import sqlite3 from 'sqlite3';
import { promisify } from 'node:util';

export class Database {
  constructor(filePath) {
    this.db = new sqlite3.Database(filePath);
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  async close() {
    const closeAsync = promisify(this.db.close.bind(this.db));
    await closeAsync();
  }

  async insertStravaActivity(activity) {
    const sql = `
      INSERT OR IGNORE INTO strava_activities (
        athlete_id,
        strava_activity_id,
        activity_type,
        start_time,
        duration_seconds,
        distance_meters,
        effort_score,
        source_payload,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      activity.athleteId,
      activity.stravaActivityId,
      activity.activityType,
      activity.startTime,
      activity.durationSeconds,
      activity.distanceMeters,
      activity.effortScore,
      activity.sourcePayload,
      activity.createdAt,
      activity.updatedAt,
    ];

    await this.run(sql, params);
  }

  async listActivitiesBetween(startTime, endTime) {
    const sql = `
      SELECT
        athlete_id as athleteId,
        activity_type as activityType,
        start_time as startTime,
        duration_seconds as durationSeconds,
        distance_meters as distanceMeters,
        effort_score as effortScore
      FROM strava_activities
      WHERE start_time >= ? AND start_time < ?
    `;

    return this.all(sql, [startTime, endTime]);
  }

  async listAthletes() {
    const sql = `
      SELECT id, display_name as displayName
      FROM athletes
      ORDER BY id
    `;

    return this.all(sql);
  }

  async ensureWeek({ weekStart, weekEnd, label, timestamp }) {
    const insertSql = `
      INSERT OR IGNORE INTO weeks (
        week_start,
        week_end,
        label,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `;

    await this.run(insertSql, [weekStart, weekEnd, label, timestamp, timestamp]);

    const selectSql = `
      SELECT id, label
      FROM weeks
      WHERE week_start = ?
    `;

    return this.get(selectSql, [weekStart]);
  }

  async upsertWeeklyMetrics({ weekId, metrics, timestamp }) {
    const sql = `
      INSERT OR REPLACE INTO weekly_metrics (
        week_id,
        athlete_id,
        acute_load,
        chronic_load,
        form,
        acute_swim,
        chronic_swim,
        form_swim,
        acute_bike,
        chronic_bike,
        form_bike,
        acute_run,
        chronic_run,
        form_run,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const metric of metrics) {
      const params = [
        weekId,
        metric.athleteId,
        metric.acuteLoad,
        metric.chronicLoad,
        metric.form,
        metric.acuteSwim,
        metric.chronicSwim,
        metric.formSwim,
        metric.acuteBike,
        metric.chronicBike,
        metric.formBike,
        metric.acuteRun,
        metric.chronicRun,
        metric.formRun,
        timestamp,
        timestamp,
      ];

      await this.run(sql, params);
    }
  }

  async upsertWeeklyScores({ weekId, scores, timestamp }) {
    const sql = `
      INSERT OR REPLACE INTO weekly_scores (
        week_id,
        athlete_id,
        swim_score,
        bike_score,
        run_score,
        total_score,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const score of scores) {
      const params = [
        weekId,
        score.athleteId,
        score.swim_score,
        score.bike_score,
        score.run_score,
        score.total_score,
        timestamp,
        timestamp,
      ];

      await this.run(sql, params);
    }
  }

  async upsertAiCommentary({ weekId, prompt, commentary, modelName, timestamp }) {
    const deleteSql = `
      DELETE FROM ai_commentary
      WHERE week_id = ?
    `;

    await this.run(deleteSql, [weekId]);

    const insertSql = `
      INSERT INTO ai_commentary (
        week_id,
        prompt,
        commentary,
        model_name,
        created_at
      ) VALUES (?, ?, ?, ?, ?)
    `;

    await this.run(insertSql, [weekId, prompt, commentary, modelName, timestamp]);
  }

  async runInTransaction(callback) {
    await this.run('BEGIN');

    try {
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }
}
