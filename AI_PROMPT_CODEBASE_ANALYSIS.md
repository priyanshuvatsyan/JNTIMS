# AI Prompt: JNTIMS Codebase Analysis & Documentation

## Instructions
Copy and paste the following prompt into your AI assistant (ChatGPT, Claude, etc.) to generate comprehensive documentation and flowcharts for the JNTIMS codebase.

---

## ACTUAL CODE SNIPPETS FROM KEY FILES

### File: `firebase.js` - Database Configuration

```javascript
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCP5b79deprozO7qFKV3OxDCjutFrVrNxM",
  authDomain: "jntims-a26ba.firebaseapp.com",
  projectId: "jntims-a26ba",
  storageBucket: "jntims-a26ba.firebasestorage.app",
  messagingSenderId: "467575536534",
  appId: "1:467575536534:web:a19a547f8b21e5cadb3bb7",
  measurementId: "G-K8DW1V494E"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
```

### File: `src/main.jsx` - React Entry Point

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```



```javascript
// When user marks units as sold, this function is called
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
    
    // UPDATE STOCK ITEM
    const itemRef = doc(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems/${itemId}`);
    await updateDoc(itemRef, { sold: newSold });

    // GET ITEM DETAILS AND CALCULATE REVENUE/PROFIT
    const soldItem = items.find(it => it.id === itemId);
    if (soldItem) {
      const perUnitCost = Number(soldItem.perUnitWithGst) || 0;
      const selling = Number(soldItem.sellingPrice) || 0;

      // REVENUE = Selling Price × Units Sold
      const revenue = selling * increment;
      
      // PROFIT = (Selling Price - Cost with GST) × Units Sold
      const profit = (selling - perUnitCost) * increment;

      // STORE IN GLOBAL SALES COLLECTION
      await addDoc(collection(db, "sales"), {
        companyId,
        itemId,
        itemName: soldItem.name,
        unitsSold: increment,
        revenue: revenue,
        profit: profit,
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        timestamp: serverTimestamp(),
      });
    }

    // CLEAR INPUT AND REFRESH
    setSoldUnits(prev => ({ ...prev, [itemId]: '' }));
    fetchItems();
  } catch (err) {
    console.error('Error updating sold units:', err);
  } finally {
    setSavingSoldId(null);
  }
};

// CALCULATE TOTAL BILL & PROFIT (Live calculation)
useEffect(() => {
  let bill = 0;
  let profit = 0;

  items.forEach(item => {
    const sold = Number(item.sold) || 0;
    const perUnitCostWithGst = Number(item.perUnitWithGst) || 0;
    const selling = Number(item.sellingPrice) || 0;
    const lineTotalWithGst = Number(item.totalCostWithGst) || 0;

    bill += lineTotalWithGst;
    // Profit on sold portion only
    profit += (selling - perUnitCostWithGst) * sold;
  });

  setTotalBill(to2(bill));
  setTotalProfit(to2(profit));
}, [items]);

// COST CALCULATION WHEN ADDING ITEM
const handleAddItem = async () => {
  const { name, boxes, unitsPerBox, gst, boxPrice, sellingPrice } = formData;
  
  const boxCount = parseInt(boxes);
  const perBoxUnits = parseInt(unitsPerBox);
  const totalUnits = boxCount * perBoxUnits;

  const baseBoxPrice = parseFloat(boxPrice);
  const gstPercent = parseFloat(gst);

  // GST calculations are done per box
  const gstAmountPerBox = (baseBoxPrice * gstPercent) / 100;
  const boxPriceWithGst = baseBoxPrice + gstAmountPerBox;

  // Per unit cost derived from totals
  const totalCostWithoutGst = baseBoxPrice * boxCount;
  const totalCostWithGst = boxPriceWithGst * boxCount;
  const perUnitWithoutGst = totalCostWithoutGst / totalUnits;
  const perUnitWithGst = totalCostWithGst / totalUnits;

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
    perUnitWithGst: to2(perUnitWithGst),  // THIS IS USED FOR PROFIT CALCULATION
    sellingPrice: to2(parseFloat(sellingPrice)),
    timestamp: serverTimestamp()
  });
};
```

### File: `src/components/StockArrivalDates.jsx` - Payable Amount Update

```javascript
// When adding a new arrival date with amount
const handleAddDate = async () => {
  if (!newDate || !amount) return alert('Please fill all fields');

  try {
    const ref = collection(db, `companies/${companyId}/arrivalDates`);
    const amt = parseFloat(amount) || 0;

    // ADD ARRIVAL DATE RECORD
    await addDoc(ref, {
      date: newDate,
      amount: amt,
      status: 'Active',
      timestamp: serverTimestamp(),
    });

    // INCREMENT THE COMPANY'S RUNNING PAYABLE BALANCE
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      totalPayable: increment(amt),  // Increment by the amount
    });

    setNewDate('');
    setAmount('');
    setShowForm(false);
    fetchArrivalDates();
  } catch (err) {
    console.error('Error adding new date', err);
  }
};

// FETCH ARRIVAL DATES AND CALCULATE AMOUNT
const fetchArrivalDates = async () => {
  try {
    const ref = collection(db, `companies/${companyId}/arrivalDates`);
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    const dates = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        // fetch items inside this date
        const itemsRef = collection(db, `companies/${companyId}/arrivalDates/${docSnap.id}/stockItems`);
        const itemsSnap = await getDocs(itemsRef);

        let totalAmount = 0;
        itemsSnap.forEach((itemDoc) => {
          const item = itemDoc.data();
          totalAmount += item.totalCostWithGst || 0;
        });

        return {
          id: docSnap.id,
          ...data,
          calculatedAmount: totalAmount,
        };
      })
    );

    setArrivalDates(dates);
  } catch (err) {
    console.error('Error fetching arrival dates', err);
  }
};
```

### File: `src/components/PaymentsDetails.jsx` - Payable & Remaining Balance

```javascript
// CALCULATE REMAINING BALANCE
useEffect(() => {
  setRemainingBalance(totalStockAmount - cumulativePaid);
}, [totalStockAmount, cumulativePaid]);

// FETCH COMPANY DATA (cumulativePaid)
const fetchCompanyData = async () => {
  setLoading(true);
  try {
    const companyRef = doc(db, 'companies', companyId);
    const snapshot = await getDoc(companyRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      setCumulativePaid(data.cumulativePaid || 0);
    }
  } finally {
    setLoading(false);
  }
};

// FETCH ALL ARRIVAL DATES AND SUM AMOUNTS
const fetchArrivalDates = async () => {
  setLoading(true);
  try {
    const ref = collection(db, `companies/${companyId}/arrivalDates`);
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const dates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setArrivalDates(dates);

    // SUM ALL ARRIVAL AMOUNTS = TOTAL PAYABLE
    const total = dates.reduce((sum, item) => sum + (item.amount || 0), 0);
    setTotalStockAmount(total);
  } finally {
    setLoading(false);
  }
};

// ADD PAYMENT AND UPDATE cumulativePaid
const handleAddPayment = async () => {
  const amt = parseFloat(amountPaid);
  if (!checkNumber || !amt) return alert('Fill all fields');
  if (amt > remainingBalance) return alert('Payment exceeds remaining balance');

  setLoading(true);
  try {
    const ref = collection(db, `companies/${companyId}/payments`);
    await addDoc(ref, {
      checkNumber,
      amountPaid: amt,
      timestamp: serverTimestamp()
    });

    // UPDATE COMPANY'S CUMULATIVE PAID
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, { cumulativePaid: cumulativePaid + amt });
    setCumulativePaid(prev => prev + amt);

    setCheckNumber('');
    setAmountPaid('');
    await fetchPayments();
  } finally {
    setLoading(false);
  }
};

// RESTORE PAYMENT (Delete and subtract from cumulativePaid)
const handleRestorePayment = async (paymentId, amount) => {
  setLoading(true);
  try {
    const paymentRef = doc(db, `companies/${companyId}/payments`, paymentId);
    await deleteDoc(paymentRef);

    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, { cumulativePaid: cumulativePaid - amount });
    setCumulativePaid(prev => prev - amount);

    setPayments(prev => prev.filter(p => p.id !== paymentId));
    alert(`Payment of ₹${amount} restored.`);
  } catch (err) {
    console.error('Error restoring payment', err);
  } finally {
    setLoading(false);
  }
};
```

### File: `src/components/DashBoard/MonthlyReport.jsx` - Monthly Aggregation

```javascript
// CALCULATE MONTHLY REVENUE + PROFIT FROM ITEM SALES ARRAYS
const calculateMonthlyRevenueProfit = async () => {
  const companiesSnapshot = await getDocs(collection(db, "companies"));
  const monthlyStats = {};
  const salesList = [];

  for (const companyDoc of companiesSnapshot.docs) {
    const companyId = companyDoc.id;
    const companyName = companyDoc.data().name;
    const datesRef = collection(db, `companies/${companyId}/arrivalDates`);
    const datesSnapshot = await getDocs(datesRef);

    for (const dateDoc of datesSnapshot.docs) {
      const dateId = dateDoc.id;
      const itemsRef = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
      const itemsSnapshot = await getDocs(itemsRef);

      for (const itemDoc of itemsSnapshot.docs) {
        const item = itemDoc.data();
        const itemName = item.name;
        
        // ITERATE THROUGH SALES ARRAY
        if (item.sales) {
          item.sales.forEach(sale => {
            const monthKey = sale.date.slice(0, 7); // "YYYY-MM"
            if (!monthlyStats[monthKey]) {
              monthlyStats[monthKey] = { revenue: 0, profit: 0 };
            }
            
            // AGGREGATE BY MONTH
            monthlyStats[monthKey].revenue += sale.revenue || 0;
            monthlyStats[monthKey].profit += sale.profit || 0;

            // ADD TO ALL SALES LIST
            salesList.push({
              companyName,
              itemName,
              date: sale.date,
              unitsSold: sale.unitsSold,
              revenue: sale.revenue,
              profit: sale.profit,
              timestamp: sale.timestamp
            });
          });
        }
      }
    }
  }

  return { monthlyStats, salesList };
};

useEffect(() => {
  const fetchStats = async () => {
    const result = await calculateMonthlyRevenueProfit();
    setStats(result.monthlyStats);
    setAllSales(result.salesList);
  };
  fetchStats();
}, []);
```

### File: `src/components/AllStockItems.jsx` - Global Sales Tracking

```javascript
// HANDLE SALES FROM GLOBAL VIEW
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
    
    // CALCULATE REVENUE & PROFIT
    const revenue = selling * incrementValue;
    const profit = (selling - perUnitCost) * incrementValue;

    const saleEntry = {
      date: new Date().toISOString().split("T")[0],
      unitsSold: incrementValue,
      revenue,
      profit,
      timestamp: serverTimestamp(),
    };

    // UPDATE ITEM WITH SALE ENTRY AND TOTALS
    const itemRef = doc(db, `companies/${item.companyId}/arrivalDates/${item.dateId}/stockItems/${item.id}`);
    await updateDoc(itemRef, {
      sold: newSold,
      totalRevenue: (item.totalRevenue || 0) + revenue,
      totalProfit: (item.totalProfit || 0) + profit,
      sales: arrayUnion(saleEntry)
    });

    // UPDATE GLOBAL TOTALS
    const globalRef = doc(db, 'totals', 'global');
    await updateDoc(globalRef, {
      totalRevenue: increment(revenue),
      totalProfit: increment(profit)
    });

    setSoldUnits(prev => ({ ...prev, [item.id]: '' }));
    setSavingSoldId(null);
    fetchAllItems();
  } catch (error) {
    console.error('Error saving sold units:', error);
    setSavingSoldId(null);
  }
};

// FETCH ALL ITEMS ACROSS ALL COMPANIES
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
```

### File: `src/App.jsx` - Routing Configuration

```javascript
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AllCompanies from './components/AllCompanies';
import StockArrival from './components/StockArrivalDates';
import StockItemsOnDate from './components/StockItemsOnDate';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Sold from './pages/Sold';
import PaymentsDetails from './components/PaymentsDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}>
        <Route index element={<AllCompanies />} />
        <Route path="company/:companyId" element={<StockArrival />} />
        <Route path="/company/:companyId/date/:dateId" element={<StockItemsOnDate />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bills" element={<Bills />}>
          <Route path=":companyId" element={<PaymentsDetails />} />
        </Route>
      </Route>
      <Route path="/sold" element={<Sold />} />
    </Routes>
  );
}

export default App;
```

### File: `src/components/AllCompanies.jsx` - Company Management

```javascript
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AddCompanies from '../components/AddCompanies';

const deleteCollection = async (collectionRef) => {
  const snapshot = await getDocs(collectionRef);
  const deletePromises = snapshot.docs.map(async (docSnap) => {
    if (collectionRef.id === 'arrivalDates') {
      const itemsRef = collection(docSnap.ref, 'stockItems');
      await deleteCollection(itemsRef);
    }
    await deleteDoc(docSnap.ref);
  });
  await Promise.all(deletePromises);
};

export default function AllCompanies() {
  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();

  const fetchCompanies = async () => {
    try {
      const snapshoty = await getDocs(collection(db, 'companies'));
      const data = snapshoty.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies: ", error);
    }
  }

  const handleDelete = async (companyId) => {
    setCompanies(prev => prev.filter(c => c.id !== companyId));
    try {
      const paymentsRef = collection(db, 'companies', companyId, 'payments');
      await deleteCollection(paymentsRef);

      const stockArrivalDatesRef = collection(db, 'companies', companyId, 'arrivalDates');
      await deleteCollection(stockArrivalDatesRef);

      await deleteDoc(doc(db, 'companies', companyId));
      console.log('Company and all associated data deleted successfully');
    } catch (error) {
      console.error('Error deleting company:', error);
      setCompanies(prev => [...prev, { id: companyId }]);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div className="companies-wrapper">
      <h3>All Companies</h3>
      <ul className="company-list">
        {companies.map(company => (
          <li className="company-card" key={company.id} onClick={() => navigate(`/company/${company.id}`)}>
            <div className="company-info">
              <div className="company-avatar">{company.name[0]}</div>
              <div className="company-name">{company.name}</div>
            </div>
            <div className="delete-icon" onClick={(e) => {
              e.stopPropagation();
              handleDelete(company.id);
            }}>🗑️</div>
          </li>
        ))}
      </ul>
      <div className="add">
        <AddCompanies onCompanyAdded={fetchCompanies} />
      </div>
    </div>
  );
}
```

### File: `src/components/AddCompanies.jsx` - Add New Company

```javascript
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
        cumulativePaid: 0,
        totalPayable: 0
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
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

### File: `src/components/Nav.jsx` - Navigation Sidebar

```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Nav.css';

export default function Nav() {
  return (
    <nav className="sidebar">
      <div className="logo">
        <img src="/jnt logo.png" alt="Logo" />
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/sold">Sold</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/bills">Bills</Link></li>
      </ul>
    </nav>
  );
}
```

### File: `src/components/ResponsiveNav.jsx` - Mobile Navigation

```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { MdHome, MdDashboard, MdReceiptLong } from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillTrendUp } from '@fortawesome/free-solid-svg-icons';
import './styles/Nav.css';

