import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './styles/StockItemsOnDate.css';

export default function StockItemsOnDate() {
  const { companyId, dateId } = useParams();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    boxes: '',
    unitsPerBox: '',
    gst: '',
    boxPrice: '',
    sellingPrice: ''
  });

  const [soldUnits, setSoldUnits] = useState({});
  const [totalBill, setTotalBill] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  // Live-calculated values in the form (preview before saving)
  const [calculatedBoxPriceWithGst, setCalculatedBoxPriceWithGst] = useState(0);
  const [calculatedPerUnitWithoutGst, setCalculatedPerUnitWithoutGst] = useState(0);
  const [calculatedPerUnitWithGst, setCalculatedPerUnitWithGst] = useState(0);

  // Fetch all stock items from Firestore
  const fetchItems = async () => {
    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  // Add a new stock item
  const handleAddItem = async () => {
    const { name, boxes, unitsPerBox, gst, boxPrice, sellingPrice } = formData;
    if (!name || !boxes || !unitsPerBox || !gst || !boxPrice || !sellingPrice) {
      return alert('Fill all fields');
    }

    const boxCount = parseInt(boxes);
    const perBoxUnits = parseInt(unitsPerBox);
    const totalUnits = boxCount * perBoxUnits;

    const baseBoxPrice = parseFloat(boxPrice); // price per box without GST
    const gstPercent = parseFloat(gst);

    // GST calculations
    const gstAmountPerBox = (baseBoxPrice * gstPercent) / 100;
    const boxPriceWithGst = baseBoxPrice + gstAmountPerBox;

    // Total costs
    const totalCostWithoutGst = baseBoxPrice * boxCount;
    const totalCostWithGst = boxPriceWithGst * boxCount;

    // Per unit prices
    const perUnitWithoutGst = totalCostWithoutGst / totalUnits;
    const perUnitWithGst = totalCostWithGst / totalUnits;

    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      await addDoc(ref, {
        name,
        boxes: boxCount,
        unitsPerBox: perBoxUnits,
        units: totalUnits,
        sold: 0,
        gst: gstPercent,
        boxPrice: baseBoxPrice,
        boxPriceWithGst: boxPriceWithGst.toFixed(2),
        totalCostWithoutGst: totalCostWithoutGst.toFixed(2),
        totalCostWithGst: totalCostWithGst.toFixed(2),
        perUnitWithoutGst: perUnitWithoutGst.toFixed(2),
        perUnitWithGst: perUnitWithGst.toFixed(2),
        sellingPrice: parseFloat(sellingPrice),
        timestamp: serverTimestamp()
      });

      // Reset form after saving
      setFormData({ name: '', boxes: '', unitsPerBox: '', gst: '', boxPrice: '', sellingPrice: '' });
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  // Save sold units update
  const handleSaveSoldUnits = async (itemId, totalUnits) => {
    const sold = parseInt(soldUnits[itemId]) || 0;
    if (sold < 0 || sold > totalUnits) return alert('Invalid sold units');

    try {
      const itemRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems/${itemId}`);
      await updateDoc(itemRef, { sold });

      // Check if ALL items are sold -> mark arrivalDate as "Sold"
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const snapshot = await getDocs(ref);
      const allItems = snapshot.docs.map(doc => doc.data());
      const allSold = allItems.every(item => (item.sold || 0) >= item.units);

      if (allSold) {
        const arrivalDateRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
        await updateDoc(arrivalDateRef, { status: 'Sold' });
      }

      fetchItems();
    } catch (err) {
      console.error('Error updating sold units:', err);
    }
  };

  // Delete an item
  const handleDeleteItem = async (itemId) => {
    try {
      const ref = doc(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems/${itemId}`);
      await deleteDoc(ref);
      fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Calculate total bill & profit dynamically
  useEffect(() => {
    let bill = 0;
    let profit = 0;

    items.forEach(item => {
      const soldUnits = item.sold || 0;
      bill += parseFloat(item.totalCostWithGst); // total bill is always with GST

      // Profit = (selling price per unit - purchase price per unit with GST) × sold units
      profit += (item.sellingPrice - item.perUnitWithGst) * soldUnits;
    });

    setTotalBill(bill);
    setTotalProfit(profit);
  }, [items]);

  // Live preview calculation inside form (helps user decide selling price)
  useEffect(() => {
    const boxPrice = parseFloat(formData.boxPrice) || 0;
    const gst = parseFloat(formData.gst) || 0;
    const unitsPerBox = parseInt(formData.unitsPerBox) || 1;

    const boxPriceWithGst = boxPrice * (1 + gst / 100);
    setCalculatedBoxPriceWithGst(boxPriceWithGst.toFixed(2));

    // Calculate per-unit prices in preview
    const perUnitWithoutGst = boxPrice / unitsPerBox;
    const perUnitWithGst = boxPriceWithGst / unitsPerBox;

    setCalculatedPerUnitWithoutGst(perUnitWithoutGst.toFixed(2));
    setCalculatedPerUnitWithGst(perUnitWithGst.toFixed(2));
  }, [formData.boxPrice, formData.gst, formData.unitsPerBox]);

  useEffect(() => {
    fetchItems();
  }, [companyId, dateId]);

  return (
    <div className="items-wrapper">
      <div className="header-stats">
        <p><strong>Total Bill:</strong> ₹{totalBill.toFixed(2)}</p>
        <p><strong>Profit till now:</strong> ₹{totalProfit.toFixed(2)}</p>
      </div>

      <h2 className="heading">Stock Items</h2>
      <ul className="item-list">
        {items.map(item => (
          <li key={item.id} className="item-card">
            <div className="item-header">
              <button className="item-name" onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                {item.name}
              </button>
              <span onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)} className="dropdown-icon">▾</span>
            </div>
            {expandedItem === item.id && (
              <div className="item-details">
                <p><strong>Boxes:</strong> {item.boxes}</p>
                <p><strong>Units per Box:</strong> {item.unitsPerBox}</p>
                <p><strong>Total Units:</strong> {item.units}</p>
                <p><strong>Sold:</strong> {item.sold || 0}</p>
                <p><strong>Stock left:</strong> {item.units - (item.sold || 0)}</p>
                <p><strong>Box Price w/o GST:</strong> ₹{item.boxPrice}</p>
                <p><strong>Box Price with GST:</strong> ₹{item.boxPriceWithGst}</p>
                <p><strong>Total Cost w/o GST:</strong> ₹{item.totalCostWithoutGst}</p>
                <p><strong>Total Cost with GST:</strong> ₹{item.totalCostWithGst}</p>
                <p><strong>Per Unit w/o GST:</strong> ₹{item.perUnitWithoutGst}</p>
                <p><strong>Per Unit with GST:</strong> ₹{item.perUnitWithGst}</p>
                <p><strong>Selling Price per Unit:</strong> ₹{item.sellingPrice}</p>
                <p><strong>Revenue:</strong> ₹{(item.sellingPrice * (item.sold || 0)).toFixed(2)}</p>
                <p><strong>Profit:</strong> ₹{((item.sellingPrice - item.perUnitWithGst) * (item.sold || 0)).toFixed(2)}</p>

                <div className="sold">
                  <input
                    type="number"
                    placeholder="Units Sold"
                    value={soldUnits[item.id] || ''}
                    onChange={(e) => setSoldUnits({ ...soldUnits, [item.id]: e.target.value })}
                  />
                  <button onClick={() => handleSaveSoldUnits(item.id, item.units)}>Save</button>
                </div>
                <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Add Product Modal */}
      <button className="add-item-button" onClick={() => setShowModal(true)}>+</button>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Product</h3>

            <input placeholder="Product Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />

            <input placeholder="Boxes" type="number"
              value={formData.boxes}
              onChange={e => setFormData({ ...formData, boxes: e.target.value })}
            />

            <input placeholder="Units per Box" type="number"
              value={formData.unitsPerBox}
              onChange={e => setFormData({ ...formData, unitsPerBox: e.target.value })}
            />

            <input placeholder="Box Price (without GST)" type="number"
              value={formData.boxPrice}
              onChange={e => setFormData({ ...formData, boxPrice: e.target.value })}
            />

            <input placeholder="GST %" type="number"
              value={formData.gst}
              onChange={e => setFormData({ ...formData, gst: e.target.value })}
            />

            {/* Live Preview Section */}
            <div className="preview">
              <p>📦 Box Price with GST: ₹{calculatedBoxPriceWithGst}</p>
              <p>🔹 Per Unit w/o GST: ₹{calculatedPerUnitWithoutGst}</p>
              <p>🔹 Per Unit with GST: ₹{calculatedPerUnitWithGst}</p>
            </div>

            <input placeholder="Selling Price per Unit" type="number"
              value={formData.sellingPrice}
              onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
            />

            <button className="save-product" onClick={handleAddItem}>Save</button>
            <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
