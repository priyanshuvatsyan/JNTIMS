import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Nav from '../../components/Nav/Nav';
import QuickSalesHeader from '../../pages/Sales/QuickSalesHeader/QuickSalesHeader';
import SellItems from './SellItems/SellItems';
import RecentSoldItems from './RecentSoldItems/RecentSoldItems';
import { getTodaysSalesStats } from '../../Database/apis';
import './Sales.css';

export default function Sales() {
    const location = useLocation();
  const preselectStock = location.state?.preselectStock || null;
  const [stats, setStats] = useState({ todaysSales: 0, unitsSold: 0, transactions: 0 });
  const [sellRefreshKey, setSellRefreshKey] = useState(0);
const [recentRefreshKey, setRecentRefreshKey] = useState(0);

const handleSaleComplete = () => {
  fetchStats();
  setRecentRefreshKey(k => k + 1); // 👈 refetch recent sales
};

const handleSaleRestored = () => {
  fetchStats();
  setSellRefreshKey(k => k + 1);   // 👈 refetch sell items list
};



  const fetchStats = async () => {
    try {
      const data = await getTodaysSalesStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="sales-container">
      
        <QuickSalesHeader
          todaysSales={stats.todaysSales}
          unitsSold={stats.unitsSold}
          transactions={stats.transactions}
        />
        <SellItems
  onSaleComplete={handleSaleComplete}
  preselectStock={preselectStock}
  refreshKey={sellRefreshKey}
/>
<RecentSoldItems
  refreshKey={recentRefreshKey}
  onSaleRestored={handleSaleRestored}
/>
      
    </div>
  );
}