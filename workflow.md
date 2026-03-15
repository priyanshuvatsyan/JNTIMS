# JNTIMS Workflow Documentation

## Overview
JNTIMS (JNT Inventory Management System) is a comprehensive stock and inventory management system built with React and Firebase Firestore. It manages supplier companies, stock arrivals, inventory items, sales transactions, payments, and financial analytics for a trading business.

## System Architecture

### Technology Stack
- **Frontend**: React 19 with React Router for navigation
- **Backend**: Firebase Firestore (NoSQL database)
- **Styling**: CSS modules
- **Charts**: Recharts for analytics visualization
- **Build Tool**: Vite

### Database Structure (Firestore)

#### Root Collections
```
companies/
├── {companyId}/
│   ├── arrivalDates/
│   │   └── {dateId}/
│   │       └── stockItems/
│   └── payments/
sales/
totals/
```

#### Document Structures

**companies/{companyId}**
```json
{
  "name": "Company Name",
  "date": "10-2-25",
  "totalPayable": 150000.00,
  "cumulativePaid": 50000.00,
  "createdAt": "2025-02-10T10:00:00Z"
}
```

**companies/{companyId}/arrivalDates/{dateId}**
```json
{
  "date": "2025-02-15",
  "amount": 50000.00,
  "status": "Active", // "Active" or "Sold"
  "timestamp": "2025-02-15T09:00:00Z"
}
```

**companies/{companyId}/arrivalDates/{dateId}/stockItems/{itemId}**
```json
{
  "name": "Product Name",
  "boxes": 10,
  "unitsPerBox": 50,
  "units": 500,
  "sold": 150,
  "gst": 18,
  "boxPrice": 1000.00,
  "boxPriceWithGst": 1180.00,
  "totalCostWithoutGst": 10000.00,
  "totalCostWithGst": 11800.00,
  "perUnitWithoutGst": 20.00,
  "perUnitWithGst": 23.60,
  "sellingPrice": 25.00,
  "timestamp": "2025-02-15T09:00:00Z"
}
```

**companies/{companyId}/payments/{paymentId}**
```json
{
  "checkNumber": "CHK001234",
  "amountPaid": 25000.00,
  "timestamp": "2025-02-20T14:30:00Z"
}
```

**sales/{saleId}**
```json
{
  "companyId": "company123",
  "itemId": "item456",
  "itemName": "Product Name",
  "unitsSold": 25,
  "revenue": 625.00,
  "profit": 37.50,
  "date": "2025-02-20",
  "timestamp": "2025-02-20T14:30:00Z"
}
```

## Core Workflows

### 1. Company Management

#### Adding a New Company
1. **Location**: Home → All Companies → "+" button
2. **Process**:
   - Click "+" button to open modal
   - Enter company name
   - Submit form
3. **Data Storage**:
   - Creates document in `companies` collection
   - Fields: `name`, `createdAt`
4. **Validation**: Company name cannot be empty

#### Deleting a Company
1. **Location**: Home → All Companies → Company card → Delete icon
2. **Process**:
   - Click delete icon on company card
   - System automatically deletes all related data
3. **Cascade Deletion**:
   - Deletes `companies/{companyId}/payments` collection
   - Deletes `companies/{companyId}/arrivalDates` collection (including all subcollections)
   - Deletes `companies/{companyId}` document
4. **UI Update**: Company removed from list immediately

### 2. Stock Arrival Management

#### Adding Stock Arrival Date
1. **Location**: Home → Company → Stock Arrival Dates
2. **Process**:
   - Click "+" button to show form
   - Enter date and amount
   - Submit
3. **Calculations**:
   - Amount is the total cost for this stock arrival
4. **Data Storage**:
   - Creates document in `companies/{companyId}/arrivalDates`
   - Fields: `date`, `amount`, `status: "Active"`, `timestamp`
5. **Company Balance Update**:
   - Increments `companies/{companyId}.totalPayable` by the amount
6. **Validation**: Date and amount required

#### Managing Stock Status
1. **Toggle Active/Sold**:
   - Click "Mark Sold" to change status to "Sold"
   - Click "Restock" to change status to "Active"
2. **Automatic Status Change**:
   - When all items in a date are sold out, status automatically changes to "Sold"

#### Deleting Stock Arrival
1. **Process**:
   - Deletes all `stockItems` subcollection first
   - Then deletes the `arrivalDates` document
2. **No Balance Update**: Deleting arrival doesn't affect totalPayable

### 3. Stock Item Management

#### Adding Stock Items
1. **Location**: Home → Company → Date → Stock Items
2. **Process**:
   - Click "+" button to open modal
   - Fill form: Product Name, Boxes, Units per Box, Box Price, GST %, Selling Price
3. **Real-time Calculations** (Preview shown):
   - `boxPriceWithGst = boxPrice + (boxPrice * gst / 100)`
   - `perUnitWithoutGst = boxPrice / unitsPerBox`
   - `perUnitWithGst = boxPriceWithGst / unitsPerBox`
