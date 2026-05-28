import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './RevenueChart.css';

function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short' });
}

function formatYAxis(val) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
  if (val >= 1000)   return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rc-tooltip">
      <p className="rc-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '0.8rem' }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart({ stats, loading }) {
  const data = stats?.monthlyData?.map(d => ({
    month: formatMonth(d.month),
    Revenue: d.revenue,
    Profit: d.profit,
  })) || [];

  return (
    <div className="rc-container">
      <div className="rc-header">
        <span className="rc-title">Revenue & Profit</span>
        <div className="rc-legend">
          <span className="rc-legend-dot" style={{ background: '#4c6ef5' }} />
          <span className="rc-legend-label">Revenue</span>
          <span className="rc-legend-dot" style={{ background: '#27ae60' }} />
          <span className="rc-legend-label">Profit</span>
        </div>
      </div>

      {loading || !stats ? (
        <div className="rc-skeleton" />
      ) : data.length === 0 ? (
        <div className="rc-empty">No sales data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            barCategoryGap="35%"
            barGap={4}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#aaa' }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#aaa' }}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
            <Bar dataKey="Revenue" fill="#4c6ef5" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Profit"  fill="#27ae60" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}