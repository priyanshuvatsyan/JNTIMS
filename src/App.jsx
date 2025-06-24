import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AllCompanies from './components/AllCompanies';
import StockArrival from './components/StockArrivalDates';
import StockItemsOnDate from './components/StockItemsOnDate';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}>
        <Route index element={<AllCompanies />} />
        <Route path="company/:companyId" element={<StockArrival />} />
        <Route path="/company/:companyId/date/:dateId" element={<StockItemsOnDate />} />
      <Route path="/dashboard" element={<Dashboard />}></Route>
      <Route path="/bills" element={<Bills />}></Route>
      </Route>
    </Routes>
  );
}

export default App;
