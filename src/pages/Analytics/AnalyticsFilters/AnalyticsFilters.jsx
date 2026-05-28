import React from 'react';
import './AnalyticsFilters.css';

const FILTERS = [
  { label: '1 Month', value: 1 },
  { label: '3 Months', value: 3 },
  { label: '6 Months', value: 6 },
];

export default function AnalyticsFilters({ selected, onChange }) {
  return (
    <div className="af-container">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          className={`af-btn ${selected === f.value ? 'active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}