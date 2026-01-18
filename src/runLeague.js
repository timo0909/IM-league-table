#!/usr/bin/env node

// Usage: node src/runLeague.js --weekStart=YYYY-MM-DD --weekEnd=YYYY-MM-DD
// Example: node src/runLeague.js --weekStart=2025-03-03 --weekEnd=2025-03-17

import { Database } from './db.js';
import { getWeekStartDate } from './trainingLoad.js';
import { runWeeklyLeague } from './weeklyPipeline.js';

function parseArgs(argv) {
  const args = {};

  for (const entry of argv) {
    if (entry.startsWith('--weekStart=')) {
      args.weekStart = entry.split('=')[1];
    } else if (entry.startsWith('--weekEnd=')) {
      args.weekEnd = entry.split('=')[1];
    }
  }

  return args;
}

function createOpenAiClient({ apiKey }) {
  return {
    async generate({ modelName, systemPrompt, userPrompt }) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    },
  };
}

async function main() {
  const { weekStart, weekEnd } = parseArgs(process.argv.slice(2));
  const fallbackWeekStart = getWeekStartDate(new Date().toISOString());
  const resolvedWeekStart = weekStart ?? fallbackWeekStart;

  const dbPath = process.env.DATABASE_PATH ?? 'league.sqlite';
  const db = new Database(dbPath);

  const apiKey = process.env.OPENAI_API_KEY;
  const aiClient = apiKey ? createOpenAiClient({ apiKey }) : null;
  const modelName = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  try {
    console.info('[league] starting weekly pipeline');

    const results = await runWeeklyLeague({
      db,
      weekStart: resolvedWeekStart,
      weekEnd,
      aiClient,
      modelName,
      logger: console,
    });

    const processed = results.map((result) => result.weekStart).join(', ') || 'none';
    console.info(`[league] processed weeks: ${processed}`);
    console.info('[league] weekly pipeline completed');
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error('[league] fatal error:', error);
  process.exitCode = 1;
});
