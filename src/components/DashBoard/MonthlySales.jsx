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
} from "recharts";

export default function MonthlySales() {
  const [monthlyData, setMonthlyData] = useState({
    current: { revenue: 0, profit: 0, salesCount: 0, month: "" },
    previous: { revenue: 0, profit: 0, salesCount: 0, month: "" }
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [allMonths, setAllMonths] = useState([]);

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

  if (loading) {
    return <div style={{ padding: "1rem" }}>Loading...</div>;
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
    <div style={{ padding: "1.5rem", backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "2rem", color: "#333" }}>📈 Monthly Sales Analysis</h2>

      {/* Month Slider */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginTop: 0, color: "#333" }}>Select Month to Compare</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <input
            type="range"
            min="0"
            max={Math.max(0, allMonths.length - 1)}
            value={allMonths.indexOf(selectedMonth)}
            onChange={(e) => setSelectedMonth(allMonths[parseInt(e.target.value)])}
            style={{ flex: 1, height: "6px", cursor: "pointer" }}
          />
          <div style={{
            minWidth: "150px",
            textAlign: "center",
            padding: "0.8rem",
            backgroundColor: "#e3f2fd",
            borderRadius: "6px",
            fontWeight: "bold",
            color: "#1976d2"
          }}>
            {selectedMonth}
          </div>
        </div>
      </div>

      {/* Combined Line Chart - Revenue, Profit, Sales */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginTop: 0, color: "#333" }}>Revenue, Profit & Sales Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" label={{ value: "Amount (₹)", angle: -90, position: "insideLeft" }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: "Sales Count", angle: 90, position: "insideRight" }} />
            <Tooltip 
              formatter={(value) => `${typeof value === "number" ? value.toFixed(2) : value}`}
              contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              stroke="#2196F3" 
              strokeWidth={3}
              name="Revenue"
              dot={{ fill: "#2196F3", r: 6 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="profit" 
              stroke="#4CAF50" 
              strokeWidth={3}
              name="Profit"
              dot={{ fill: "#4CAF50", r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="sales" 
              stroke="#FF9800" 
              strokeWidth={3}
              name="Sales Count"
              dot={{ fill: "#FF9800", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
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
      <div style={{
        backgroundColor: "#fff",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginTop: 0 }}>📋 Detailed Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div style={{ padding: "1.5rem", backgroundColor: "#e3f2fd", borderRadius: "6px" }}>
            <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#1976d2", margin: "0 0 1rem 0" }}>
              {selectedMonth}
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 1.5rem", lineHeight: "1.8" }}>
              <li>Revenue: <strong>₹{current.revenue.toFixed(2)}</strong></li>
              <li>Profit: <strong>₹{current.profit.toFixed(2)}</strong></li>
              <li>Sales: <strong>{current.salesCount}</strong></li>
              <li>Profit Margin: <strong>{current.revenue !== 0 ? ((current.profit / current.revenue) * 100).toFixed(2) : 0}%</strong></li>
            </ul>
          </div>
          
          <div style={{ padding: "1.5rem", backgroundColor: "#f3e5f5", borderRadius: "6px" }}>
            <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#7b1fa2", margin: "0 0 1rem 0" }}>
              {allMonths[previousMonthIndex] || "Previous Month"}
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 1.5rem", lineHeight: "1.8" }}>
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
    <div style={{
      backgroundColor: "#fff",
      border: "2px solid #e0e0e0",
      borderRadius: "8px",
      padding: "1.5rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h4 style={{ margin: "0 0 1rem 0", color: "#333" }}>{label}</h4>
      
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ color: "#666", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{currentMonth}</p>
        <p style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0, color: "#2196F3" }}>
          {isCurrency ? "₹" : ""}{typeof currentVal === "number" ? currentVal.toFixed(2) : currentVal}
        </p>
      </div>

      <div style={{
        backgroundColor: changeColor,
        color: "white",
        padding: "1rem",
        borderRadius: "6px",
        textAlign: "center"
      }}>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>vs {previousMonth}</p>
        <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: "bold" }}>
          {changeSymbol} {change === "N/A" ? change : `${Math.abs(change)}%`}
        </p>
      </div>
    </div>
  );
}
