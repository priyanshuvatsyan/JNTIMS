import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection,getDoc, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTrash } from 'react-icons/fa';
import { deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

import './styles/StockArrivalDates.css';

export default function StockArrival() {
  const { companyId } = useParams();
  const [arrivalDates, setArrivalDates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('stock');
  const [company, setCompany] = useState(null)



  const fetchArrivalDates = async () => {
    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates`);
      const q = query(ref, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const dates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArrivalDates(dates);
    } catch (err) {
      console.error("Error fetching arrival dates", err);
    }
  };


  const handleAddDate = async () => {
    if (!newDate || !amount) return alert("Please fill all fields");

    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates`);
      await addDoc(ref, {
        date: newDate, // it's already in correct format from <input type="date">
        amount: parseFloat(amount),
        status: 'Active',
        timestamp: serverTimestamp()
      });
      setNewDate('');
      setAmount('');
      setShowForm(false);
      fetchArrivalDates();
    } catch (err) {
      console.error("Error adding new date", err);
    }
  };

  const handleDelete = async (dateId) => {


    try {
      const ref = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
      await deleteDoc(ref);
      fetchArrivalDates(); // Refresh the UI
    } catch (err) {
      console.error("Error deleting record", err);
      alert("Failed to delete record");
    }
  };

  //for fetching current acting company name on top
  const fetchCompany = async () => {
  try {
    const ref = doc(db, "companies", companyId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      setCompany(snapshot.data());
    } else {
      console.error("Company not found");
    }
  } catch (err) {
    console.error("Error fetching company", err);
  }
};


  useEffect(() => {
    fetchArrivalDates();
    fetchCompany();
  }, [companyId]);

  const filteredDates = arrivalDates.filter(entry => {
    if (activeTab === 'stock') return entry.status === 'Active';
    return entry.status === 'Sold';
  });

  return (
    <div className="companies-wrapper">
      <div className="stock-arrival-wrapper">
        <h2 className="company-heading">
  {company ? company.name : "Loading..."}
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
          {filteredDates.map(date => (
            <li className="arrival-date-item" key={date.id}>
              <Link to={`/company/${companyId}/date/${date.id}`}>
                <div className="date-box">{date.date}</div>
              </Link>

              <div className="amount">₹ {date.amount || 0}</div>
              <div className={`status-dot ${date.status === 'Active' ? 'green' : 'gray'}`}></div>

              <FaTrash className="delete-icon" onClick={() => handleDelete(date.id)} />

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
          <button className="add-date-button bottom-left" onClick={() => setShowForm(!showForm)}>+</button>
        )}
      </div>
    </div>
  );
}
