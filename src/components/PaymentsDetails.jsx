// PaymentsDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import './styles/PaymentsDetails.css';

export default function PaymentsDetails() {
  const { companyId } = useParams();
  const [arrivalDates, setArrivalDates] = useState([]);
  const [payments, setPayments] = useState([]);
  const [checkNumber, setCheckNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [totalStockAmount, setTotalStockAmount] = useState(0);
  const [cumulativePaid, setCumulativePaid] = useState(0);
  const [manualAdd, setManualAdd] = useState('');
  const [showPaymentsDropdown, setShowPaymentsDropdown] = useState(true);

  const [loading, setLoading] = useState(false); // 🔹 global loading

  // Fetch company totals
  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const companyRef = doc(db, 'companies', companyId);
      const snapshot = await getDoc(companyRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCumulativePaid(data.cumulativePaid || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock arrival dates
  const fetchArrivalDates = async () => {
    setLoading(true);
    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates`);
      const q = query(ref, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const dates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArrivalDates(dates);

      const total = dates.reduce((sum, item) => sum + (item.amount || 0), 0);
      setTotalStockAmount(total);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const ref = collection(db, `companies/${companyId}/payments`);
      const q = query(ref, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(records);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRemainingBalance(totalStockAmount - cumulativePaid);
  }, [totalStockAmount, cumulativePaid]);

  // Add new payment
  const handleAddPayment = async () => {
    const amt = parseFloat(amountPaid);
    if (!checkNumber || !amt) return alert('Fill all fields');
    if (amt > remainingBalance) return alert('Payment exceeds remaining balance');

    setLoading(true);
    try {
      const ref = collection(db, `companies/${companyId}/payments`);
      await addDoc(ref, {
        checkNumber,
        amountPaid: amt,
        timestamp: serverTimestamp()
      });

      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, { cumulativePaid: cumulativePaid + amt });
      setCumulativePaid(prev => prev + amt);

      setCheckNumber('');
      setAmountPaid('');
      await fetchPayments();
    } finally {
      setLoading(false);
    }
  };

  // Delete payment
  const handleDeletePayment = async (paymentId) => {
    setLoading(true);
    try {
      const paymentRef = doc(db, `companies/${companyId}/payments`, paymentId);
      await deleteDoc(paymentRef);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (err) {
      console.error('Error deleting payment', err);
    } finally {
      setLoading(false);
    }
  };

  // Restore payment
  const handleRestorePayment = async (paymentId, amount) => {
    setLoading(true);
    try {
      const paymentRef = doc(db, `companies/${companyId}/payments`, paymentId);
      await deleteDoc(paymentRef);

      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, { cumulativePaid: cumulativePaid - amount });
      setCumulativePaid(prev => prev - amount);

      setPayments(prev => prev.filter(p => p.id !== paymentId));
      alert(`Payment of ₹${amount} restored. You can now re-add the correct amount.`);
    } catch (err) {
      console.error('Error restoring payment', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual add
  const handleManualAdd = async () => {
    const amt = parseFloat(manualAdd);
    if (!amt) return alert('Enter a valid amount');

    setLoading(true);
    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates`);
      await addDoc(ref, {
        amount: amt,
        manual: true,
        timestamp: serverTimestamp()
      });

      setManualAdd('');
      await fetchArrivalDates();
    } catch (err) {
      console.error("Error adding manual amount:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchCompanyData();
        await fetchArrivalDates();
        await fetchPayments();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  return (
    <div className="payments-wrapper">
      {loading && (
        <div className="loading-overlay">
          <div className="loader">Loading...</div>
        </div>
      )}

      <h2 className="payments-heading">Payments for Company</h2>

      <div className="summary-card">
        <p>
          <strong>Remaining Balance:</strong> ₹{Math.max(remainingBalance, 0)}
          {remainingBalance <= 0 && <span className="paid-status">(Fully Paid)</span>}
        </p>
      </div>

      {/* Add new payment */}
      <div className="new-payment-card">
        <h3>Add New Payment</h3>
        <input
          type="text"
          value={checkNumber}
          onChange={e => setCheckNumber(e.target.value)}
          placeholder="Check Number"
        />
        <input
          type="number"
          value={amountPaid}
          onChange={e => setAmountPaid(e.target.value)}
          placeholder="Amount Paid"
        />
        <button onClick={handleAddPayment} disabled={loading}>Save Payment</button>
      </div>

      {/* Manual amount addition */}
      <div className="manual-add">
        <input
          type="number"
          placeholder="Manual amount"
          value={manualAdd}
          onChange={e => setManualAdd(e.target.value)}
        />
        <button onClick={handleManualAdd} disabled={loading}>Add Amount</button>
      </div>

      {/* Dropdown menu */}
      <div className="previous-payments">
        <button
          className="toggle-btn"
          onClick={() => setShowPaymentsDropdown(prev => !prev)}
        >
          {showPaymentsDropdown ? 'Hide Previous Payments' : 'Show Previous Payments'}
        </button>

        {showPaymentsDropdown && (
          <ul className="payments-list">
            {payments.map(p => (
              <li key={p.id} className="payment-card">
                <span>₹{p.amountPaid} — Check: {p.checkNumber}</span>
                <div className="payment-actions">
                  <button className="delete-btn" onClick={() => handleDeletePayment(p.id)} disabled={loading}>Delete</button>
                  <button className="restore-btn" onClick={() => handleRestorePayment(p.id, p.amountPaid)} disabled={loading}>Restore</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
