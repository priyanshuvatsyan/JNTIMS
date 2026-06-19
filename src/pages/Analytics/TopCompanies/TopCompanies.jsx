import { useState, useEffect } from 'react';
import { getAllStockArrivalDates, getCompanies } from '../../../Database/apis';
import './TopCompanies.css';

export default function TopCompanies({ months = 6 }) {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const [arrivals, companiesList] = await Promise.all([
          getAllStockArrivalDates(),
          getCompanies(),
        ]);

        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);

        const filtered = (arrivals || []).filter(a => new Date(a.arrivalDate) >= cutoff);

        const sums = {};
        filtered.forEach(a => {
          const id = a.companyId || 'unknown';
          sums[id] = (sums[id] || 0) + (Number(a.amount) || 0);
        });

        const ranked = Object.entries(sums)
          .map(([companyId, totalAmount]) => {
            const comp = (companiesList || []).find(c => c.id === companyId);
            return { companyId, companyName: comp?.name || 'Unknown', totalAmount };
          })
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5);

        if (mounted) setCompanies(ranked);
      } catch (err) {
        console.error('TopCompanies fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [months]);

  return (
    <div className="top-companies">
      <h3 className="tc-title">Top Companies (by arrival amount)</h3>
      {loading ? (
        <div className="tc-loading">Loading...</div>
      ) : (
        <ul className="tc-list">
          {companies.length === 0 ? (
            <li className="tc-empty">No data for selected period</li>
          ) : (
            companies.map((c, idx) => (
              <li key={c.companyId} className="tc-item">
                <span className="tc-rank">{idx + 1}.</span>
                <span className="tc-name">{c.companyName}</span>
                <span className="tc-amount">₹{Number(c.totalAmount).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
