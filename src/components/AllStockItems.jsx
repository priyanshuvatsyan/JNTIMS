import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import './styles/AllStockItems.css'; // We'll create this CSS file

export default function AllStockItems() {
  const [allItems, setAllItems] = useState([]);
  const [soldUnits, setSoldUnits] = useState({});
  const [savingSoldId, setSavingSoldId] = useState(null);

  const fetchAllItems = async () => {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const allItemsData = [];

      for (const companyDoc of companiesSnapshot.docs) {
        const companyId = companyDoc.id;
        const companyName = companyDoc.data().name;

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
        timestamp: serverTimestamp(),
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
      await updateDoc(globalRef, {
        totalRevenue: increment(revenue),
        totalProfit: increment(profit)
      });

      setSoldUnits(prev => ({ ...prev, [item.id]: '' }));
      setSavingSoldId(null);
      fetchAllItems(); // Refresh the list
    } catch (error) {
      console.error('Error saving sold units:', error);
      setSavingSoldId(null);
    }
  };

  return (
    <div className="all-stock-items">
      <h2>All Stock Items</h2>
      <div className="items-list">
        {allItems.map(item => (
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