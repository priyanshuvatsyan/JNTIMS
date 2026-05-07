import { useState, useEffect } from 'react';
import BillsHeader from './BillsHeader/BillsHeader';
import PaymentDues from './PaymentDues/PaymentDues';
import { getOutstandingBalances } from '../../Database/apis';
// import './Bills.css';

export default function Bills() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getOutstandingBalances();
        setBalances(data);
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Compute stats from balances
  const totalPayable = balances.reduce((sum, b) => sum + b.totalDue, 0);
  const companiesCount = balances.length;

  return (
    <div className="bills-container">
      <BillsHeader
        totalPayable={totalPayable}
        totalPaid={0}
        pendingItems={companiesCount}
        companiesCount={companiesCount}
      />
      <PaymentDues balances={balances} loading={loading} />
    </div>
  );
}