export default function ResponsiveNav() {
  return (
    <div className="responsive-nav">
      <ul className="nav-links-responsive">
        <li><Link to="/"><MdHome color="black" size={26} /></Link></li>
        <li><Link to="/sold"><FontAwesomeIcon icon={faMoneyBillTrendUp} color="black" size={26} /></Link></li>
        <li><Link to="/dashboard"><MdDashboard color="black" size={26} /></Link></li>
        <li><Link to="/bills"><MdReceiptLong color="black" size={26} /></Link></li>
      </ul>
    </div>
  );
}
```

### File: `src/components/PaymentsCompanyList.jsx` - Payment Selection

```javascript
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './styles/PaymentsCompanyList.css';

export default function PaymentsCompanyList({ onSelectCompany }) {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const ref = collection(db, 'companies');
        const snapshot = await getDocs(ref);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(data);
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <div className="company-list-wrapper">
      <h2 className="company-list-heading">Choose Company for Payments</h2>
      <ul className="company-list">
        {companies.map(company => (
          <li key={company.id} className="company-card" onClick={() => onSelectCompany && onSelectCompany(company.id)}>
            <span className="company-link">{company.name || 'Unnamed Company'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### File: `src/pages/Home.jsx` - Home Page Layout

```javascript
import React from 'react';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import './styles/Home.css';
import { Outlet } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container">
      <div className="nav">
        <Nav />
      </div>
      <div className="content">
        <Outlet /> {/* Routes: AllCompanies, StockArrival, StockItemsOnDate */}
      </div>
      <ResponsiveNav />
    </div>
  );
}
```

### File: `src/pages/Dashboard.jsx` - Dashboard with Monthly Reports

```javascript
import React from 'react';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import './styles/Home.css';
import './styles/Dashboard.css';
import MonthlyReport from '../components/DashBoard/MonthlyReport';

export default function Dashboard() {
  return (
    <div className='coming-soon'>
      <MonthlyReport />
    </div>
  )
}
```

### File: `src/pages/Bills.jsx` - Bills/Payments Page

```javascript
import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import PaymentsCompanyList from '../components/PaymentsCompanyList';
import PaymentsDetails from '../components/PaymentsDetails';
import './styles/Home.css';

export default function Bills() {
  const { companyId } = useParams();
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const handleSelectCompany = (id) => {
    setSelectedCompanyId(id);
  };

  return (
    <div className="home-container">
      <div className="content" style={{ display: 'flex', gap: '2rem' }}>
        {!companyId && !selectedCompanyId && (
          <div style={{ flex: 1, minWidth: '250px' }}>
            <PaymentsCompanyList onSelectCompany={handleSelectCompany} />
          </div>
        )}

        <div style={{ flex: 2, width: '100%' }}>
          {selectedCompanyId ? (
            <PaymentsDetails companyId={selectedCompanyId} />
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      <ResponsiveNav />
    </div>
  );
}
```

### File: `src/pages/Sold.jsx` - Sold Items Page

```javascript
import React from 'react';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import './styles/Home.css';
import './styles/Dashboard.css';
import AllStockItems from '../components/AllStockItems';

export default function Sold() {
  return (
    <div className="home-container">
      <div className="nav">
        <Nav />
      </div>
      <div className="content">
        <AllStockItems />
      </div>
      <ResponsiveNav />
    </div>
  )
}
```

---

## PROMPT START HERE

You are a software documentation expert. I'm providing you with complete information about my React + Firebase application called JNTIMS (JNT Inventory Management System). Please analyze this and create:

1. **A detailed explanatory document** covering the complete codebase structure, architecture, data flows, and how all components work together
2. **Multiple flowcharts** (in ASCII or Mermaid format) showing:
   - System architecture
   - Data flow between components
   - Payment tracking workflow
   - Revenue/Profit calculation workflow
   - Stock management workflow

---

## PROJECT OVERVIEW

**Project Name:** JNTIMS (JNT Inventory Management System)

**Purpose:** A web application to manage:
- Company inventory and stock arrivals
- Stock item sales and revenue tracking
- Profit calculations (selling price vs cost with GST)
- Payment tracking (payable amounts and payments received)
- Monthly revenue and profit reports

**Tech Stack:**
- Frontend: React 19.1.0 with React Router 7.6.2
- State Management: React hooks (useState, useEffect)
- Database: Firebase Firestore (real-time database)
- Build Tool: Vite 6.3.5
- Styling: Custom CSS
- Icons: React Icons & FontAwesome
- Testing/Automation: Selenium WebDriver

---

## FILE STRUCTURE

```
JNTIMS/
├── src/
│   ├── App.jsx                          # Main router configuration
│   ├── App.css                          # Global styles
│   ├── main.jsx                         # React entry point
│   ├── index.css
│   │
│   ├── pages/
│   │   ├── Home.jsx                     # Home page with nested routes
│   │   ├── Dashboard.jsx                # Dashboard with monthly reports
│   │   ├── Bills.jsx                    # Payments/billing page
│   │   ├── Sold.jsx                     # Sold items page
│   │   └── styles/
│   │       ├── Home.css
│   │       └── Dashboard.css
│   │
│   ├── components/
│   │   ├── Nav.jsx                      # Main sidebar navigation
│   │   ├── ResponsiveNav.jsx            # Mobile navigation
│   │   ├── AllCompanies.jsx             # List all companies with delete
│   │   ├── AddCompanies.jsx             # Modal to add new company
│   │   ├── StockArrivalDates.jsx        # List arrival dates per company
│   │   ├── StockItemsOnDate.jsx         # Add/manage items for a date, record sales
│   │   ├── AllStockItems.jsx            # Global view of all items and sales
│   │   ├── PaymentsCompanyList.jsx      # List companies for payment view
│   │   ├── PaymentsDetails.jsx          # Payment tracking for a company
│   │   │
│   │   ├── DashBoard/
│   │   │   ├── MonthlyReport.jsx        # Monthly revenue/profit aggregation
│   │   │   └── styles/
│   │   │
│   │   └── styles/
│   │       ├── Nav.css
│   │       ├── AllCompanies.css
│   │       ├── AddCompanies.css
│   │       ├── StockArrivalDates.css
│   │       ├── StockItemsOnDate.css
│   │       ├── PaymentsCompanyList.css
│   │       └── PaymentsDetails.css
│   │
│   └── assets/
│
├── firebase.js                          # Firebase configuration
├── automation.js                        # Selenium automation script
├── vite.config.js
├── eslint.config.js
├── package.json
├── index.html
├── netlify.toml                         # Netlify deployment config
└── README.md
```

---

## FIREBASE FIRESTORE DATABASE STRUCTURE

```
Database Collections:

companies/
├── {companyId}                          # Document per company
│   ├── name: string
│   ├── createdAt: timestamp
│   ├── cumulativePaid: number           # Total amount paid to date
│   ├── totalPayable: number             # Total amount owed (inconsistently used)
│   │
│   ├── arrivalDates/ (subcollection)
│   │   ├── {dateId}
│   │   │   ├── date: string (YYYY-MM-DD)
│   │   │   ├── amount: number           # Cost of this stock arrival
│   │   │   ├── status: string           # "Active" or "Sold"
│   │   │   ├── timestamp: server timestamp
│   │   │   │
│   │   │   └── stockItems/ (subcollection)
│   │   │       ├── {itemId}
│   │   │       │   ├── name: string
│   │   │       │   ├── boxes: number
│   │   │       │   ├── unitsPerBox: number
│   │   │       │   ├── units: number    # Total units (boxes × unitsPerBox)
│   │   │       │   ├── sold: number     # Units sold so far
│   │   │       │   ├── gst: number      # GST percentage
│   │   │       │   ├── boxPrice: number # Price per box without GST
│   │   │       │   ├── boxPriceWithGst: number
│   │   │       │   ├── totalCostWithoutGst: number
│   │   │       │   ├── totalCostWithGst: number
│   │   │       │   ├── perUnitWithoutGst: number
│   │   │       │   ├── perUnitWithGst: number # Used for profit calculation
│   │   │       │   ├── sellingPrice: number   # Per unit selling price
│   │   │       │   ├── totalRevenue: number   # Cumulative revenue
│   │   │       │   ├── totalProfit: number    # Cumulative profit
│   │   │       │   ├── sales: array
│   │   │       │   │   ├── {sale object}
│   │   │       │   │   │   ├── date: string
│   │   │       │   │   │   ├── unitsSold: number
│   │   │       │   │   │   ├── revenue: number
│   │   │       │   │   │   ├── profit: number
│   │   │       │   │   │   └── timestamp: server timestamp
│   │   │       │   │
│   │   │       │   └── timestamp: server timestamp
│   │
│   └── payments/ (subcollection)
│       └── {paymentId}
│           ├── checkNumber: string
│           ├── amountPaid: number
│           └── timestamp: server timestamp
│
sales/ (Global collection for reporting)
├── {saleId}
│   ├── companyId: string
│   ├── itemId: string
│   ├── itemName: string
│   ├── unitsSold: number
│   ├── revenue: number
│   ├── profit: number
│   ├── date: string (YYYY-MM-DD)
│   └── timestamp: server timestamp
│
totals/ (Global totals - attempted)
└── global
    ├── totalRevenue: number
    └── totalProfit: number
```

---

## KEY COMPONENTS DESCRIPTION

### 1. **Navigation & Layout**
- **Nav.jsx**: Sidebar with company logo and main navigation links
- **ResponsiveNav.jsx**: Mobile-friendly bottom navigation
- **Home.jsx**: Main container with nested routes

### 2. **Company Management**
- **AllCompanies.jsx**: Display list of all companies with delete functionality
- **AddCompanies.jsx**: Modal form to add new companies
- Functions: Create, list, and delete companies

### 3. **Stock Management**
- **StockArrivalDates.jsx**: 
  - Shows arrival dates for a specific company
  - Allows adding new arrival with date and amount
  - Marks arrivals as "Sold" or "Active"
  - Increments `company.totalPayable` when adding arrival
  
- **StockItemsOnDate.jsx**:
  - Add stock items to an arrival date
  - Specify: boxes, units per box, price, GST, selling price
  - Calculate: totalCost with/without GST, perUnitCost with/without GST
  - Record sales: enter units sold, calculates revenue and profit
  - Shows live total bill and profit for the arrival
  - Stores sales in both global and item-level collections

### 4. **Sales Management**
- **AllStockItems.jsx**: 
  - Global view of all stock items across all companies
  - Allow selling units directly from this view
  - Updates global totals

### 5. **Payment Tracking**
- **PaymentsCompanyList.jsx**: List companies for selecting payment details
- **PaymentsDetails.jsx**:
  - Show payable amount (sum of all arrival amounts)
  - Show cumulative paid
  - Calculate remaining balance: `totalStockAmount - cumulativePaid`
  - Add payment records with check numbers
  - Restore/delete payments
  - Manual amount additions for adjustments

### 6. **Reporting**
- **MonthlyReport.jsx**:
  - Aggregates all sales by month (YYYY-MM)
  - Calculates total monthly revenue and profit
  - Displays detailed sales list with company and item info

---

## CORE CALCULATIONS

### Revenue Calculation
```
When user sells X units of an item:

revenue = sellingPrice × unitsToSell

Example:
- Selling Price: ₹30/unit
- Units Sold: 50
- Revenue: ₹1,500
```

### Profit Calculation
```
profit = (sellingPrice - perUnitWithGst) × unitsToSell

Where:
  perUnitWithGst = (boxPrice × (1 + GST%/100)) / unitsPerBox

Example:
- Box Price: ₹500 (without GST)
- GST: 18%
- Units per Box: 20
- Selling Price: ₹30/unit
- Units Sold: 50

Calculation:
  boxPriceWithGst = 500 + (500 × 0.18) = ₹590
  perUnitWithGst = 590 / 20 = ₹29.50
  profit = (30 - 29.50) × 50 = ₹25
```

### Payable Amount Calculation
```
Total Payable = Sum of all arrival.amount values for a company

Remaining Balance = Total Payable - Cumulative Paid

Example:
- Arrival 1: ₹5,000
- Arrival 2: ₹8,000
- Total Payable: ₹13,000
- Payments Made: ₹3,000
- Remaining: ₹10,000
```

---

## DATA FLOW SCENARIOS

### Scenario 1: Adding Stock Items and Selling

```
1. Create Company
   → company document with name, createdAt

2. Add Arrival Date
   → arrivalDate document with date, amount
   → Updates company.totalPayable += amount

3. Add Stock Items to Arrival
   → stockItem documents with costs calculated
   → Stores perUnitWithGst for profit calculation

4. Record Sales (User marks units as sold)
   → Create sale record in global "sales" collection
   → Add to item's sales array
   → Update item.sold, totalRevenue, totalProfit
   → Check if all items in arrival are sold
   → If yes: Mark arrivalDate.status = "Sold"
```

### Scenario 2: Payment Tracking

```
1. View Company Payments
   → Fetch all arrival dates for company
   → Sum all amount fields = Total Payable
   → Fetch company.cumulativePaid
   → Calculate: remainingBalance = totalPayable - cumulativePaid

2. Add Payment
   → Create payment record
   → Update company.cumulativePaid += paymentAmount
   → Recalculate remaining balance

3. Delete/Restore Payment
   → Remove from payments collection
   → Update company.cumulativePaid -= paymentAmount
```

### Scenario 3: Monthly Report Generation

```
1. Fetch all companies
2. For each company, fetch all arrivalDates
3. For each arrivalDate, fetch all stockItems
4. For each stockItem, get sales array
5. Group sales by month (YYYY-MM)
6. For each month:
   - Sum revenue: monthRevenue += sale.revenue
   - Sum profit: monthProfit += sale.profit
7. Display monthly breakdown
```

---

## KEY FEATURES

1. **Multi-Company Management**: Separate data for each company
2. **Stock Tracking**: Track boxes and units with cost calculations
3. **GST Handling**: Automatically calculates GST-inclusive costs
4. **Sales Recording**: Quick unit-to-sold conversion
5. **Profit Calculation**: Real-time profit based on cost with GST vs selling price
6. **Payment Tracking**: Track what's owed and what's been paid
7. **Monthly Reports**: Aggregate revenue and profit by month
8. **Responsive Design**: Mobile-friendly interface
9. **Real-time Sync**: Firebase Firestore keeps all devices in sync

---

## CURRENT ISSUES/CHALLENGES

1. **Data Inconsistency**: 
   - Revenue/profit stored in multiple places (global sales, item sales array, item fields)
   - Risk of partial updates causing inconsistency

2. **Payable Amount Confusion**:
   - Both `totalPayable` and `cumulativePaid` used inconsistently
   - Not always synced properly

3. **Manual Amount Entry**:
   - Arrival amount set manually instead of calculated from items
   - Can cause mismatch between actual costs and recorded amount

4. **Sales Visibility**:
   - Sales might not display properly across all views
   - Multiple storage locations make debugging difficult

5. **Missing Global Totals**:
   - `totals/global` collection attempted but implementation incomplete

6. **No Data Validation**:
   - Limited validation of amounts and calculations
   - No audit trail for debugging

---

## ROUTING STRUCTURE

```
/ (Home page with nested routes)
├── / (Default: AllCompanies)
├── /company/:companyId (StockArrivalDates)
├── /company/:companyId/date/:dateId (StockItemsOnDate)
├── /dashboard (MonthlyReport)
│
/sold (AllStockItems)
│
/bills (Bills wrapper)
└── /bills/:companyId (PaymentsDetails)
```

---

## REQUEST FOR OUTPUT

Please create:

1. **Comprehensive Explanatory Document** that includes:
   - System architecture overview
   - Component descriptions and responsibilities
   - Data flow diagrams in text form
   - Calculation methods with examples
   - Database structure explanation
   - User workflows for each major feature
   - Current issues and recommendations

2. **Flowcharts** (in Mermaid or ASCII format) showing:
   - Overall system architecture
   - Stock management workflow (add item → sell → complete)
   - Payment tracking workflow (add arrival → add payment → complete)
   - Revenue and profit calculation flow
   - Monthly report generation flow
   - Component interaction diagram

3. **Issues & Recommendations** section highlighting:
   - Data consistency problems
   - Suggestions for fixes
   - Best practices for the architecture

Format the flowcharts so they're easy to read and can be inserted into documentation or converted to images.

---

## PROMPT END HERE

---

## NOTES FOR USER

- The analysis document is already available in `REVENUE_PROFIT_PAYABLE_ANALYSIS.md`
- This prompt can be pasted into ChatGPT, Claude, or any AI with context
- AI will generate flowcharts in Mermaid format which can be rendered in GitHub, Notion, or online Mermaid editors
- Use the output to create visual documentation for your team
- Consider showing the flowcharts to your team for validation before finalizing
