// src/pages/PaymentsDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';

export default function PaymentsDetails() {
  const { companyId } = useParams();
  const [arrivalDates, setArrivalDates] = useState([]);
  const [payments, setPayments] = useState([]);
  const [checkNumber, setCheckNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [totalStockAmount, setTotalStockAmount] = useState(0);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);

  // Fetch stock arrival dates
  const fetchArrivalDates = async () => {
    const ref = collection(db, `companies/${companyId}/arrivalDates`);
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const dates = snapshot.docs.map(doc => doc.data());
    setArrivalDates(dates);

    const total = dates.reduce((sum, item) => sum + (item.amount || 0), 0);
    setTotalStockAmount(total);
  };

  // Fetch previous payments
  const fetchPayments = async () => {
    const ref = collection(db, `companies/${companyId}/payments`);
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => doc.data());
    setPayments(records);

    const paid = records.reduce((sum, item) => sum + (item.amountPaid || 0), 0);
    setTotalPaidAmount(paid);
  };

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
    await fetchPayments(); // refresh
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
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>Payments for Company</h2>

      <div>
        <p><strong>Total Stock Amount:</strong> ₹{totalStockAmount}</p>
        <p><strong>Total Paid:</strong> ₹{totalPaidAmount}</p>
        <p>
          <strong>Remaining Balance:</strong>{' '}
          ₹{Math.max(remainingBalance, 0)}{' '}
          {remainingBalance <= 0 && <span style={{ color: 'green' }}>(Fully Paid)</span>}
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Add New Payment</h3>
        <label>Check Number:</label>
        <input
          type="text"
          value={checkNumber}
          onChange={e => setCheckNumber(e.target.value)}
          placeholder="e.g., CH123"
        />
        <br />
        <label>Amount Paid:</label>
        <input
          type="number"
          value={amountPaid}
          onChange={e => setAmountPaid(e.target.value)}
          placeholder="e.g., 500"
        />
        <br />
        <button onClick={handleAddPayment} style={{ marginTop: '1rem' }}>
          Save Payment
        </button>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h3>Previous Payments</h3>
        <ul>
          {payments.map((p, i) => (
            <li key={i}>
              ₹{p.amountPaid} — Check: {p.checkNumber}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
 

//not a page but a componenet(fix)