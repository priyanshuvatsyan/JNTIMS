import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
  ,LabelList
} from "recharts";
import "./styles/MonthlySales.css";

export default function MonthlySales() {
  const [monthlyData, setMonthlyData] = useState({
    current: { revenue: 0, profit: 0, salesCount: 0, month: "" },
    previous: { revenue: 0, profit: 0, salesCount: 0, month: "" }
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [allMonths, setAllMonths] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Function to fetch sales data for current and previous month
  const fetchMonthlySalesData = async () => {
    try {
      // Get company map
      const companiesSnapshot = await getDocs(collection(db, "companies"));
      const companyMap = {};
      companiesSnapshot.docs.forEach(doc => {
        companyMap[doc.id] = doc.data().name;
      });

      // Fetch all sales
      const salesSnapshot = await getDocs(collection(db, "sales"));
      const monthMap = {};

      // Build month map from all sales
      salesSnapshot.docs.forEach(saleDoc => {
        const sale = saleDoc.data();
        const saleMonth = sale.date.slice(0, 7);
        
        if (!companyMap[sale.companyId]) return;

        if (!monthMap[saleMonth]) {
          monthMap[saleMonth] = { revenue: 0, profit: 0, salesCount: 0 };
        }
        monthMap[saleMonth].revenue += sale.revenue || 0;
        monthMap[saleMonth].profit += sale.profit || 0;
        monthMap[saleMonth].salesCount += 1;
      });

      // Get all available months sorted in descending order
      const months = Object.keys(monthMap).sort().reverse();
      setAllMonths(months);

      // Set default to latest month if available
      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }

      // Generate month data with correct previous month
      const monthsData = {};
      months.forEach(month => {
        monthsData[month] = monthMap[month];
      });

      setMonthlyData(monthsData);
    } catch (err) {
      console.error("Error fetching monthly sales data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySalesData();
  }, []);

  useEffect(() => {
    const check = () => setIsSmallScreen(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (loading) {
    return <div className="ms-loading">Loading...</div>;
  }

  // Get current and previous month data based on selection
  const currentMonthIndex = allMonths.indexOf(selectedMonth);
  const previousMonthIndex = currentMonthIndex + 1;
  
  const current = monthlyData[selectedMonth] || { revenue: 0, profit: 0, salesCount: 0 };
  const previous = previousMonthIndex < allMonths.length 
    ? monthlyData[allMonths[previousMonthIndex]] 
    : { revenue: 0, profit: 0, salesCount: 0 };

  // Data for combined line chart
  const combinedData = [
    {
      month: selectedMonth,
      revenue: current.revenue,
      profit: current.profit,
      sales: current.salesCount
    },
    {
      month: allMonths[previousMonthIndex] || "Previous",
      revenue: previous.revenue,
      profit: previous.profit,
      sales: previous.salesCount
    }
  ];
  const revenueChange = previous.revenue !== 0 
    ? (((current.revenue - previous.revenue) / previous.revenue) * 100).toFixed(2)
    : "N/A";
  const profitChange = previous.profit !== 0
    ? (((current.profit - previous.profit) / previous.profit) * 100).toFixed(2)
    : "N/A";
  const salesChange = previous.salesCount !== 0
    ? (((current.salesCount - previous.salesCount) / previous.salesCount) * 100).toFixed(2)
    : "N/A";

  return (
    <div className="ms-root">
      <h2 className="ms-title">📈 Monthly Sales Analysis</h2>

      {/* Month Navigation (buttons will appear left/right of the chart) */}

      {/* Combined Line Chart - Revenue, Profit & Sales */}
      <div className="ms-card">
        <h3 className="ms-card-title">Revenue, Profit & Sales Comparison</h3>
        <div className="ms-chart-row">
          <button
            onClick={() => {
              const idx = allMonths.indexOf(selectedMonth);
              if (idx < allMonths.length - 1) {
                setSelectedMonth(allMonths[idx + 1]);
              }
            }}
            disabled={allMonths.indexOf(selectedMonth) >= allMonths.length - 1}
            aria-label="Previous month"
            className="ms-btn"
          >
            ←
          </button>

          <div className="ms-chart">
            {/* render three separate small charts for clarity */}
            {(() => {
              const revenueData = [
                { label: selectedMonth, value: current.revenue }
              ];
              const profitData = [
                { label: selectedMonth, value: current.profit }
              ];
              const salesData = [
                { label: selectedMonth, value: current.salesCount }
              ];

              return (
                <div className="metric-charts">
                  <div className="metric-card metric-card--compact">
                    <div className="metric-title">Revenue</div>
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={revenueData} margin={{ top: 80, right: 10, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gRev" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#4fc3f7" />
                            <stop offset="100%" stopColor="#0288d1" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v)=>`₹${v}`} />
                        <Tooltip formatter={(v) => (typeof v === 'number' ? `₹${v.toFixed(2)}` : v)} />
                          <Bar dataKey="value" fill="url(#gRev)" barSize={56} radius={[6,6,6,6]} animationDuration={600}>
                          <LabelList dataKey="value" position="top" formatter={v=>`₹${Number(v).toFixed(0)}`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="metric-card metric-card--compact">
                    <div className="metric-title">Profit</div>
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={profitData} margin={{ top: 80, right: 10, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gProfit" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#81c784" />
                            <stop offset="100%" stopColor="#388e3c" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f7f7f7" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v)=>`₹${v}`} />
                        <Tooltip formatter={(v) => (typeof v === 'number' ? `₹${v.toFixed(2)}` : v)} />
                          <Bar dataKey="value" fill="url(#gProfit)" barSize={52} radius={[6,6,6,6]} animationDuration={600}>
                          <LabelList dataKey="value" position="top" formatter={v=>`₹${Number(v).toFixed(0)}`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="metric-card metric-card--compact">
                    <div className="metric-title">Sales Count</div>
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={salesData} margin={{ top: 80, right: 10, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gSales" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#ffd54f" />
                            <stop offset="100%" stopColor="#fb8c00" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#fafafa" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => v} />
                          <Bar dataKey="value" fill="url(#gSales)" barSize={48} radius={[6,6,6,6]} animationDuration={600}>
                          <LabelList dataKey="value" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>

          <button
            onClick={() => {
              const idx = allMonths.indexOf(selectedMonth);
              if (idx > 0) {
                setSelectedMonth(allMonths[idx - 1]);
              }
            }}
            disabled={allMonths.indexOf(selectedMonth) <= 0}
            aria-label="Next month"
            className="ms-btn"
          >
            →
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="ms-stats-grid">
        <StatsCard
          label="💰 Revenue"
          currentVal={current.revenue}
          prevVal={previous.revenue}
          change={revenueChange}
          isCurrency={true}
          currentMonth={selectedMonth}
          previousMonth={allMonths[previousMonthIndex] || "Previous Month"}
        />
        <StatsCard
          label="📊 Profit"
          currentVal={current.profit}
          prevVal={previous.profit}
          change={profitChange}
          isCurrency={true}
          currentMonth={selectedMonth}
          previousMonth={allMonths[previousMonthIndex] || "Previous Month"}
        />
        <StatsCard
          label="🛒 Number of Sales"
          currentVal={current.salesCount}
          prevVal={previous.salesCount}
          change={salesChange}
          isCurrency={false}
          currentMonth={selectedMonth}
          previousMonth={allMonths[previousMonthIndex] || "Previous Month"}
        />
      </div>

      {/* Summary Stats */}
      <div className="ms-summary">
        <h3>📋 Detailed Summary</h3>
        <div className="ms-summary-grid">
          <div className="summary-item summary-item--primary">
            <p className="title">
              {selectedMonth}
            </p>
            <ul>
              <li>Revenue: <strong>₹{current.revenue.toFixed(2)}</strong></li>
              <li>Profit: <strong>₹{current.profit.toFixed(2)}</strong></li>
              <li>Sales: <strong>{current.salesCount}</strong></li>
              <li>Profit Margin: <strong>{current.revenue !== 0 ? ((current.profit / current.revenue) * 100).toFixed(2) : 0}%</strong></li>
            </ul>
          </div>
          <div className="summary-item summary-item--secondary">
            <p className="title">
              {allMonths[previousMonthIndex] || "Previous Month"}
            </p>
            <ul>
              <li>Revenue: <strong>₹{previous.revenue.toFixed(2)}</strong></li>
              <li>Profit: <strong>₹{previous.profit.toFixed(2)}</strong></li>
              <li>Sales: <strong>{previous.salesCount}</strong></li>
              <li>Profit Margin: <strong>{previous.revenue !== 0 ? ((previous.profit / previous.revenue) * 100).toFixed(2) : 0}%</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatsCard = ({ label, currentVal, prevVal, change, isCurrency = true, currentMonth, previousMonth }) => {
  const changeColor = change >= 0 ? "#4CAF50" : "#ff6b6b";
  const changeSymbol = change >= 0 ? "↑" : "↓";

  return (
    <div className="stats-card">
      <h4>{label}</h4>

      <div className="stat-current-wrap">
        <p className="stat-month">{currentMonth}</p>
        <p className="stat-value">
          {isCurrency ? "₹" : ""}{typeof currentVal === "number" ? currentVal.toFixed(2) : currentVal}
        </p>
      </div>

      <div className="stat-changebox" style={{ backgroundColor: changeColor }}>
        <p>vs {previousMonth}</p>
        <p>
          {changeSymbol} {change === "N/A" ? change : `${Math.abs(change)}%`}
        </p>
      </div>
    </div>
  );
}
