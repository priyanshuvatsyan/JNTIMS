import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, serverTimestamp, arrayUnion, increment, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './styles/AllStockItems.css'; // We'll create this CSS file

export default function AllStockItems() {
  const [allItems, setAllItems] = useState([]);
  const [soldUnits, setSoldUnits] = useState({});
  const [savingSoldId, setSavingSoldId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in-stock', 'out-of-stock'

  const fetchAllItems = async () => {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const allItemsData = [];
      const companiesData = [];

      for (const companyDoc of companiesSnapshot.docs) {
        const companyId = companyDoc.id;
        const companyName = companyDoc.data().name;
        companiesData.push({ id: companyId, name: companyName });

        const datesRef = collection(db, `companies/${companyId}/arrivalDates`);
        const datesSnapshot = await getDocs(datesRef);

        for (const dateDoc of datesSnapshot.docs) {
          const dateId = dateDoc.id;
          const dateData = dateDoc.data();

          const itemsRef = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
          const itemsSnapshot = await getDocs(itemsRef);

          itemsSnapshot.docs.forEach(itemDoc => {
            const itemData = itemDoc.data();
            allItemsData.push({
              id: itemDoc.id,
              companyId,
              companyName,
              dateId,
              date: dateData.date || 'Unknown Date',
              ...itemData
            });
          });
        }
      }

      setAllItems(allItemsData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching all items:', error);
    }
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  const handleSaveSoldUnits = async (item) => {
    const incrementValue = parseInt(soldUnits[item.id]) || 0;
    if (incrementValue <= 0) return alert('Enter a positive number');

    const remaining = item.units - (item.sold || 0);
    if (incrementValue > remaining) {
      return alert(`You only have ${remaining} units left.`);
    }

    try {
      setSavingSoldId(item.id);

      const newSold = (item.sold || 0) + incrementValue;
      const perUnitCost = Number(item.perUnitWithGst) || 0;
      const selling = Number(item.sellingPrice) || 0;
      const revenue = selling * incrementValue;
      const profit = (selling - perUnitCost) * incrementValue;

      const saleEntry = {
        date: new Date().toISOString().split("T")[0],
        unitsSold: incrementValue,
        revenue,
        profit,
        timestamp: new Date(),
      };

      const itemRef = doc(db, `companies/${item.companyId}/arrivalDates/${item.dateId}/stockItems/${item.id}`);
      await updateDoc(itemRef, {
        sold: newSold,
        totalRevenue: (item.totalRevenue || 0) + revenue,
        totalProfit: (item.totalProfit || 0) + profit,
        sales: arrayUnion(saleEntry)
      });

      // Update global totals
      const globalRef = doc(db, 'totals', 'global');
      await setDoc(globalRef, {
        totalRevenue: increment(revenue),
        totalProfit: increment(profit)
      }, { merge: true });

      setSoldUnits(prev => ({ ...prev, [item.id]: '' }));
      setSavingSoldId(null);
      fetchAllItems(); // Refresh the list
    } catch (error) {
      console.error('Error saving sold units:', error);
      setSavingSoldId(null);
    }
  };

  const getFilteredItems = () => {
    return allItems.filter(item => {
      // Company filter
      if (selectedCompanies.length > 0 && !selectedCompanies.includes(item.companyId)) {
        return false;
      }

      // Stock filter
      const availableUnits = item.units - (item.sold || 0);
      if (stockFilter === 'in-stock' && availableUnits <= 0) {
        return false;
      }
      if (stockFilter === 'out-of-stock' && availableUnits > 0) {
        return false;
      }

      return true;
    });
  };

  const handleStockFilterChange = (filter) => {
    setStockFilter(filter);
  };

  return (
    <div className="all-stock-items">
      <h2>All Stock Items</h2>
      
      {/* Filters */}
      <div className="filters">
        <div className="filter-section">
          <h3>Filter by Company:</h3>
          <div className="company-filters">
            <select
              value={selectedCompanies.length > 0 ? selectedCompanies[0] : ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCompanies(value ? [value] : []);
              }}
              className="company-select"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-section">
          <h3>Filter by Stock Status:</h3>
          <div className="stock-filters">
            <label className="stock-filter">
              <input
                type="radio"
                name="stockFilter"
                value="all"
                checked={stockFilter === 'all'}
                onChange={(e) => handleStockFilterChange(e.target.value)}
              />
              All Items
            </label>
            <label className="stock-filter">
              <input
                type="radio"
                name="stockFilter"
                value="in-stock"
                checked={stockFilter === 'in-stock'}
                onChange={(e) => handleStockFilterChange(e.target.value)}
              />
              In Stock
            </label>
            <label className="stock-filter">
              <input
                type="radio"
                name="stockFilter"
                value="out-of-stock"
                checked={stockFilter === 'out-of-stock'}
                onChange={(e) => handleStockFilterChange(e.target.value)}
              />
              Out of Stock
            </label>
          </div>
        </div>
      </div>

      <div className="items-list">
        {getFilteredItems().map(item => (
          <div key={item.id} className="item-card">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p>Company: {item.companyName}</p>
              <p>Date: {item.date}</p>
              <p>Units: {item.units} (Sold: {item.sold || 0})</p>
              <p>Selling Price: ₹{item.sellingPrice}</p>
            </div>
            <div className="sell-section">
              <input
                type="number"
                placeholder="Units to sell"
                value={soldUnits[item.id] || ''}
                onChange={(e) => setSoldUnits(prev => ({ ...prev, [item.id]: e.target.value }))}
              />
              <button
                onClick={() => handleSaveSoldUnits(item)}
                disabled={savingSoldId === item.id}
              >
                {savingSoldId === item.id ? 'Saving...' : 'Sell'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}