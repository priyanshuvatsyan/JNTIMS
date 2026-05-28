import './AnalyticsStats.css';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { BsCurrencyRupee, BsGraphUp, BsBox, BsBuilding } from 'react-icons/bs';

function formatValue(val) {
  if (val >= 1_00_00_000) return `₹${(val / 1_00_00_000).toFixed(1)}Cr`;
  if (val >= 1_00_000)    return `₹${(val / 1_00_000).toFixed(1)}L`;
  if (val >= 1_000)       return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
}

export default function AnalyticsStats({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="as-grid">
        {[1,2,3,4].map(i => (
          <div key={i} className="as-card as-skeleton" />
        ))}
      </div>
    );
  }

  const profitMargin = stats.profitMargin?.toFixed(1) || '0.0';

  const cards = [
    {
      icon: <BsCurrencyRupee size={16} />,
      iconBg: '#eef1ff',
      iconColor: '#4c6ef5',
      value: formatValue(stats.totalRevenue),
      label: 'Revenue',
      sub: `${stats.unitsSold} units sold`,
      subColor: '#27ae60',
      trend: 'up',
    },
    {
      icon: <BsGraphUp size={16} />,
      iconBg: '#e8faf2',
      iconColor: '#27ae60',
      value: formatValue(stats.totalProfit),
      label: 'Profit',
      sub: `${profitMargin}% margin`,
      subColor: '#27ae60',
      trend: 'up',
    },
    {
      icon: <BsBox size={16} />,
      iconBg: '#fff4e6',
      iconColor: '#f39c12',
      value: stats.totalStock,
      label: 'Total Stock',
      sub: stats.lowStock > 0 ? `${stats.lowStock} low stock` : 'All good',
      subColor: stats.lowStock > 0 ? '#e53935' : '#27ae60',
      trend: stats.lowStock > 0 ? 'down' : 'up',
    },
    {
      icon: <BsBuilding size={16} />,
      iconBg: '#fff0f0',
      iconColor: '#e53935',
      value: stats.totalCompanies,
      label: 'Companies',
      sub: `${stats.activeCompanies} active`,
      subColor: '#27ae60',
      trend: 'up',
    },
  ];

  return (
    <div className="as-grid">
      {cards.map((card, i) => (
        <div key={i} className="as-card">
          <div className="as-card-top">
            <div className="as-icon" style={{ background: card.iconBg, color: card.iconColor }}>
              {card.icon}
            </div>
            <div className={`as-trend ${card.trend}`}>
              {card.trend === 'up'
                ? <FiTrendingUp size={14} />
                : <FiTrendingDown size={14} />}
            </div>
          </div>
          <div className="as-value">{card.value}</div>
          <div className="as-label">{card.label}</div>
          <div className="as-sub" style={{ color: card.subColor }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}