4. **Final Calculations on Save**:
   - `totalUnits = boxes * unitsPerBox`
   - `totalCostWithoutGst = boxPrice * boxes`
   - `totalCostWithGst = boxPriceWithGst * boxes`
   - `perUnitWithoutGst = totalCostWithoutGst / totalUnits`
   - `perUnitWithGst = totalCostWithGst / totalUnits`
5. **Data Storage**:
   - Creates document in `companies/{companyId}/arrivalDates/{dateId}/stockItems`
   - All calculated fields stored for performance

#### Selling Stock Items
1. **Location**: Stock Items page or Sold page
2. **Process**:
   - Enter units to sell (max = remaining units)
   - Click "Sold" button
3. **Validation**:
   - Cannot sell more than available units
4. **Updates**:
   - Increments `sold` field in item document
   - Adds record to global `sales` collection
   - Calculates revenue: `sellingPrice * unitsSold`
   - Calculates profit: `(sellingPrice - perUnitWithGst) * unitsSold`
5. **Automatic Status Check**:
   - If all items in date are sold (sold >= units), marks arrival date as "Sold"

#### Item Details Display
Shows comprehensive breakdown:
- Box calculations
- Unit calculations
- GST breakdown
- Revenue and profit per item
- Remaining stock

### 4. Payment Management

#### Recording Payments
1. **Location**: Bills → Select Company → Payments Details
2. **Process**:
   - Enter check number and amount paid
   - Submit
3. **Validation**:
   - Amount cannot exceed remaining balance
4. **Updates**:
   - Creates document in `companies/{companyId}/payments`
   - Increments `companies/{companyId}.cumulativePaid`
5. **Balance Calculation**:
   - `remainingBalance = totalPayable - cumulativePaid`

#### Manual Amount Addition
1. **Process**: Add extra amounts to payable (for adjustments)
2. **Effect**: Increases totalPayable without creating stock records

#### Payment Management
- **Delete Payment**: Removes payment record and reduces cumulativePaid
- **Restore Payment**: Deletes payment but allows re-entry (for corrections)

### 5. Analytics and Reporting

#### Monthly Report
1. **Location**: Dashboard → Monthly Report
2. **Data Sources**:
   - `sales` collection for revenue/profit by month
   - All companies and stock items for inventory stats
3. **Calculations**:
   - Monthly revenue and profit aggregation
   - Stock varieties count (unique items with remaining stock > 0)
   - Total units in stock
   - Sales count this month
4. **Display**: Monthly breakdown with toggle for sales details

#### Monthly Sales Analysis
1. **Location**: Dashboard → Monthly Sales
2. **Features**:
   - Interactive month navigation
   - Revenue, profit, sales count comparison
   - Percentage changes vs previous month
   - Profit margin calculations
3. **Charts**: Bar charts for revenue, profit, sales count

#### Stock Statistics
- Real-time inventory counts
- Company-wise stock breakdown
- In-stock vs out-of-stock filtering

### 6. Global Sales Management

#### All Stock Items View
1. **Location**: Sold page
2. **Features**:
   - View all items across all companies
   - Filter by company or stock status
   - Sell items directly from this view
3. **Updates**: Same as individual item selling, plus global totals

#### Global Totals
- `totals/global` collection tracks total revenue and profit
- Updated on every sale transaction

## Calculation Formulas

### GST Calculations
```
boxPriceWithGst = boxPrice + (boxPrice × gst ÷ 100)
perUnitWithGst = boxPriceWithGst ÷ unitsPerBox
perUnitWithoutGst = boxPrice ÷ unitsPerBox
```

### Profit Calculations
```
revenue = sellingPrice × unitsSold
profit = (sellingPrice - perUnitWithGst) × unitsSold
```

### Balance Calculations
```
remainingBalance = totalPayable - cumulativePaid
totalPayable = Σ(amount from all arrivalDates)
```

### Stock Status
```
availableUnits = totalUnits - sold
status = "Sold" if availableUnits = 0, else "Active"
```

## Data Flow Patterns

### Stock Purchase Flow
1. Add Company
2. Add Arrival Date (increases payable)
3. Add Stock Items (detailed inventory)
4. Items become available for sale

### Sales Flow
1. Sell units from items
2. Update item sold count
3. Record sale in global collection
4. Update global totals
5. Check if date should be marked sold

### Payment Flow
1. Record payment against company
2. Update cumulative paid
3. Recalculate remaining balance
4. Track payment history

### Analytics Flow
1. Aggregate sales data by month
2. Calculate inventory statistics
3. Generate comparative reports
4. Display interactive charts

## Error Handling and Validation

- Form validation for required fields
- Numeric input validation
- Business logic validation (can't sell more than available)
- Firebase error handling with user alerts
- Optimistic UI updates with rollback on failure

## Performance Considerations

- Real-time calculations cached in database
- Efficient queries with Firestore indexes
- Batch operations for deletions
- Lazy loading of large datasets
- Optimistic updates for better UX

## Security and Data Integrity

- Client-side validation
- Firebase security rules (assumed configured)
- Cascade deletions maintain referential integrity
- Transaction-like updates for financial data
- Timestamp tracking for audit trails