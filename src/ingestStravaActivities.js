import { fetchActivitiesPage, mapStravaTypeToDiscipline } from './stravaClient.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeActivity({ athleteId, activity }) {
  const discipline = mapStravaTypeToDiscipline(activity.type);
  if (!discipline) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    athleteId,
    stravaActivityId: String(activity.id),
    activityType: discipline,
    startTime: activity.start_date,
    durationSeconds: activity.moving_time,
    distanceMeters: activity.distance,
    effortScore:
      typeof activity.suffer_score === 'number' ? activity.suffer_score : null,
    sourcePayload: JSON.stringify(activity),
    createdAt: now,
    updatedAt: now,
  };
}

export async function ingestStravaActivities({
  db,
  athleteId,
  accessToken,
  after,
  before,
  perPage = 50,
}) {
  let page = 1;
  let hasMore = true;
  let fetched = 0;
  let inserted = 0;
  let skipped = 0;

  while (hasMore) {
    const activities = await fetchActivitiesPage({
      accessToken,
      page,
      perPage,
      after,
      before,
    });

    fetched += activities.length;

    const normalizedActivities = activities
      .map((activity) => normalizeActivity({ athleteId, activity }))
      .filter(Boolean);

    for (const activity of normalizedActivities) {
      try {
        await db.insertStravaActivity(activity);
        inserted += 1;
      } catch (err) {
        // Assume unique constraint violation = already ingested
        skipped += 1;
      }
    }

    hasMore = activities.length === perPage;
    page += 1;

    // Rate limiting safety
    await sleep(300);
  }

  return { fetched, inserted, skipped };
}
