# JNTIMS: Revenue, Profit & Payable Amount - Complete Analysis

## Overview
This document explains how the JNTIMS system stores and calculates **Revenue**, **Profit**, and **Payable Amount**, and how they are interconnected.

---

## 1. PAYABLE AMOUNT (What the company owes)

### Where It's Stored:
- **Database Collection**: `companies/{companyId}`
- **Field Name**: `cumulativePaid` (tracks how much has already been paid)
- **Related Field**: `totalPayable` (mentioned in code but inconsistently used)

### How It's Calculated:

#### A. Total Stock Amount (Payable Amount)
When an arrival date with stock items is added, the payable amount increases:

```javascript
// File: StockArrivalDates.jsx (Line 81-84)
// When adding a new arrival date with amount:
await updateDoc(companyRef, {
  totalPayable: increment(amt),  // Increment by the amount
});
```

**Sources of payable amount:**
1. **Stock Arrivals**: Each arrival date has an `amount` field
   - Located in: `companies/{companyId}/arrivalDates/{dateId}`
   - Stores: Amount paid to supplier for that stock arrival

2. **Manual Additions**: Can manually add amounts
   - File: `PaymentsDetails.jsx` (Line 152-157)
   - Used for adjustments or other charges

#### B. Remaining Balance Calculation
```javascript
// File: PaymentsDetails.jsx (Line 81)
setRemainingBalance(totalStockAmount - cumulativePaid);
```

**Formula:**
```
Remaining Balance = Total Stock Amount - Cumulative Paid
```

**Example:**
- Total Stock Amount: ₹10,000
- Cumulative Paid: ₹3,000
- Remaining Balance: ₹7,000

### Current Issues:
1. **Inconsistent field naming**: Code uses both `totalPayable` and `cumulativePaid`
2. **Amount stored separately**: Stock amount stored in arrival dates, not derived from items
3. **Manual amounts not validated**: Can add manual amounts without tracking reason

---

## 2. REVENUE (Total money earned from sales)

### Where It's Stored:

#### A. Global Sales Collection (New/Recommended)
- **Collection**: `sales` (global collection)
- **Document**: One per sale transaction
- **Fields**:
  ```javascript
  {
    companyId,
    itemId,
    itemName,
    unitsSold,
    revenue,        // ← selling price × units sold
    profit,
    date,           // YYYY-MM-DD format
    timestamp
  }
  ```
- **File**: `StockItemsOnDate.jsx` (Line 134-145)

#### B. Item-Level Sales Array (Legacy)
- **Collection**: `companies/{companyId}/arrivalDates/{dateId}/stockItems/{itemId}`
- **Field**: `sales` (array of sale transactions)
- **Also stores**: `totalRevenue` (cumulative revenue for this item)
- **File**: `AllStockItems.jsx` (Line 83)

### How Revenue is Calculated:

```javascript
// File: StockItemsOnDate.jsx (Line 130)
const revenue = selling * increment;
```

**Formula:**
```
Revenue = Selling Price per Unit × Units Sold
```

**Example:**
- Selling Price: ₹30/unit
- Units Sold: 50 units
- Revenue: ₹1,500

### Revenue Calculation Flow:

1. **User adds sold units** → `handleSaveSoldUnits()` triggered
2. **Calculate revenue**:
   ```javascript
   const selling = Number(item.sellingPrice) || 0;
   const increment = parseInt(soldUnits[itemId]) || 0;
   const revenue = selling * increment;
   ```
3. **Store in two places**:
   - Global `sales` collection (for dashboard/reports)
   - Item's `sales` array (legacy tracking)
   - Item's `totalRevenue` field (cumulative)

### Revenue Display:
- **Per Item**: `StockItemsOnDate.jsx` (Line 259)
  ```javascript
  ₹{(Number(item.sellingPrice) * currentSold).toFixed(2)}
  ```
- **Monthly**: `MonthlyReport.jsx` (aggregates all sales by month)
- **Dashboard**: Shows monthly totals

---

## 3. PROFIT (Revenue minus costs)

### Where It's Stored:

#### A. Global Sales Collection
- **Collection**: `sales`
- **Field**: `profit`
- **File**: `StockItemsOnDate.jsx` (Line 140)

#### B. Item-Level
- **Field**: `totalProfit` (on stock item)
- **File**: `AllStockItems.jsx` (Line 84)

#### C. Dashboard/Reports
- **Component**: `MonthlyReport.jsx`
- **Aggregates profit by month**

### How Profit is Calculated:

