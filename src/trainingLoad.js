const DISCIPLINES = ['swim', 'bike', 'run'];

function toNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function computeActivityLoad(activity, { effortFallback = 1 } = {}) {
  const durationSeconds = toNumber(activity.durationSeconds);
  if (durationSeconds === null) {
    return null;
  }

  const durationMinutes = durationSeconds / 60;
  const effortScore = toNumber(activity.effortScore);
  const effortMultiplier = effortScore === null ? effortFallback : effortScore;

  return durationMinutes * effortMultiplier;
}

export function getWeekStartDate(isoDateTime, { weekStartsOn = 1 } = {}) {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const utcDay = date.getUTCDay();
  const diff = (utcDay - weekStartsOn + 7) % 7;
  const weekStart = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - diff
  ));

  return weekStart.toISOString().slice(0, 10);
}

function initLoadBucket() {
  return {
    totalLoad: 0,
    swimLoad: 0,
    bikeLoad: 0,
    runLoad: 0,
  };
}

function addDisciplineLoad(bucket, discipline, load) {
  if (discipline === 'swim') {
    bucket.swimLoad += load;
  } else if (discipline === 'bike') {
    bucket.bikeLoad += load;
  } else if (discipline === 'run') {
    bucket.runLoad += load;
  }

  bucket.totalLoad += load;
}

export function aggregateWeeklyLoads(
  activities,
  { effortFallback = 1, weekStartsOn = 1 } = {}
) {
  const buckets = new Map();

  for (const activity of activities) {
    if (!DISCIPLINES.includes(activity.activityType)) {
      continue;
    }

    const weekStart = getWeekStartDate(activity.startTime, { weekStartsOn });
    if (!weekStart) {
      continue;
    }

    const load = computeActivityLoad(activity, { effortFallback });
    if (load === null) {
      continue;
    }

    const key = `${activity.athleteId}::${weekStart}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        athleteId: activity.athleteId,
        weekStart,
        ...initLoadBucket(),
      });
    }

    addDisciplineLoad(buckets.get(key), activity.activityType, load);
  }

  return Array.from(buckets.values());
}

export function aggregateOverallLoads(activities, { effortFallback = 1 } = {}) {
  const buckets = new Map();

  for (const activity of activities) {
    if (!DISCIPLINES.includes(activity.activityType)) {
      continue;
    }

    const load = computeActivityLoad(activity, { effortFallback });
    if (load === null) {
      continue;
    }

    if (!buckets.has(activity.athleteId)) {
      buckets.set(activity.athleteId, {
        athleteId: activity.athleteId,
        ...initLoadBucket(),
      });
    }

    addDisciplineLoad(buckets.get(activity.athleteId), activity.activityType, load);
  }

  return Array.from(buckets.values());
}
