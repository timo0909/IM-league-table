function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRange(values, { fallback = 50 } = {}) {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return values.map(() => fallback);
  }

  return values.map((value) => ((value - min) / (max - min)) * 100);
}

function computeDisciplineRaw({ acute, chronic, form }) {
  // Consistency: blend weekly load (acute) with chronic load.
  const baseLoad = acute * 0.7 + chronic * 0.3;

  // Penalize extreme negative form more heavily; positive form is a mild boost.
  const formMultiplier = form < 0 ? clamp(1 + form / 100, 0.2, 1) : 1 + form / 200;

  return baseLoad * formMultiplier;
}

function computeBalanceMultiplier(scores) {
  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const variance = scores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Reward balance with a gentle multiplier; clamp to avoid extreme swings.
  return clamp(1 - stdDev / 100, 0.85, 1.05);
}

export function computeWeeklyScores(weeklyMetrics) {
  const metricsByWeek = new Map();

  for (const metric of weeklyMetrics) {
    if (!metric || !metric.weekStart || !metric.athleteId) {
      continue;
    }

    if (!metricsByWeek.has(metric.weekStart)) {
      metricsByWeek.set(metric.weekStart, []);
    }

    metricsByWeek.get(metric.weekStart).push(metric);
  }

  const weeklyScores = [];

  for (const [weekStart, metrics] of metricsByWeek.entries()) {
    const rawSwim = metrics.map((metric) =>
      computeDisciplineRaw({
        acute: metric.acuteSwim,
        chronic: metric.chronicSwim,
        form: metric.formSwim,
      })
    );
    const rawBike = metrics.map((metric) =>
      computeDisciplineRaw({
        acute: metric.acuteBike,
        chronic: metric.chronicBike,
        form: metric.formBike,
      })
    );
    const rawRun = metrics.map((metric) =>
      computeDisciplineRaw({
        acute: metric.acuteRun,
        chronic: metric.chronicRun,
        form: metric.formRun,
      })
    );

    const swimScores = normalizeRange(rawSwim);
    const bikeScores = normalizeRange(rawBike);
    const runScores = normalizeRange(rawRun);

    metrics.forEach((metric, index) => {
      const disciplineScores = [swimScores[index], bikeScores[index], runScores[index]];
      const balanceMultiplier = computeBalanceMultiplier(disciplineScores);

      // Penalize strongly negative overall form to discourage overreaching.
      const overallForm = (metric.formSwim + metric.formBike + metric.formRun) / 3;
      const formPenalty = overallForm < 0 ? clamp(1 + overallForm / 100, 0.7, 1) : 1;

      const totalScore =
        (disciplineScores.reduce((sum, score) => sum + score, 0) / 3) *
        balanceMultiplier *
        formPenalty;

      weeklyScores.push({
        weekStart,
        athleteId: metric.athleteId,
        swim_score: clamp(swimScores[index], 0, 100),
        bike_score: clamp(bikeScores[index], 0, 100),
        run_score: clamp(runScores[index], 0, 100),
        total_score: clamp(totalScore, 0, 100),
      });
    });
  }

  return weeklyScores;
}
