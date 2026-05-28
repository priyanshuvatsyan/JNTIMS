import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';
import './StockMovementChart.css';

function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="smc-tooltip">
      <p className="smc-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '0.8rem' }}>
          {p.name}: {p.value} units
        </p>
      ))}
    </div>
  );
}

export default function StockMovementChart({ stats, loading }) {
  const data = stats?.stockMovementData?.map(d => ({
    month: formatMonth(d.month),
    In: d.in,
    Out: d.out,
  })) || [];

  return (
    <div className="smc-container">
      <div className="smc-header">
        <span className="smc-title">Stock Movement</span>
        <div className="smc-legend">
          <span className="smc-legend-dot" style={{ background: '#4c6ef5' }} />
          <span className="smc-legend-label">In</span>
          <span className="smc-legend-dot" style={{ background: '#e53935' }} />
          <span className="smc-legend-label">Out</span>
        </div>
      </div>

      {loading || !stats ? (
        <div className="smc-skeleton" />
      ) : data.length === 0 ? (
        <div className="smc-empty">No stock movement data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4c6ef5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e53935" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#e53935" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#aaa' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#aaa' }}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="In"
              stroke="#4c6ef5"
              strokeWidth={2}
              fill="url(#colorIn)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="Out"
              stroke="#e53935"
              strokeWidth={2}
              fill="url(#colorOut)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}