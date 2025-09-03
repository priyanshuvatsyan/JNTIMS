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

  const [soldUnits, setSoldUnits] = useState({});   // holds the "units to add" typed for each item
  const [savingSoldId, setSavingSoldId] = useState(null); // which item's "Add" is saving (UX only)

  const [totalBill, setTotalBill] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  // Live-calculated values in the form (preview before saving)
  const [calculatedBoxPriceWithGst, setCalculatedBoxPriceWithGst] = useState(0);
  const [calculatedPerUnitWithoutGst, setCalculatedPerUnitWithoutGst] = useState(0);
  const [calculatedPerUnitWithGst, setCalculatedPerUnitWithGst] = useState(0);

  // --- Helpers ---

  // Round to 2 decimals but keep it as a Number (not a string)
  const to2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  const fetchItems = async () => {
    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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

    const boxCount = parseInt(boxes);            // number of boxes
    const perBoxUnits = parseInt(unitsPerBox);   // units in each box
    const totalUnits = boxCount * perBoxUnits;   // total sellable units

    const baseBoxPrice = parseFloat(boxPrice);   // price per box (w/o GST)
    const gstPercent = parseFloat(gst);

    // GST calculations are done per box (as billed)
    const gstAmountPerBox = (baseBoxPrice * gstPercent) / 100;
    const boxPriceWithGst = baseBoxPrice + gstAmountPerBox;

    // Totals for the arrival line
    const totalCostWithoutGst = baseBoxPrice * boxCount;
    const totalCostWithGst = boxPriceWithGst * boxCount;

    // Per unit cost derived from totals
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
        // Store numbers (rounded), not strings, to avoid math issues later
        boxPrice: to2(baseBoxPrice),
        boxPriceWithGst: to2(boxPriceWithGst),
        totalCostWithoutGst: to2(totalCostWithoutGst),
        totalCostWithGst: to2(totalCostWithGst),
        perUnitWithoutGst: to2(perUnitWithoutGst),
        perUnitWithGst: to2(perUnitWithGst),
        sellingPrice: to2(parseFloat(sellingPrice)), // per-unit selling price
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

  // Add sold units (INCREMENTAL). We treat the input as "add X more", not "set total to X".
  const handleSaveSoldUnits = async (itemId, totalUnits, currentSold = 0) => {
    // value typed is the increment to add
    const increment = parseInt(soldUnits[itemId]) || 0;
    if (increment <= 0) return alert('Enter a positive number');

    // Remaining stock available to sell
    const remaining = totalUnits - currentSold;
    if (increment > remaining) {
      return alert(`You only have ${remaining} units left.`);
    }

    try {
      setSavingSoldId(itemId); // UI: show "Saving..." on the specific button

      const newSold = currentSold + increment; // incremental add
      const itemRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems/${itemId}`);
      await updateDoc(itemRef, { sold: newSold });

      // After saving, clear the input for this item only
      setSoldUnits(prev => ({ ...prev, [itemId]: '' }));

      // Check if ALL items are sold -> mark arrivalDate as "Sold"
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const snapshot = await getDocs(ref);
      const allItems = snapshot.docs.map(d => d.data());
      const allSold = allItems.every(it => (it.sold || 0) >= it.units);

      if (allSold) {
        const arrivalDateRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
        await updateDoc(arrivalDateRef, { status: 'Sold' });
      }

      fetchItems();
    } catch (err) {
      console.error('Error updating sold units:', err);
    } finally {
      setSavingSoldId(null);
    }
  };

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
      const sold = Number(item.sold) || 0;
      const perUnitCostWithGst = Number(item.perUnitWithGst) || 0;
      const selling = Number(item.sellingPrice) || 0;
      const lineTotalWithGst = Number(item.totalCostWithGst) || 0;

      bill += lineTotalWithGst; // total bill includes GST
      // Profit on sold portion only
      profit += (selling - perUnitCostWithGst) * sold;
    });

    setTotalBill(to2(bill));
    setTotalProfit(to2(profit));
  }, [items]);

  // Live preview calculation inside form (helps user decide selling price)
  useEffect(() => {
    const boxPrice = parseFloat(formData.boxPrice) || 0;
    const gst = parseFloat(formData.gst) || 0;
    const unitsPerBox = parseInt(formData.unitsPerBox) || 1;

    const boxPriceWithGst = boxPrice * (1 + gst / 100);
    setCalculatedBoxPriceWithGst((to2(boxPriceWithGst)).toFixed(2));

    // Calculate per-unit prices in preview (display-only)
    const perUnitWithoutGst = boxPrice / unitsPerBox;
    const perUnitWithGst = boxPriceWithGst / unitsPerBox;

    setCalculatedPerUnitWithoutGst((to2(perUnitWithoutGst)).toFixed(2));
    setCalculatedPerUnitWithGst((to2(perUnitWithGst)).toFixed(2));
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
        {items.map(item => {
          const currentSold = Number(item.sold) || 0;
          const remaining = Number(item.units) - currentSold;

          return (
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
                  <p><strong>Sold:</strong> {currentSold}</p>
                  <p><strong>Stock left:</strong> {remaining}</p>

                  <p><strong>Box Price w/o GST:</strong> ₹{Number(item.boxPrice).toFixed(2)}</p>
                  <p><strong>Box Price with GST:</strong> ₹{Number(item.boxPriceWithGst).toFixed(2)}</p>
                  <p><strong>Total Cost w/o GST:</strong> ₹{Number(item.totalCostWithoutGst).toFixed(2)}</p>
                  <p><strong>Total Cost with GST:</strong> ₹{Number(item.totalCostWithGst).toFixed(2)}</p>

                  <p><strong>Per Unit w/o GST:</strong> ₹{Number(item.perUnitWithoutGst).toFixed(2)}</p>
                  <p><strong>Per Unit with GST:</strong> ₹{Number(item.perUnitWithGst).toFixed(2)}</p>

                  <p><strong>Selling Price per Unit:</strong> ₹{Number(item.sellingPrice).toFixed(2)}</p>
                  <p><strong>Revenue:</strong> ₹{(Number(item.sellingPrice) * currentSold).toFixed(2)}</p>
                  <p><strong>Profit:</strong> ₹{((Number(item.sellingPrice) - Number(item.perUnitWithGst)) * currentSold).toFixed(2)}</p>

                  <div className="sold">
                    {/* Treat this input as "Add X more units sold" */}
                    <input
                      type="number"
                      min="1"
                      max={remaining}
                      placeholder={`Add units (max ${remaining})`}
                      value={soldUnits[item.id] ?? ''}
                      onChange={(e) => setSoldUnits({ ...soldUnits, [item.id]: e.target.value })}
                    />
                    <button
                      onClick={() => handleSaveSoldUnits(item.id, Number(item.units), currentSold)}
                      disabled={savingSoldId === item.id || remaining <= 0}
                    >
                      {savingSoldId === item.id ? 'Saving…' : 'Sold'}
                    </button>
                  </div>

                  <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>Delete</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Add Product Modal */}
      <button className="add-item-button" onClick={() => setShowModal(true)}>+</button>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Product</h3>

            <input
              placeholder="Product Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />

            <input
              placeholder="Boxes"
              type="number"
              value={formData.boxes}
              onChange={e => setFormData({ ...formData, boxes: e.target.value })}
            />

            <input
              placeholder="Units per Box"
              type="number"
              value={formData.unitsPerBox}
              onChange={e => setFormData({ ...formData, unitsPerBox: e.target.value })}
            />

            <input
              placeholder="Box Price (without GST)"
              type="number"
              value={formData.boxPrice}
              onChange={e => setFormData({ ...formData, boxPrice: e.target.value })}
            />

            <input
              placeholder="GST %"
              type="number"
              value={formData.gst}
              onChange={e => setFormData({ ...formData, gst: e.target.value })}
            />

            {/* Live Preview Section (display only) */}
            <div className="preview">
              <p>📦 Box Price with GST: ₹{calculatedBoxPriceWithGst}</p>
              <p>🔹 Per Unit w/o GST: ₹{calculatedPerUnitWithoutGst}</p>
              <p>🔹 Per Unit with GST: ₹{calculatedPerUnitWithGst}</p>
            </div>

            <input
              placeholder="Selling Price per Unit"
              type="number"
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




/**
 * Add Global profit variable 
 * add dates on every sold to calculate profit and revenue on that month
 */