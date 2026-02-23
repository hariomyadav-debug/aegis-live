# Quick Reference - Exchange & Transfer System

## What Was Built

Complete exchange, transfer, and withdrawal system with:
- ✅ 3 new database models (Exchange_record, Transfer, Cash_record)
- ✅ 2 frontend pages (exchange.js, transfer.js)
- ✅ API endpoints for all operations
- ✅ Transaction history tracking
- ✅ Real-time balance management
- ✅ Comprehensive documentation

---

## Files to Deploy

### Backend Services to Upload
```
aegis live/
├── models/
│   ├── Exchange_record.js (NEW)
│   ├── Transfer.js (NEW)
│   ├── Cash_record.js (NEW)
│   └── User.js (MODIFIED - added money field)
│
├── src/
│   ├── service/repository/
│   │   ├── Exchange.service.js (MODIFIED)
│   │   ├── Transfer.service.js (MODIFIED)
│   │   └── Withdrawal.service.js (no changes)
│   │
│   └── controller/agency_controller/
│       └── agency_operations.controller.js (MODIFIED)
│
├── migrations/
│   └── create-exchange-transfer-tables.sql (NEW)
│
├── EXCHANGE_TRANSFER_DOCUMENTATION.md (NEW)
├── SETUP_GUIDE.md (NEW)
└── IMPLEMENTATION_SUMMARY.md (NEW)
```

### Frontend to Upload
```
aegis-live-web/
└── pages/agency/
    ├── exchange.js (MODIFIED - fixed HTTP method)
    └── transfer.js (NEW)
```

---

## Deployment Checklist

### 1. Pre-Deployment ✓
- [ ] Backup current database
- [ ] Test changes in development environment
- [ ] Review all changes with team

### 2. Database Setup ✓
```bash
# Run migration script
mysql -u username -p database_name < migrations/create-exchange-transfer-tables.sql

# Or connect to database and paste SQL commands
```

### 3. Backend Deployment ✓
```bash
# Stop current service
# Copy new model files
# Copy modified service files
# Copy modified controller files
# Restart service
npm run dev
```

### 4. Frontend Deployment ✓
```bash
# Copy exchange.js (fixed version)
# Copy transfer.js (new)
npm run build
npm start
```

### 5. Post-Deployment ✓
- [ ] Verify models load without errors
- [ ] Test each API endpoint
- [ ] Check frontend pages load
- [ ] Verify balance updates
- [ ] Monitor for errors

---

## Quick Test Commands

```bash
# Test Exchange API
curl -X POST http://localhost:3000/api/agency/exchange \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# Test Transfer API
curl -X POST http://localhost:3000/api/agency/transfer \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to_user_id": 456, "amount": 50}'

# Test History
curl -X POST http://localhost:3000/api/agency/exchange-history \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 50}'
```

---

## Environment Variables Needed

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=production
```

---

## Exchange Rates

**Default:** 95 coins per ₹1

To customize:
- Edit: `src/service/repository/Exchange.service.js`
- Function: `getExchangeRate(userId)`

---

## API Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /api/agency/exchange | Exchange money → coins | Yes |
| POST | /api/agency/exchange-history | Get exchange history | Yes |
| POST | /api/agency/transfer | Transfer money to user | Yes |
| POST | /api/agency/transfer-history | Get transfer history | Yes |
| POST | /api/agency/withdrawal-request | Request withdrawal | Yes |
| POST | /api/agency/withdrawal-history | Get withdrawal history | Yes |

---

## Frontend URLs

```
Exchange: http://yoursite.com/agency/exchange?uid=USER_ID&token=TOKEN
Transfer: http://yoursite.com/agency/transfer?uid=USER_ID&token=TOKEN
```

---

## Minimum Amounts

- Exchange: ₹10
- Withdrawal: ₹50

---

## Status Codes

**Exchange:** 0=pending, 1=completed, 2=cancelled
**Transfer:** 0=pending, 1=completed, 2=cancelled, 3=failed
**Withdrawal:** 0=pending, 1=approved, 2=rejected, 3=completed, 4=failed

---

## Key Fields in Database

### Exchange_records
- user_id: Who exchanged
- cash_amount: ₹ given
- coin_amount: Coins received
- exchange_rate: Rate used
- status: Current state
- add_time: When created

### Transfers
- from_user_id: Who sent
- to_user_id: Who received
- amount: How much
- closing: Sender's balance after
- ip: Audit trail
- status: Current state

### Cash_records
- user_id: Who requested
- amount: How much
- order_number: Unique ID
- status: Approval status
- account_*: Bank details

---

## Troubleshooting

**Models not loading?**
- Check models are in `/models` directory
- Check file extensions are `.js`
- Restart Node.js server

**Foreign key errors?**
- Run migration script first
- Check user_id/agency_id exist before transferring

**Balance not updating?**
- Verify User model has `money` field added
- Check service functions are being called
- Monitor console for errors

**API returns 401?**
- Check Bearer token is valid
- Verify authMiddleware is applied
- Check token hasn't expired

---

## Documentation Files

1. **EXCHANGE_TRANSFER_DOCUMENTATION.md** - Full API reference
2. **SETUP_GUIDE.md** - Detailed setup instructions
3. **IMPLEMENTATION_SUMMARY.md** - Complete file list and changes

---

## Success Indicators

✅ Models load without errors
✅ Tables created in database
✅ Exchange request returns coins
✅ Transfer updates both user balances
✅ History pages show transactions
✅ Errors display user-friendly messages
✅ Balance updates reflect in agency home

---

**Ready to deploy!**
