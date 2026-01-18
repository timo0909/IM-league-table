import React, { useEffect, useMemo, useState } from 'react';
import LeagueTable from './LeagueTable.jsx';
import WeekSelector from './WeekSelector.jsx';

const pageStyles = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '32px 24px 56px',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  color: '#0f172a',
};

const headerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: '24px',
};

const titleStyles = {
  margin: 0,
  fontSize: '2rem',
  letterSpacing: '-0.02em',
};

const subTitleStyles = {
  margin: '4px 0 0',
  color: '#475569',
  fontSize: '0.95rem',
};

const cardStyles = {
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '16px',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
};

const commentaryStyles = {
  marginTop: '24px',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  whiteSpace: 'pre-wrap',
  lineHeight: 1.6,
};

const fallbackCommentary = 'No commentary available for this week.';

/**
 * Example API response shape for a given week:
 * {
 *   week: '2025-W12',
 *   results: [
 *     {
 *       athleteId: 1,
 *       athleteName: 'Asha',
 *       totalScore: 92.4,
 *       swimScore: 88.1,
 *       bikeScore: 95.2,
 *       runScore: 93.8
 *     }
 *   ],
 *   commentary: '...formatted text...'
 * }
 */
export default function LeaguePage() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [rows, setRows] = useState([]);
  const [commentary, setCommentary] = useState('');

  useEffect(() => {
    async function loadWeeks() {
      const response = await fetch('/api/weeks');
      const data = await response.json();
      const sortedWeeks = data.weeks ?? [];
      setWeeks(sortedWeeks);
      setSelectedWeek(sortedWeeks[sortedWeeks.length - 1] ?? '');
    }

    loadWeeks();
  }, []);

  useEffect(() => {
    if (!selectedWeek) {
      return;
    }

    async function loadWeek() {
      const response = await fetch(`/api/league?week=${selectedWeek}`);
      const data = await response.json();
      setRows(data.results ?? []);
      setCommentary(data.commentary ?? '');
    }

    loadWeek();
  }, [selectedWeek]);

  const headingLabel = useMemo(() => {
    return selectedWeek ? `Week ${selectedWeek}` : 'Loading week...';
  }, [selectedWeek]);

  return (
    <main style={pageStyles}>
      <header style={headerStyles}>
        <div>
          <h1 style={titleStyles}>League Table</h1>
          <p style={subTitleStyles}>Weekly standings and AI referee commentary.</p>
        </div>
        {weeks.length > 0 && (
          <WeekSelector
            weeks={weeks}
            selectedWeek={selectedWeek}
            onChange={setSelectedWeek}
          />
        )}
      </header>

      <section style={cardStyles}>
        {/* Desktop-first layout keeps the table and commentary stacked for clarity. */}
        <h2 style={{ marginTop: 0 }}>{headingLabel}</h2>
        <LeagueTable rows={rows} />
      </section>

      <section style={commentaryStyles}>
        <h3 style={{ marginTop: 0 }}>AI Referee Commentary</h3>
        {commentary || fallbackCommentary}
      </section>
    </main>
  );
}
