# Exchange & Transfer System - Setup Guide

## Overview
Complete setup instructions for implementing the Exchange, Transfer, and Withdrawal systems in Aegis Live.

## Files Created/Modified

### 1. Models Created
- **[models/Exchange_record.js](models/Exchange_record.js)** - Exchange transaction records
- **[models/Transfer.js](models/Transfer.js)** - Money transfer between users
- **[models/Cash_record.js](models/Cash_record.js)** - Withdrawal request records

### 2. Models Modified
- **[models/User.js](models/User.js)** - Added `money` field for transaction balance

### 3. Services Modified
- **[src/service/repository/Exchange.service.js](src/service/repository/Exchange.service.js)** - Enhanced with user balance updates
- **[src/service/repository/Transfer.service.js](src/service/repository/Transfer.service.js)** - Enhanced with balance management
- **[src/service/repository/Withdrawal.service.js](src/service/repository/Withdrawal.service.js)** - Already complete

### 4. Controllers Modified
- **[src/controller/agency_controller/agency_operations.controller.js](src/controller/agency_controller/agency_operations.controller.js)** - Updated exchange and transfer handlers

### 5. Frontend Components Created
- **[pages/agency/exchange.js](../aegis-live-web/pages/agency/exchange.js)** - Exchange page (Fixed HTTP method)
- **[pages/agency/transfer.js](../aegis-live-web/pages/agency/transfer.js)** - Transfer page (New)

### 6. Documentation
- **[EXCHANGE_TRANSFER_DOCUMENTATION.md](EXCHANGE_TRANSFER_DOCUMENTATION.md)** - Complete API documentation
- **[migrations/create-exchange-transfer-tables.sql](migrations/create-exchange-transfer-tables.sql)** - Database creation script

---

## Setup Instructions

### Step 1: Database Migration

Run the SQL migration script to create the required tables:

```bash
# Using MySQL command line
mysql -u your_username -p your_database < migrations/create-exchange-transfer-tables.sql

# Or execute the SQL within your database management tool
```

**The migration creates:**
1. `Exchange_records` table
2. `Transfers` table
3. `Cash_records` table (for withdrawals)
4. Adds `money` and `available_coins` columns to Users table

---

### Step 2: Verify Models are Loaded

Models are auto-loaded by Sequelize from the `/models` directory. Verify that the new models are recognized:

```bash
cd "d:\filezilla\aegis live"
npm run dev
```

Check the console logs to ensure no model loading errors occur.

---

### Step 3: Test API Endpoints

Use Postman or curl to test the endpoints. Include valid authorization token:

#### Test Exchange API
```bash
curl -X POST http://localhost:3000/api/agency/exchange \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100}'
```

#### Test Transfer API
```bash
curl -X POST http://localhost:3000/api/agency/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"to_user_id": 456, "amount": 50}'
```

#### Test History APIs
```bash
# Exchange history
curl -X POST http://localhost:3000/api/agency/exchange-history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"page": 1, "pageSize": 50}'

# Transfer history
curl -X POST http://localhost:3000/api/agency/transfer-history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"page": 1, "pageSize": 50}'
```

---

### Step 4: Frontend Integration

The frontend pages automatically integrate with the backend:

#### Access Exchange Page
```
http://localhost:3000/agency/exchange?uid=USER_ID&token=AUTH_TOKEN
```

#### Access Transfer Page
```
http://localhost:3000/agency/transfer?uid=USER_ID&token=AUTH_TOKEN
```

---

### Step 5: Environment Variables

Ensure these are set in your .env file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

---

## Key Features Implemented

### 1. Exchange System
- ✅ Money to Coins conversion
- ✅ Configurable exchange rate (default: 95 coins per ₹1)
- ✅ User balance updates
- ✅ Transaction history with pagination
- ✅ Minimum amount validation (₹10)

### 2. Transfer System
- ✅ User to User money transfer
- ✅ Automatic balance deduction/addition
- ✅ Recipient validation
- ✅ IP address logging
- ✅ Transaction history with status
- ✅ Balance tracking (closing balance)

### 3. Withdrawal System
- ✅ Withdrawal requests with status tracking
- ✅ Bank account information storage
- ✅ Minimum amount validation (₹50)
- ✅ Multiple withdrawal types (bank, wallet, etc.)
- ✅ Order number generation
- ✅ Pending amount calculation

---

## Database Schema

### Exchange_records
```sql
- id (PK)
- user_id (FK)
- cash_amount (₹)
- coin_amount (coins)
- exchange_rate
- status (0=pending, 1=completed, 2=cancelled)
- add_time (epoch)
```

