const SYSTEM_PROMPT = `You are the AI Referee for a gamified Ironman training league.

**Role & tone**
- Competitive, witty, slightly sarcastic.
- Never insulting or cruel.
- Never medical.

**Hard constraints**
- Do NOT give training advice.
- Do NOT mention injuries or health risks.
- Do NOT suggest future training actions.
- Commentary must be explainable from the provided inputs only.
- Scores are already finalized; you are not allowed to change them.

**Output format**
Return a single response with these sections and rules:
1. **Weekly Summary** (3–5 sentences).
2. **Athlete Comments** (one short comment per athlete, 1–2 sentences each).
3. **Discipline Callout**: choose one label and winner with a short justification:
   - “Swim Specialist of the Week”
   - “Bike Monster”
   - “Run Engine”
4. **Humorous Warning or Praise**: one short line.

Do not add extra sections.`;

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

export function computeBalanceIndicator({ swimScore, bikeScore, runScore }) {
  const scores = [swimScore, bikeScore, runScore];
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  if (max - min <= 10) {
    return 'even';
  }

  if (max === swimScore) {
    return 'swim-skewed';
  }

  if (max === bikeScore) {
    return 'bike-skewed';
  }

  return 'run-skewed';
}

export function buildUserPrompt({ weekLabel, athleteSummaries }) {
  const athleteBlocks = athleteSummaries
    .map((athlete) => {
      return [
        `  - Name: ${athlete.name}`,
        `  - Overall score: ${formatNumber(athlete.overallScore)}`,
        `  - Swim score: ${formatNumber(athlete.swimScore)}`,
        `  - Bike score: ${formatNumber(athlete.bikeScore)}`,
        `  - Run score: ${formatNumber(athlete.runScore)}`,
        `  - Form (overall): ${formatNumber(athlete.formOverall)}`,
        `  - Form (swim/bike/run): ${formatNumber(athlete.formSwim)} / ${formatNumber(athlete.formBike)} / ${formatNumber(athlete.formRun)}`,
        `  - Balance indicator: ${athlete.balanceIndicator} (e.g., even, swim-skewed, bike-skewed, run-skewed)`,
      ].join('\n');
    })
    .join('\n');

  return `Generate this week’s AI referee commentary using the inputs below.\n\nInputs:\n- Week label: ${weekLabel}\n- Athlete data (one block per athlete):\n${athleteBlocks}\n\nRules reminder:\n- No training advice.\n- No injury/health mentions.\n- No future suggestions.\n- Commentary must be explainable from the inputs.\n\nReturn only the final formatted commentary.`;
}

export function buildPromptPayload({ weekLabel, athleteSummaries }) {
  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt({ weekLabel, athleteSummaries }),
  };
}

export async function generateAiCommentary({ client, modelName, systemPrompt, userPrompt }) {
  if (!client || typeof client.generate !== 'function') {
    throw new Error('AI client must expose a generate() method.');
  }

  return client.generate({ modelName, systemPrompt, userPrompt });
}

export function getSystemPrompt() {
  return SYSTEM_PROMPT;
}
