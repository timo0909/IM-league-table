import React from 'react';

const selectorStyles = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  marginBottom: '16px',
};

const selectStyles = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '0.95rem',
};

export default function WeekSelector({ weeks, selectedWeek, onChange }) {
  return (
    <div style={selectorStyles}>
      <label htmlFor="weekSelect" style={{ fontWeight: 600 }}>
        Week
      </label>
      <select
        id="weekSelect"
        value={selectedWeek}
        onChange={(event) => onChange(event.target.value)}
        style={selectStyles}
      >
        {weeks.map((week) => (
          <option key={week} value={week}>
            {week}
          </option>
        ))}
      </select>
    </div>
  );
}
