import { useState, useEffect } from 'react';
import BillsHeader from './BillsHeader/BillsHeader';
import PaymentDues from './PaymentDues/PaymentDues';
import RecordPayment from './RecordPayment/RecordPayment';
import PaymentHistory from './PaymentHistory/PaymentHistory';
import AddManualAmount from './AddManualAmount/AddManualAmount';
import { getOutstandingBalances } from '../../Database/apis';
import './Bills.css';

export default function Bills() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
   const [showManual, setShowManual] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null); 
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const data = await getOutstandingBalances();
      setBalances(data);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBalances(); }, []);

  const totalPayable = balances.reduce((sum, b) => sum + b.totalDue, 0);
  const companiesCount = balances.length;

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowPayment(true);
  };

  return (
    <div className="bills-container">
      <BillsHeader
        totalPayable={totalPayable}
        totalPaid={0}
        pendingItems={companiesCount}
        companiesCount={companiesCount}
      />
      <PaymentDues
        balances={balances}
        loading={loading}
        onSelectCompany={handleCompanySelect} // 👈 pass handler
      />
      <PaymentHistory refreshKey={historyRefreshKey} />
       <button className="bills-fab" onClick={() => setShowManual(true)}>+</button>
      {showPayment && (
        <RecordPayment
          balances={balances}
          selectedCompany={selectedCompany}
          onClose={() => { setShowPayment(false); setSelectedCompany(null); }}
         onSuccess={() => {
  setShowPayment(false);
  setSelectedCompany(null);
  fetchBalances();
  setHistoryRefreshKey(k => k + 1); // 👈 trigger PaymentHistory refetch
}}
        />
      )}
       {showManual && (
        <AddManualAmount
          onClose={() => setShowManual(false)}
          onSuccess={() => { setShowManual(false); fetchBalances(); }}
        />
      )}
     
      
    </div>
  );
}