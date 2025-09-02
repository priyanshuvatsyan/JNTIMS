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
  const [formData, setFormData] = useState({
    name: '',
    units: '',
    gst: '',
    price: '',
    sellingPrice: ''
  });
  const [soldUnits, setSoldUnits] = useState({});
    const [totalBill, setTotalBill] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [calculatedPriceWithGst, setCalculatedPriceWithGst] = useState(0);


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

  const handleAddItem = async () => {
    const { name, units, gst, price, sellingPrice } = formData;
    if (!name || !units || !gst || !price || !sellingPrice) return alert('Fill all fields');

    const quantity = parseInt(units);
    const basePrice = parseFloat(price); 
    const gstPercent = parseFloat(gst);
    const priceWithGst = basePrice * (1 + gstPercent / 100);
    const totalCostWithGst = priceWithGst * quantity;
    const totalCostWithoutGst = basePrice * quantity;

    try {
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      await addDoc(ref, {
        ...formData,
        units: quantity,
        sold: 0,
        gst: gstPercent,
        price: basePrice,
        priceWithGst: priceWithGst.toFixed(2),
        totalCostWithGst: totalCostWithGst.toFixed(2),
        totalCostWithoutGst: totalCostWithoutGst.toFixed(2),
        sellingPrice: parseFloat(sellingPrice),
        timestamp: serverTimestamp()
      });
      setFormData({ name: '', units: '', gst: '', price: '', sellingPrice: '' });
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleSaveSoldUnits = async (itemId, totalUnits) => {
    const sold = parseInt(soldUnits[itemId]) || 0;
    if (sold < 0 || sold > totalUnits) return alert('Invalid sold units');

    try {
      const itemRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems/${itemId}`);
      await updateDoc(itemRef, { sold });

      // Refetch all stock items
      const ref = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const snapshot = await getDocs(ref);
      const allItems = snapshot.docs.map(doc => doc.data());

      const allSold = allItems.every(item => (item.sold || 0) >= item.units);

      if (allSold) {
        const arrivalDateRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}`);
        await updateDoc(arrivalDateRef, { status: 'Sold' });
        console.log(`✅ All items sold — status updated.`);
      }

      fetchItems(); // Refresh item list
    } catch (err) {
      console.error('Error updating sold units:', err);
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

  //for dynamic calculation of total bill and profits
useEffect(() => {
  let bill = 0;
  let profit = 0;

  items.forEach(item => {
    const soldUnits = item.sold || 0;
    const remainingUnits = item.units - soldUnits;

    // Bill is total value of all units including GST
    bill += parseFloat(item.totalCostWithGst);

    // Profit calculation (sold units only)
  profit += (item.sellingPrice - parseFloat(item.priceWithGst)) * soldUnits;

  });

  setTotalBill(bill);
  setTotalProfit(profit);
}, [items]);

  
//for inForm TotalPrice calculation with gst
useEffect(() => {
   const price = parseFloat(formData.price) || 0;
  const gst = parseFloat(formData.gst) || 0;

  const priceWithGst = price * (1 + gst / 100);
  setCalculatedPriceWithGst(priceWithGst.toFixed(2));
}, [
  formData.price,
  formData.gst
])


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
                <p><strong>Total:</strong> {item.units}</p>
                <p><strong>Sold:</strong> {item.sold || 0}</p>
                <p><strong>Stock left:</strong> {item.units - (item.sold || 0)}</p>
                <p><strong>Price w/o GST:</strong> ₹{item.totalCostWithoutGst}</p>
                <p><strong>Price with GST:</strong> ₹{item.totalCostWithGst}</p>
                <p><strong>Selling Price:</strong> ₹{item.sellingPrice}</p>
                <p><strong>GST:</strong> {item.gst}%</p>
                <p><strong>Revenue:</strong> ₹{item.sellingPrice * (item.sold || 0)}</p>
                <p><strong>Profit:</strong> ₹{((item.sellingPrice - item.priceWithGst) * (item.sold || 0)).toFixed(2)}</p>

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

      <button className="add-item-button" onClick={() => setShowModal(true)}>+</button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Product</h3>
            <input placeholder="Product Name" 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} />

            <input placeholder="Units" type="number" 
            value={formData.units} 
            onChange={e => setFormData({ ...formData, units: e.target.value })} />

            <input placeholder="GST %" type="number" 
            value={formData.gst} 
            onChange={e => setFormData({ ...formData, gst: e.target.value })} />

            <input placeholder="Price" type="number" 
            value={formData.price} 
            onChange={e => setFormData({ ...formData, price: e.target.value })} />
            <p>Price with GST: ₹{calculatedPriceWithGst}</p>

            <input placeholder="Selling Price" type="number" 
            value={formData.sellingPrice} 
            onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} />

            <button className="save-product" onClick={handleAddItem}>Save</button>
            <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * Add new features:

 * 3. Price with Gst dynamic calculatio while adding product: easy Selling price calculation 
 * 4. Fix add item button on prev page
 */
