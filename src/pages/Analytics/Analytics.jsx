import { useState, useEffect } from 'react';
import AnalyticsFilters from './AnalyticsFilters/AnalyticsFilters';
import AnalyticsStats from './AnalyticsStats/AnalyticsStats';
import RevenueChart from './RevenueChart/RevenueChart';
import StockMovementChart from './StockMovementChart/StockMovementChart';
import { getAnalyticsStats } from '../../Database/apis';

export default function Analytics() {
  const [months, setMonths] = useState(6);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getAnalyticsStats(months);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [months]);

  return (
    <div className="analytics-container" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Analytics</h1>
      <AnalyticsFilters selected={months} onChange={setMonths} />
      <AnalyticsStats stats={stats} loading={loading} />
      <RevenueChart stats={stats} loading={loading} />
      <StockMovementChart stats={stats} loading={loading} />
    </div>
  );
}