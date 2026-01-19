const DISCIPLINES = ['swim', 'bike', 'run'];

function toDateValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function initMetrics(weekStart) {
  return {
    weekStart,
    acuteLoad: 0,
    chronicLoad: 0,
    form: 0,
    acuteSwim: 0,
    chronicSwim: 0,
    formSwim: 0,
    acuteBike: 0,
    chronicBike: 0,
    formBike: 0,
    acuteRun: 0,
    chronicRun: 0,
    formRun: 0,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function addWeeks(date, weeks) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + weeks * 7);
  return next;
}

function createWeeklySeries(loads) {
  if (loads.length === 0) {
    return [];
  }

  const sorted = [...loads].sort((a, b) => a.date - b.date);
  const start = sorted[0].date;
  const end = sorted[sorted.length - 1].date;
  const byWeek = new Map(sorted.map((entry) => [entry.weekStart, entry]));

  const series = [];
  for (let cursor = start; cursor <= end; cursor = addWeeks(cursor, 1)) {
    const weekStart = cursor.toISOString().slice(0, 10);
    const entry = byWeek.get(weekStart);

    series.push({
      weekStart,
      totalLoad: entry?.totalLoad ?? 0,
      swimLoad: entry?.swimLoad ?? 0,
      bikeLoad: entry?.bikeLoad ?? 0,
      runLoad: entry?.runLoad ?? 0,
    });
  }

  return series;
}

function computeWindowAverage(series, index, windowSize, field) {
  let sum = 0;
  // Index-based window with missing weeks treated as zero.
  for (let offset = 0; offset < windowSize; offset += 1) {
    const position = index - offset;
    if (position >= 0) {
      sum += series[position][field];
    }
  }

  // Always divide by full window size for gamification consistency.
  return sum / windowSize;
}

export function computeWeeklyMetrics(weeklyLoads) {
  const loadsByAthlete = new Map();

  for (const load of weeklyLoads) {
    if (!load || !load.athleteId || !load.weekStart) {
      continue;
    }

    const date = toDateValue(load.weekStart);
    if (!date) {
      continue;
    }

    const entry = {
      athleteId: load.athleteId,
      date,
      weekStart: date.toISOString().slice(0, 10),
      totalLoad: load.totalLoad ?? 0,
      swimLoad: load.swimLoad ?? 0,
      bikeLoad: load.bikeLoad ?? 0,
      runLoad: load.runLoad ?? 0,
    };

    if (!loadsByAthlete.has(load.athleteId)) {
      loadsByAthlete.set(load.athleteId, []);
    }

    loadsByAthlete.get(load.athleteId).push(entry);
  }

  const metrics = [];

  for (const [athleteId, loads] of loadsByAthlete.entries()) {
    const series = createWeeklySeries(loads);

    for (let index = 0; index < series.length; index += 1) {
      const point = series[index];
      const metric = initMetrics(point.weekStart);
      metric.athleteId = athleteId;

      metric.acuteLoad = computeWindowAverage(series, index, 1, 'totalLoad');
      metric.chronicLoad = computeWindowAverage(series, index, 4, 'totalLoad');
      metric.form = clamp(metric.chronicLoad - metric.acuteLoad, -100, 100);

      metric.acuteSwim = computeWindowAverage(series, index, 1, 'swimLoad');
      metric.chronicSwim = computeWindowAverage(series, index, 4, 'swimLoad');
      metric.formSwim = clamp(metric.chronicSwim - metric.acuteSwim, -100, 100);

      metric.acuteBike = computeWindowAverage(series, index, 1, 'bikeLoad');
      metric.chronicBike = computeWindowAverage(series, index, 4, 'bikeLoad');
      metric.formBike = clamp(metric.chronicBike - metric.acuteBike, -100, 100);

      metric.acuteRun = computeWindowAverage(series, index, 1, 'runLoad');
      metric.chronicRun = computeWindowAverage(series, index, 4, 'runLoad');
      metric.formRun = clamp(metric.chronicRun - metric.acuteRun, -100, 100);

      metrics.push(metric);
    }
  }

  return metrics;
}

export function summarizeWeeklyMetrics(metrics) {
  const summary = new Map();

  for (const metric of metrics) {
    if (!summary.has(metric.athleteId)) {
      summary.set(metric.athleteId, []);
    }

    summary.get(metric.athleteId).push(metric);
  }

  for (const entries of summary.values()) {
    entries.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  return summary;
}

export function getDisciplineList() {
  return [...DISCIPLINES];
}
