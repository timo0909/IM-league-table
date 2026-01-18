import React from 'react';

const tableStyles = {
  width: '100%',
  borderCollapse: 'collapse',
};

const headerStyles = {
  textAlign: 'left',
  borderBottom: '2px solid #1f2937',
  padding: '12px 8px',
  fontSize: '0.9rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#111827',
};

const cellStyles = {
  padding: '12px 8px',
  borderBottom: '1px solid #e5e7eb',
  fontVariantNumeric: 'tabular-nums',
};

const leaderRowStyles = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
};

const leaderBadgeStyles = {
  display: 'inline-block',
  marginLeft: '8px',
  padding: '2px 6px',
  fontSize: '0.7rem',
  borderRadius: '999px',
  backgroundColor: '#fbbf24',
  color: '#111827',
  fontWeight: 700,
};

function formatScore(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

export default function LeagueTable({ rows }) {
  const sorted = [...rows].sort((a, b) => b.totalScore - a.totalScore);
  const leaderId = sorted[0]?.athleteId;

  return (
    <table style={tableStyles} aria-label="Weekly league table">
      <thead>
        <tr>
          <th style={headerStyles}>Athlete</th>
          <th style={headerStyles}>Total</th>
          <th style={headerStyles}>Swim</th>
          <th style={headerStyles}>Bike</th>
          <th style={headerStyles}>Run</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => {
          const isLeader = row.athleteId === leaderId;
          return (
            <tr key={row.athleteId} style={isLeader ? leaderRowStyles : undefined}>
              <td style={cellStyles}>
                {row.athleteName}
                {isLeader && <span style={leaderBadgeStyles}>Leader</span>}
              </td>
              <td style={cellStyles}>{formatScore(row.totalScore)}</td>
              <td style={cellStyles}>{formatScore(row.swimScore)}</td>
              <td style={cellStyles}>{formatScore(row.bikeScore)}</td>
              <td style={cellStyles}>{formatScore(row.runScore)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
