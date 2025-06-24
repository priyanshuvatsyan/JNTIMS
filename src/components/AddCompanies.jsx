import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaPlus } from 'react-icons/fa';
import './styles/AddCompanies.css';

export default function AddCompanies({ onCompanyAdded }) {
  const [companyName, setCompanyName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (companyName.trim() === '') {
      alert('Please enter a company name');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'companies'), {
        name: companyName,
        createdAt: Timestamp.now(),
      });
      alert('Company added!');
      setCompanyName('');
      setShowForm(false);
      onCompanyAdded && onCompanyAdded(docRef.id);
    } catch (error) {
      console.error(error);
      alert('Error adding company');
    }
  };

  return (
    <div>
      <button className="add-btn" onClick={() => setShowForm(true)}>
        <FaPlus />
      </button>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Add New Company</h3>
            <form onSubmit={handleAddCompany}>
              <input
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
