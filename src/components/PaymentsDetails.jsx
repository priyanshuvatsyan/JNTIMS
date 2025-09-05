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
  doc
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
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [manualAdd, setManualAdd] = useState('');
  const [showPaymentsDropdown, setShowPaymentsDropdown] = useState(true);

  // Fetch stock arrival dates
  const fetchArrivalDates = async () => {
    const ref = collection(db, `companies/${companyId}/arrivalDates`);
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const dates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setArrivalDates(dates);

    const total = dates.reduce((sum, item) => sum + (item.amount || 0), 0);
    setTotalStockAmount(total);
  };

  // Fetch payments
  const fetchPayments = async () => {
    const ref = collection(db, `companies/${companyId}/payments`);
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPayments(records);

    const paid = records.reduce((sum, item) => sum + (item.amountPaid || 0), 0);
    setTotalPaidAmount(paid);
  };

  // Calculate remaining balance
  const calculateRemainingBalance = () => {
    setRemainingBalance(totalStockAmount - totalPaidAmount);
  };

  // Add new payment
  const handleAddPayment = async () => {
    const amt = parseFloat(amountPaid);
    if (!checkNumber || !amt) return alert('Fill all fields');
    if (amt > remainingBalance) return alert('Payment exceeds remaining balance');

    const ref = collection(db, `companies/${companyId}/payments`);
    await addDoc(ref, {
      checkNumber,
      amountPaid: amt,
      timestamp: serverTimestamp()
    });

    setCheckNumber('');
    setAmountPaid('');
    await fetchPayments();
  };

  // Delete a payment (permanent)
  const handleDeletePayment = async (paymentId) => {
    try {
      const paymentRef = doc(db, `companies/${companyId}/payments`, paymentId);
      await deleteDoc(paymentRef);
      await fetchPayments(); // refresh
    } catch (err) {
      console.error('Error deleting payment', err);
    }
  };

  // Restore a payment (deduct from totalPaidAmount and remove from UI)
  const handleRestorePayment = (paymentId, amount) => {
    // Deduct the payment amount from totalPaidAmount
    setTotalPaidAmount(prev => prev - (amount || 0));
    // Remove from displayed list
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    alert(`Payment of ₹${amount} restored. You can now re-add the correct amount.`);
  };

  // Manual amount addition
  const handleManualAdd = () => {
    const amt = parseFloat(manualAdd);
    if (!amt) return alert('Enter a valid amount');
    setTotalStockAmount(prev => prev + amt);
    setManualAdd('');
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchArrivalDates();
      await fetchPayments();
    };
    loadData();
  }, [companyId]);

  useEffect(() => {
    calculateRemainingBalance();
  }, [totalStockAmount, totalPaidAmount]);

return (
    <div className="payments-wrapper">
      <h2 className="payments-heading">Payments for Company</h2>

      <div className="summary-card">
        <p><strong>Total Stock Amount:</strong> ₹{totalStockAmount}</p>
        <p><strong>Total Paid:</strong> ₹{totalPaidAmount}</p>
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
        <button onClick={() => handleAddPayment()}>Save Payment</button>
      </div>

       {/* Manual amount addition */}
      <div className="manual-add">
        <input
          type="number"
          placeholder="Manual amount"
          value={manualAdd}
          onChange={e => setManualAdd(e.target.value)}
        />
        <button onClick={() => handleManualAdd()}>Add Amount</button>
      </div>

      {/* Dropdown menu for payments */}
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
                  <button className="delete-btn" onClick={() => handleDeletePayment(p.id)}>Delete</button>
                  <button className="restore-btn" onClick={() => handleRestorePayment(p.id, p.amountPaid)}>Restore</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}