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
    formLoad: 0,
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

function computeRollingAverage(points, endDate, windowDays, field) {
  const windowStart = new Date(endDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - (windowDays - 1));

  const values = points
    .filter((point) => point.date >= windowStart && point.date <= endDate)
    .map((point) => point[field]);

  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

export function computeWeeklyMetrics(
  weeklyLoads,
  { acuteDays = 7, chronicDays = 28 } = {}
) {
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
    loads.sort((a, b) => a.date - b.date);

    for (const point of loads) {
      const weekStart = point.date.toISOString().slice(0, 10);
      const metric = initMetrics(weekStart);
      metric.athleteId = athleteId;

      metric.acuteLoad = computeRollingAverage(loads, point.date, acuteDays, 'totalLoad');
      metric.chronicLoad = computeRollingAverage(loads, point.date, chronicDays, 'totalLoad');
      metric.formLoad = metric.chronicLoad - metric.acuteLoad;

      metric.acuteSwim = computeRollingAverage(loads, point.date, acuteDays, 'swimLoad');
      metric.chronicSwim = computeRollingAverage(loads, point.date, chronicDays, 'swimLoad');
      metric.formSwim = metric.chronicSwim - metric.acuteSwim;

      metric.acuteBike = computeRollingAverage(loads, point.date, acuteDays, 'bikeLoad');
      metric.chronicBike = computeRollingAverage(loads, point.date, chronicDays, 'bikeLoad');
      metric.formBike = metric.chronicBike - metric.acuteBike;

      metric.acuteRun = computeRollingAverage(loads, point.date, acuteDays, 'runLoad');
      metric.chronicRun = computeRollingAverage(loads, point.date, chronicDays, 'runLoad');
      metric.formRun = metric.chronicRun - metric.acuteRun;

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