### Transfers
```sql
- id (PK)
- from_user_id (FK)
- to_user_id (FK)
- amount
- closing (balance after transfer)
- status (0=pending, 1=completed, 2=cancelled, 3=failed)
- ip (audit)
- add_time (epoch)
```

### Cash_records
```sql
- id (PK)
- user_id (FK)
- amount
- order_number (unique)
- status (0=pending, 1=approved, 2=rejected, 3=completed, 4=failed)
- account_bank, account, ifcs (withdrawal details)
- add_time (epoch)
```

---

## Exchange Rate Configuration

Edit the `getExchangeRate()` function in `Exchange.service.js` to customize rates:

```javascript
async function getExchangeRate(userId) {
    // Check if user is premium/agency owner
    const agency = await Agency.findOne({
        where: { user_id: userId, state: 1 }
    });
    
    if (agency) {
        return 100;  // Premium: 100 coins per ₹1
    }
    
    return 95;       // Regular: 95 coins per ₹1
}
```

---

## API Response Structure

All APIs follow this standard response format:

```json
{
  "status": true,
  "data": {
    "key": "value"
  },
  "message": "Success message",
  "success": true,
  "error": false
}
```

Error Response:
```json
{
  "status": false,
  "data": {},
  "message": "Error description",
  "success": false,
  "error": true
}
```

---

## Error Handling

### Exchange Errors
- `"Amount not entered"` - Missing amount
- `"Amount not number"` - Invalid amount format
- `"Minimum amount should be ₹10"` - Amount too low
- `"Insufficient balance"` - Not enough money

### Transfer Errors
- `"Missing required fields"` - Missing to_user_id or amount
- `"Amount must be a positive integer"` - Invalid amount
- `"Insufficient balance"` - Not enough funds
- `"Recipient not found"` - Invalid to_user_id

### Withdrawal Errors
- `"Invalid amount"` - Amount <= 0
- `"Minimum amount ₹50"` - Below minimum
- `"Insufficient available balance"` - Accounting for pending withdrawals

---

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Models loaded without errors
- [ ] Exchange endpoint returns 200 with coins
- [ ] Transfer endpoint updates both user balances
- [ ] Transfer history shows correct records
- [ ] Exchange history displays with correct rate
- [ ] Frontend pages load correctly
- [ ] Balance updates reflect in agency home
- [ ] Withdrawal requests save correctly
- [ ] Error messages display in UI

---

## Troubleshooting

### Models Not Loading
```
Error: Cannot find module '../models'
```
**Solution:** Ensure models are in `/models` directory and have `.js` extension.

### Foreign Key Errors
```
Error: FOREIGN KEY constraint
```
**Solution:** Run migration script before creating records. Ensure foreign key IDs exist.

### Balance Not Updating
```
Solution:** Check that the service functions (deductMoney, addMoney) are being called.
Verify User model has 'money' field.
```

### API Returns 401 Unauthorized
```
Solution:** Verify token in Authorization header is valid and not expired.
Check authMiddleware is applied to routes.
```

---

## Performance Optimization

### Indexes Created
- `Exchange_records.user_id`
- `Transfer.from_user_id`, `to_user_id`
- `Cash_records.user_id`
- `All tables: status, add_time`

### Query Optimization Tips
- Use pagination (pageSize: 50 recommended)
- Filter by date range for large datasets
- Use status filter to narrow results

---

## Security Notes

1. **Always validate amounts** - Done in service layer
2. **IP logging** - Captured for audit trail
3. **User authentication** - Required for all endpoints via authMiddleware
4. **Balance checks** - Prevent overdraft before transaction
5. **Transaction atomicity** - Ensure balance updates succeed together

---

## Future Enhancements

- [ ] Rate limiting on exchanges
- [ ] Daily withdrawal limits
- [ ] Referral bonuses for exchanges
- [ ] Scheduled withdrawal processing
- [ ] Admin dashboard for transaction management
- [ ] Email notifications for transactions
- [ ] Two-factor authentication for large withdrawals
- [ ] Dispute resolution system

---

## Support & Documentation

For complete API documentation, see:
- **[EXCHANGE_TRANSFER_DOCUMENTATION.md](EXCHANGE_TRANSFER_DOCUMENTATION.md)** - Full API reference
- **Agency Routes:** `src/routes/agency.routes.js`
- **Models:** Look in `/models` directory

---

**Last Updated:** February 18, 2026
**System Version:** 1.0
