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
}