```javascript
// File: StockItemsOnDate.jsx (Line 131)
const profit = (selling - perUnitCost) * increment;
```

**Formula:**
```
Profit per Unit = Selling Price - Cost Price (with GST)
Total Profit = Profit per Unit × Units Sold
```

**Detailed Breakdown:**
```
Cost Price = perUnitWithGst
           = (Box Price × (1 + GST%/100)) / Units Per Box

Profit per Unit = Selling Price - Cost Price with GST

Total Profit = (Selling Price - Cost Price) × Units Sold
```

### Example Calculation:

**Input:**
- Box Price (without GST): ₹500
- GST: 18%
- Units per Box: 20
- Selling Price: ₹30/unit
- Units Sold: 50

**Calculation:**
```
1. GST Amount per Box = 500 × 18/100 = ₹90
2. Box Price with GST = 500 + 90 = ₹590
3. Cost per Unit = 590 / 20 = ₹29.50
4. Profit per Unit = 30 - 29.50 = ₹0.50
5. Total Profit = 0.50 × 50 = ₹25
```

### Profit Calculation Flow:

1. **Stock item created** with:
   - `perUnitWithGst` (calculated during creation)
   - `sellingPrice` (user input)

2. **When units sold**:
   ```javascript
   const perUnitCost = Number(soldItem.perUnitWithGst) || 0;
   const selling = Number(soldItem.sellingPrice) || 0;
   const profit = (selling - perUnitCost) * increment;
   ```

3. **Stored with each sale** and aggregated globally

---

## 4. DATA STRUCTURE & RELATIONSHIPS

### Database Schema:

```
Firestore
│
├── companies/
│   ├── {companyId}
│   │   ├── name
│   │   ├── createdAt
│   │   ├── cumulativePaid (₹ paid to date)
│   │   ├── totalPayable (₹ owed - inconsistently used)
│   │   │
│   │   ├── arrivalDates/
│   │   │   └── {dateId}
│   │   │       ├── date (YYYY-MM-DD)
│   │   │       ├── amount (₹ for this arrival)
│   │   │       ├── status (Active/Sold)
│   │   │       ├── timestamp
│   │   │       │
│   │   │       └── stockItems/
│   │   │           └── {itemId}
│   │   │               ├── name
│   │   │               ├── boxes
│   │   │               ├── unitsPerBox
│   │   │               ├── units (total)
│   │   │               ├── sold (sold units)
│   │   │               ├── gst %
│   │   │               ├── boxPrice (₹)
│   │   │               ├── boxPriceWithGst (₹)
│   │   │               ├── totalCostWithGst (₹)
│   │   │               ├── perUnitWithGst (₹)
│   │   │               ├── sellingPrice (₹)
│   │   │               ├── totalRevenue (₹)
│   │   │               ├── totalProfit (₹)
│   │   │               ├── sales[] (array of sales)
│   │   │               └── timestamp
│   │   │
│   │   └── payments/
│   │       └── {paymentId}
│   │           ├── checkNumber
│   │           ├── amountPaid (₹)
│   │           └── timestamp
│   │
│   └── totals/global (mentioned in AllStockItems.jsx)
│       ├── totalRevenue
│       └── totalProfit
│
└── sales/ (global collection)
    └── {saleId}
        ├── companyId
        ├── itemId
        ├── itemName
        ├── unitsSold
        ├── revenue (₹)
        ├── profit (₹)
        ├── date (YYYY-MM-DD)
        └── timestamp
```

---

## 5. HOW THEY ARE CONNECTED

### The Complete Flow:

```
1. ADD STOCK ARRIVAL
   └─→ Increases: Payable Amount (totalPayable += arrival.amount)
   └─→ Stores: Unit cost (with GST) for later profit calculation

2. ADD STOCK ITEMS (to arrival date)
   └─→ Calculates: perUnitWithGst for each item
   └─→ Stores: Selling price (user input)
   └─→ Display: Total Bill (sum of totalCostWithGst)

3. SELL UNITS
   ├─→ Calculates REVENUE:
   │   Revenue = Selling Price × Units Sold
   │
   ├─→ Calculates PROFIT:
   │   Profit = (Selling Price - Cost with GST) × Units Sold
   │
   └─→ Records sale in:
       ├─ Global "sales" collection (for reports)
       ├─ Item's "sales" array (for item-level tracking)
       ├─ Item's totalRevenue field
       ├─ Item's totalProfit field
       └─ Global "totals/global" (if implemented)

4. VIEW PAYMENTS
   └─→ Payable Amount = Total Stock Amount - Cumulative Paid
   └─→ Shows: Remaining Balance to be paid

5. MONTHLY REPORT
   └─→ Aggregates: All sales by month
   └─→ Sums: Revenue by month
   └─→ Sums: Profit by month
```

