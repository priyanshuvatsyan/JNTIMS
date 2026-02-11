import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './styles/StockItemsOnDate.css';

// ===== HELPER FUNCTIONS =====
const to2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const INITIAL_FORM_STATE = {
  name: '',
  boxes: '',
  unitsPerBox: '',
  gst: '',
  boxPrice: '',
  sellingPrice: ''
};

const INITIAL_PREVIEW_STATE = {
  boxPriceWithGst: 0,
  perUnitWithoutGst: 0,
  perUnitWithGst: 0
};

// ===== CALCULATION FUNCTIONS =====
const calculateBoxPricing = (boxPrice, gst) => {
  const basePrice = parseFloat(boxPrice) || 0;
  const gstPercent = parseFloat(gst) || 0;
  const gstAmount = (basePrice * gstPercent) / 100;
  return to2(basePrice + gstAmount);
};

const calculatePerUnitPrices = (boxPrice, boxPriceWithGst, unitsPerBox) => {
  const units = parseInt(unitsPerBox) || 1;
  return {
    withoutGst: to2(boxPrice / units),
    withGst: to2(boxPriceWithGst / units)
  };
};

const calculateTotals = (items) => {
  let bill = 0;
  let profit = 0;

  items.forEach(item => {
    const sold = Number(item.sold) || 0;
    const perUnitCostWithGst = Number(item.perUnitWithGst) || 0;
    const selling = Number(item.sellingPrice) || 0;
    const lineTotalWithGst = Number(item.totalCostWithGst) || 0;

    bill += lineTotalWithGst;
    profit += (selling - perUnitCostWithGst) * sold;
  });

  return { bill: to2(bill), profit: to2(profit) };
};

// ===== MAIN COMPONENT =====
export default function StockItemsOnDate() {
  const { companyId, dateId } = useParams();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [preview, setPreview] = useState(INITIAL_PREVIEW_STATE);

  // UI state
  const [soldUnits, setSoldUnits] = useState({});
  const [savingSoldId, setSavingSoldId] = useState(null);

  // Summary state
  const [totalBill, setTotalBill] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);


  // ===== FIREBASE OPERATIONS =====
  const fetchItems = useCallback(async () => {
    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  }, [companyId, dateId]);

  // Add a new stock item
  const handleAddItem = async () => {
    const { name, boxes, unitsPerBox, gst, boxPrice, sellingPrice } = formData;
    if (!name || !boxes || !unitsPerBox || !gst || !boxPrice || !sellingPrice) {
      return alert('Fill all fields');
    }

    const boxCount = parseInt(boxes);
    const perBoxUnits = parseInt(unitsPerBox);
    const totalUnits = boxCount * perBoxUnits;

    const baseBoxPrice = parseFloat(boxPrice);
    const gstPercent = parseFloat(gst);
    const gstAmountPerBox = (baseBoxPrice * gstPercent) / 100;
    const boxPriceWithGst = baseBoxPrice + gstAmountPerBox;

    const totalCostWithoutGst = baseBoxPrice * boxCount;
    const totalCostWithGst = boxPriceWithGst * boxCount;

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
        boxPrice: to2(baseBoxPrice),
        boxPriceWithGst: to2(boxPriceWithGst),
        totalCostWithoutGst: to2(totalCostWithoutGst),
        totalCostWithGst: to2(totalCostWithGst),
        perUnitWithoutGst: to2(perUnitWithoutGst),
        perUnitWithGst: to2(perUnitWithGst),
        sellingPrice: to2(parseFloat(sellingPrice)),
        timestamp: serverTimestamp()
      });

      setFormData(INITIAL_FORM_STATE);
      setPreview(INITIAL_PREVIEW_STATE);
      setShowModal(false);
      await fetchItems();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  // Add sold units (incremental)
  const handleSaveSoldUnits = async (itemId, totalUnits, currentSold = 0) => {
    const increment = parseInt(soldUnits[itemId]) || 0;
    if (increment <= 0) return alert('Enter a positive number');

    const remaining = totalUnits - currentSold;
    if (increment > remaining) {
      return alert(`You only have ${remaining} units left.`);
    }

    try {
      setSavingSoldId(itemId);

      const newSold = currentSold + increment;
      const itemRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems/${itemId}`);
      await updateDoc(itemRef, { sold: newSold });

      // Add sales record
      const soldItem = items.find(it => it.id === itemId);
      if (soldItem) {
        const perUnitCost = Number(soldItem.perUnitWithGst) || 0;
        const selling = Number(soldItem.sellingPrice) || 0;

        await addDoc(collection(db, "sales"), {
          companyId,
          itemId,
          itemName: soldItem.name,
          unitsSold: increment,
          revenue: selling * increment,
          profit: (selling - perUnitCost) * increment,
          date: new Date().toISOString().split("T")[0],
          timestamp: serverTimestamp(),
        });
      }

      setSoldUnits(prev => ({ ...prev, [itemId]: '' }));

      // Check if all items sold
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const snapshot = await getDocs(ref);
      const allItems = snapshot.docs.map(d => d.data());
      const allSold = allItems.every(it => (it.sold || 0) >= it.units);

      if (allSold) {
        const arrivalDateRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
        await updateDoc(arrivalDateRef, { status: 'Sold' });
      }

      await fetchItems();
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
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    const { bill, profit } = calculateTotals(items);
    setTotalBill(bill);
    setTotalProfit(profit);
  }, [items]);

  // Update form preview on input changes
  useEffect(() => {
    const boxPrice = parseFloat(formData.boxPrice) || 0;
    const gst = parseFloat(formData.gst) || 0;
    const unitsPerBox = parseInt(formData.unitsPerBox) || 1;

    const boxPriceWithGst = calculateBoxPricing(boxPrice, gst);
    const { withoutGst, withGst } = calculatePerUnitPrices(boxPrice, boxPriceWithGst, unitsPerBox);

    setPreview({
      boxPriceWithGst: boxPriceWithGst.toFixed(2),
      perUnitWithoutGst: withoutGst.toFixed(2),
      perUnitWithGst: withGst.toFixed(2)
    });
  }, [formData.boxPrice, formData.gst, formData.unitsPerBox]);

  // Load items on mount/param change
  useEffect(() => {
    fetchItems();
  }, [companyId, dateId, fetchItems]);

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

            {/* Live Preview Section */}
            <div className="preview">
              <p>📦 Box Price with GST: ₹{preview.boxPriceWithGst}</p>
              <p>🔹 Per Unit w/o GST: ₹{preview.perUnitWithoutGst}</p>
              <p>🔹 Per Unit with GST: ₹{preview.perUnitWithGst}</p>
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
 * TODO: Add global profit calculation by date for monthly analytics
 */





