import { aggregateWeeklyLoads, getWeekStartDate } from './trainingLoad.js';
import { computeWeeklyMetrics } from './weeklyMetrics.js';
import { computeWeeklyScores } from './weeklyScoring.js';
import { buildPromptPayload, computeBalanceIndicator, generateAiCommentary } from './aiReferee.js';

function toUtcDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function toIsoDateTime(date) {
  return date.toISOString();
}

function addWeeks(date, weeks) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + weeks * 7);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getIsoWeekLabel(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);

  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target - firstThursday;
  const weekNumber = 1 + Math.round((diff / 86400000 - 3) / 7);

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function listWeekStarts(startDate, endDate) {
  const weeks = [];
  for (let cursor = startDate; cursor <= endDate; cursor = addWeeks(cursor, 1)) {
    weeks.push(toIsoDate(cursor));
  }
  return weeks;
}

function resolveWeekRange({ weekStart, weekEnd }) {
  const today = new Date();
  const fallbackStart = getWeekStartDate(today.toISOString());
  const startDate = toUtcDate(weekStart ?? fallbackStart);
  const endDate = toUtcDate(weekEnd ?? weekStart ?? fallbackStart);

  if (!startDate || !endDate) {
    return null;
  }

  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

function indexBy(list, key) {
  const map = new Map();
  for (const item of list) {
    map.set(item[key], item);
  }
  return map;
}

function groupByWeek(entries) {
  const grouped = new Map();
  for (const entry of entries) {
    if (!grouped.has(entry.weekStart)) {
      grouped.set(entry.weekStart, []);
    }
    grouped.get(entry.weekStart).push(entry);
  }
  return grouped;
}

function buildAthleteSummaries({ scores, metrics, athletes }) {
  const metricsByAthlete = indexBy(metrics, 'athleteId');
  const athletesById = indexBy(athletes, 'id');

  return scores.map((score) => {
    const metric = metricsByAthlete.get(score.athleteId) ?? {};
    const athlete = athletesById.get(score.athleteId);
    const swimScore = score.swim_score ?? 0;
    const bikeScore = score.bike_score ?? 0;
    const runScore = score.run_score ?? 0;

    return {
      name: athlete?.displayName ?? `Athlete ${score.athleteId}`,
      overallScore: score.total_score ?? 0,
      swimScore,
      bikeScore,
      runScore,
      formOverall: metric.form ?? 0,
      formSwim: metric.formSwim ?? 0,
      formBike: metric.formBike ?? 0,
      formRun: metric.formRun ?? 0,
      balanceIndicator: computeBalanceIndicator({ swimScore, bikeScore, runScore }),
    };
  });
}

export async function runWeeklyLeague({
  db,
  weekStart,
  weekEnd,
  aiClient,
  modelName = 'gpt-4o-mini',
  logger = console,
}) {
  const range = resolveWeekRange({ weekStart, weekEnd });
  if (!range) {
    throw new Error('Invalid week range provided.');
  }

  const { startDate, endDate } = range;
  const rangeStart = addWeeks(startDate, -3); // Include trailing weeks for chronic load.
  const rangeEnd = addWeeks(endDate, 1); // Exclusive end for the final week.
  const timestamp = new Date().toISOString();

  // Step 1: Fetch activities and aggregate weekly loads.
  const activities = await db.listActivitiesBetween(
    toIsoDateTime(rangeStart),
    toIsoDateTime(rangeEnd)
  );
  const weeklyLoads = aggregateWeeklyLoads(activities);

  // Step 2: Compute weekly metrics and scores using the locked logic.
  const weeklyMetrics = computeWeeklyMetrics(weeklyLoads);
  const weeklyScores = computeWeeklyScores(weeklyMetrics);

  const metricsByWeek = groupByWeek(weeklyMetrics);
  const scoresByWeek = groupByWeek(weeklyScores);
  const athletes = await db.listAthletes();

  const weeksToProcess = listWeekStarts(startDate, endDate);
  const results = [];

  for (const weekStartValue of weeksToProcess) {
    try {
      const weekDate = toUtcDate(weekStartValue);
      if (!weekDate) {
        throw new Error(`Invalid week start date: ${weekStartValue}`);
      }

      const weekLabel = getIsoWeekLabel(weekDate);
      const weekEndDate = addDays(weekDate, 6);
      const week = await db.ensureWeek({
        weekStart: weekStartValue,
        weekEnd: toIsoDate(weekEndDate),
        label: weekLabel,
        timestamp,
      });

      const metricsForWeek = metricsByWeek.get(weekStartValue) ?? [];
      const scoresForWeek = scoresByWeek.get(weekStartValue) ?? [];

      await db.runInTransaction(async () => {
        await db.upsertWeeklyMetrics({ weekId: week.id, metrics: metricsForWeek, timestamp });
        await db.upsertWeeklyScores({ weekId: week.id, scores: scoresForWeek, timestamp });
      });

      if (!aiClient) {
        throw new Error('AI client missing; cannot generate commentary.');
      }

      const athleteSummaries = buildAthleteSummaries({
        scores: scoresForWeek,
        metrics: metricsForWeek,
        athletes,
      });

      const { systemPrompt, userPrompt } = buildPromptPayload({
        weekLabel,
        athleteSummaries,
      });

      const commentary = await generateAiCommentary({
        client: aiClient,
        modelName,
        systemPrompt,
        userPrompt,
      });

      await db.upsertAiCommentary({
        weekId: week.id,
        prompt: `System Prompt:\n${systemPrompt}\n\nUser Prompt:\n${userPrompt}`,
        commentary,
        modelName,
        timestamp,
      });

      results.push({ weekStart: weekStartValue, weekId: week.id, label: weekLabel });
    } catch (error) {
      logger.error(`Weekly pipeline failed for ${weekStartValue}:`, error);
    }
  }

  return results;
}