### Key Relationships:

| Component | Depends On | Calculates |
|-----------|-----------|-----------|
| **Payable Amount** | Arrival Dates amounts | Remaining Balance |
| **Revenue** | Item selling price + units sold | Total Revenue |
| **Profit** | Selling price + Cost with GST + units sold | Total Profit |
| **Dashboard** | All sales records | Monthly totals |
| **Remaining Balance** | Payable Amount - Cumulative Paid | Amount still due |

---

## 6. CRITICAL ISSUES & INCONSISTENCIES

### Issue 1: Dual Tracking of Revenue/Profit
**Problem**: Revenue and profit stored in multiple places:
- Global `sales` collection
- Item's `sales` array
- Item's `totalRevenue` and `totalProfit` fields
- Global `totals/global` collection (attempted)

**Risk**: Data inconsistency if updates fail partially

**Recommendation**: Consolidate to single source (global `sales` collection is best)

### Issue 2: Payable Amount Inconsistency
**Problem**: Uses both `totalPayable` and `cumulativePaid`
- `totalPayable`: Increment operation in `StockArrivalDates.jsx`
- `cumulativePaid`: Fetched/updated in `PaymentsDetails.jsx`

**Risk**: May not properly track total amounts owed

**Recommendation**: 
- Use `totalPayable` for total amount owed
- Use `cumulativePaid` for amount already paid
- Always sync both properly

### Issue 3: Amount Storage Inconsistency
**Problem**: Stock amount stored in arrival dates, not calculated from items
- Mentioned in `issues` file: "stock amount in add stock page and total bill are 2 separate variables"

**Risk**: User can set amount manually, may not match actual stock cost

**Recommendation**: Calculate amount automatically from items' `totalCostWithGst`

### Issue 4: Sales Not Visible
**Problem**: Listed in `issues` file

**Files to check**:
- `MonthlyReport.jsx` - doesn't show item-level details
- `AllStockItems.jsx` - attempts to show but may have bugs
- Sales might not be stored correctly

---

## 7. CALCULATION WORKFLOW SUMMARY

### For Each Sale:

```javascript
1. Get Stock Item:
   - sellingPrice (per unit)
   - perUnitWithGst (cost per unit)
   - units sold (user input)

2. Calculate Revenue:
   revenue = sellingPrice × unitsSold

3. Calculate Profit:
   profit = (sellingPrice - perUnitWithGst) × unitsSold

4. Store Sale:
   - Add to global "sales" collection
   - Add to item's "sales" array
   - Update item's totalRevenue
   - Update item's totalProfit
   - Update global "totals/global" (if exists)

5. Update Item:
   - sold: currentSold + unitsSold
   - totalRevenue: + revenue
   - totalProfit: + profit

6. Check if All Sold:
   - If all items in arrival completely sold
   - Mark arrival date status as "Sold"
```

### For Payable Amount:

```javascript
1. Get Total Stock Amount:
   - Sum of all arrival dates' "amount" field

2. Get Cumulative Paid:
   - From company's "cumulativePaid" field

3. Calculate Remaining:
   remainingBalance = totalStockAmount - cumulativePaid

4. Update on Payment:
   - Add to payments collection
   - Update company's cumulativePaid
   - Recalculate remainingBalance
```

---

## 8. FILES INVOLVED

| File | Purpose |
|------|---------|
| `StockItemsOnDate.jsx` | Add/sell items, calculate revenue/profit |
| `StockArrivalDates.jsx` | Add arrivals, update payable amount |
| `PaymentsDetails.jsx` | Track payments, calculate remaining balance |
| `AllStockItems.jsx` | Global sales tracking |
| `MonthlyReport.jsx` | Aggregate monthly revenue/profit |
| `PaymentsCompanyList.jsx` | List companies for payment |

---

## 9. RECOMMENDATIONS

1. **Consolidate Revenue/Profit Storage**: Use only global `sales` collection as source of truth
2. **Fix Payable Amount**: Use consistent field names (`totalPayable` and `cumulativePaid`)
3. **Calculate Amount from Items**: Don't let users manually set arrival amount, calculate from items
4. **Add Data Validation**: Ensure totals always match across collections
5. **Add Audit Trail**: Track when data is added/modified for debugging
6. **Fix Sales Visibility**: Implement proper sales report showing all transactions

