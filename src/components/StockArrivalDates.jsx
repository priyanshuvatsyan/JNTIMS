import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTrash } from 'react-icons/fa';

import './styles/StockArrivalDates.css';

export default function StockArrival() {
  const { companyId } = useParams();
  const [arrivalDates, setArrivalDates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('stock');
  const [company, setCompany] = useState(null);

  // 🔹 Fetch arrival dates + calculate amount from items
  const fetchArrivalDates = async () => {
    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates`);
      const q = query(ref, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const dates = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // fetch items inside this date
          const itemsRef = collection(db, `companies/${companyId}/arrivalDates/${docSnap.id}/items`);
          const itemsSnap = await getDocs(itemsRef);

          let totalAmount = 0;
          itemsSnap.forEach((itemDoc) => {
            const item = itemDoc.data();
            totalAmount += item.priceWithGST || 0;
          });

          return {
            id: docSnap.id,
            ...data,
            calculatedAmount: totalAmount, // ✅
          };
        })
      );

      setArrivalDates(dates);
    } catch (err) {
      console.error('Error fetching arrival dates', err);
    }
  };

  // 🔹 Add new date
  const handleAddDate = async () => {
    if (!newDate || !amount) return alert('Please fill all fields');

    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates`);
      await addDoc(ref, {
        date: newDate,
        amount: parseFloat(amount),
        status: 'Active',
        timestamp: serverTimestamp(),
      });
      setNewDate('');
      setAmount('');
      setShowForm(false);
      fetchArrivalDates();
    } catch (err) {
      console.error('Error adding new date', err);
    }
  };

  // 🔹 Delete arrival date
  const handleDelete = async (dateId) => {
    try {
      const ref = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
      await deleteDoc(ref);
      fetchArrivalDates();
    } catch (err) {
      console.error('Error deleting record', err);
      alert('Failed to delete record');
    }
  };

  // 🔹 Toggle Sold / Active
  const markAsSold = async (dateId) => {
    try {
      const ref = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
      await updateDoc(ref, { status: 'Sold' });
      fetchArrivalDates();
    } catch (err) {
      console.error('Error marking as sold', err);
    }
  };

  const markAsActive = async (dateId) => {
    try {
      const ref = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
      await updateDoc(ref, { status: 'Active' });
      fetchArrivalDates();
    } catch (err) {
      console.error('Error marking as active', err);
    }
  };

  // 🔹 Fetch company details
  const fetchCompany = async () => {
    try {
      const ref = doc(db, 'companies', companyId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setCompany(snapshot.data());
      } else {
        console.error('Company not found');
      }
    } catch (err) {
      console.error('Error fetching company', err);
    }
  };

  useEffect(() => {
    fetchArrivalDates();
    fetchCompany();
  }, [companyId]);

  const filteredDates = arrivalDates.filter((entry) => {
    if (activeTab === 'stock') return entry.status === 'Active';
    return entry.status === 'Sold';
  });

  return (
    <div className="companies-wrapper">
      <div className="stock-arrival-wrapper">
        <h2 className="company-heading">
          {company ? company.name : 'Loading...'}
        </h2>

        <div className="toggle-buttons">
          <button
            className={`toggle ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            Stock
          </button>
          <button
            className={`toggle ${activeTab === 'sold' ? 'active' : ''}`}
            onClick={() => setActiveTab('sold')}
          >
            Sold
          </button>
        </div>

        <ul className="arrival-date-list">
          {filteredDates.map((date) => (
            <li className="arrival-date-item" key={date.id}>
              <Link to={`/company/${companyId}/date/${date.id}`}  className="date-link" >
                <div className="date-box">{date.date}</div>
              </Link>

              {/* ✅ Show calculated amount if available */}
              <div className="amount">
                ₹ {date.calculatedAmount || date.amount || 0}
              </div>

              <div
                className={`status-dot ${
                  date.status === 'Active' ? 'green' : 'gray'
                }`}
              ></div>

              {date.status === 'Active' ? (
  <button className="action-btn sold" onClick={() => markAsSold(date.id)}>
    Mark Sold
  </button>
) : (
  <button className="action-btn restock" onClick={() => markAsActive(date.id)}>
    Restock
  </button>
)}


              <FaTrash
                className="delete-icon"
                onClick={() => handleDelete(date.id)}
              />
            </li>
          ))}
        </ul>

        {showForm && activeTab === 'stock' && (
          <div className="add-date-form">
            <label>
              Select Date:
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </label>

            <label>
              Amount:
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <button onClick={handleAddDate}>Add</button>
          </div>
        )}

        {activeTab === 'stock' && (
          <button
            className="add-date-button bottom-left"
            onClick={() => setShowForm(!showForm)}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
