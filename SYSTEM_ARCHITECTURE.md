# System Architecture - Exchange & Transfer

## Data Flow Diagrams

### 1. Exchange Flow (Money → Coins)

```
User Frontend (exchange.js)
    ↓
    [User enters amount: ₹100]
    ↓
POST /api/agency/exchange
    ↓
Agency Operations Controller
    ├─ Validate amount (min ₹10)
    ├─ Check user balance (₹ >= 100)
    └─ Get exchange rate (95 coins/₹)
    ↓
Exchange Service
    ├─ Update User.money (-100)
    ├─ Update User.available_coins (+9500)
    └─ Create Exchange_record
    ↓
Database
    ├─ Exchange_records (INSERT)
    └─ Users (UPDATE)
    ↓
Response to Frontend
    ├─ coins_earned: 9500
    ├─ exchange_rate: 95
    └─ Show success alert
    ↓
History Page
    └─ Displays transaction with timestamp
```

---

### 2. Transfer Flow (User to User)

```
User Frontend (transfer.js)
    ↓
    [User enters: to_user_id=456, amount=₹50]
    ↓
POST /api/agency/transfer
    ↓
Agency Operations Controller
    ├─ Validate to_user_id exists
    ├─ Validate amount > 0
    └─ Check sender balance (₹ >= 50)
    ↓
Transfer Service
    ├─ Get sender's current balance
    ├─ Deduct from sender: User(123).money -= 50
    ├─ Add to recipient: User(456).money += 50
    └─ Create Transfer_record
         ├─ from_user_id: 123
         ├─ to_user_id: 456
         ├─ amount: 50
         ├─ closing: sender's new balance
         └─ ip: client IP
    ↓
Database
    ├─ Transfers (INSERT)
    └─ Users (UPDATE x2)
    ↓
Response to Frontend
    ├─ transfer: {id, amount, closing...}
    └─ Show success alert
    ↓
History Page
    ├─ Sent transfers (from_user_id = user_id)
    └─ Received transfers (to_user_id = user_id)
```

---

### 3. Withdrawal Flow (Request)

```
User Frontend (withdrawal form)
    ↓
    [User enters: amount=₹100, bank details]
    ↓
POST /api/agency/withdrawal-request
    ↓
Withdrawal Controller
    ├─ Validate amount >= ₹50
    ├─ Get pending withdrawal total
    ├─ Calculate available = money - pending
    └─ Check available >= amount
    ↓
Withdrawal Service
    ├─ Generate unique order_number
    └─ Create Cash_record
         ├─ user_id
         ├─ amount
         ├─ account_bank, account, ifcs
         ├─ status: 0 (pending)
         └─ add_time: now
    ↓
Database
    └─ Cash_records (INSERT)
    ↓
Response to Frontend
    ├─ order_number for tracking
    └─ Show pending status
    ↓
Admin Portal
    ├─ Review withdrawal request
    ├─ Approve or Reject
    └─ Process payment
```

---

## Database Schema Relationships

```
Users (user_id PK)
    │
    ├──┬─→ Exchange_records (user_id FK)
    │  │   Fields: id, user_id, cash_amount, coin_amount, 
    │  │   exchange_rate, status, add_time
    │  │
    ├──┬─→ Transfers (from_user_id & to_user_id FK)
    │  │   Fields: id, from_user_id, to_user_id, amount,
    │  │   closing, status, ip, add_time
    │  │
    └──┬─→ Cash_records (user_id FK)
       │   Fields: id, user_id, amount, order_number,
       │   status, bank_details, add_time
       │
Agencies (id PK)
    │
    └──┬─→ Transfers (agency_id FK, optional)
       │   Used to associate transfer with agency
       │
```

---

## API Response Flowchart

```
Request with Bearer Token
    ↓
authMiddleware
    ├─ Token valid? → Continue
    └─ Invalid? → 401 Unauthorized
    ↓
Specific endpoint handler
    ↓
Input validation
    ├─ Pass? → Query database
    └─ Fail? → Return 400 Bad Request
    ↓
Business logic
    ├─ Success? → Update database
    └─ Fail? → Return 400/500 error
    ↓
Return response
    ├─ Success: {"status": true, "data": {...}, "message": "..."}
    └─ Error: {"status": false, "data": {}, "message": "...error..."}
```

---

## User Balance Calculation

```
Total Money = Incoming transfers + Initial balance + Direct deposits
           = "Add" transactions

Available Money = Total money - Pending withdrawals
                = amount available for exchange/transfer

After Exchange:
    Money -= exchange_amount
    Available_coins += coins_earned

After Transfer (Sender):
    Money -= transfer_amount
    Closing_balance = Money (after deduction)

After Transfer (Receiver):
    Money += transfer_amount
```

---

## Component Interaction

```
Frontend Pages
├── exchange.js
│   ├── Fetches: /api/agency/home (agency data)
│   ├── Calls: /api/agency/exchange (POST)
│   └── Lists: /api/agency/exchange-history (POST)
│
└── transfer.js
    ├── Fetches: /api/agency/home (agency data)
    ├── Calls: /api/agency/transfer (POST)
    └── Lists: /api/agency/transfer-history (POST)

Backend Services
├── Exchange.service.js
│   ├── createExchangeRecord()
│   ├── getExchangeHistory()
│   ├── getExchangeRate()
│   └── calculateCoinsFromCash()
│
├── Transfer.service.js
│   ├── createTransfer()
│   ├── getTransferHistory()
│   └── 
│
└── Withdrawal.service.js
    ├── createWithdrawalRequest()
    └── getWithdrawalHistory()

Database Models
├── Exchange_record (Sequelize)
├── Transfer (Sequelize)
├── Cash_record (Sequelize)
└── User (with money field)
```

---

## Request/Response Cycle

### Exchange Request
```
Frontend:
POST /api/agency/exchange
{
  "amount": 100
}

Backend Processing:
1. Auth check
2. Validate amount >= 10
3. Check user.money >= 100
4. Get rate = 95
5. Calculate coins = 100 * 95 = 9500
6. Update User: money -= 100, available_coins += 9500
7. Create Exchange_record

Response:
{
  "status": true,
  "data": {
    "exchange": {...},
    "coins_earned": 9500,
    "rate": 95
  }
}

Frontend:
- Show success alert
- Clear form
- Refresh history
```

---

### Transfer Request
```
Frontend:
POST /api/agency/transfer
{
  "to_user_id": 456,
  "amount": 50
}

Backend Processing:
1. Auth check
2. Validate to_user_id exists
3. Check fromUser.money >= 50
4. Get fromUser.money value
5. Update User(123): money -= 50
6. Update User(456): money += 50
7. Create Transfer: closing = fromUser.money - 50

Response:
{
  "status": true,
  "data": {
    "transfer": {
      "id": 1,
      "from_user_id": 123,
      "to_user_id": 456,
      "amount": 50,
      "closing": 950
    }
  }
}

Frontend:
- Show success alert
- Clear form
- Refresh history
```

---

## Error Handling Flow

```
User Action
    ↓
Validation Error?
├─ Yes → Show user-friendly message
│           • Invalid amount
│           • Insufficient balance
│           • User not found
└─ No ↓
    ↓
API Request
    ↓
Server Error?
├─ Yes → Log error, return 500 with message
└─ No ↓
    ↓
Database Transaction
    ↓
Transaction Error?
├─ Yes → Rollback, return 500 with message
└─ No ↓
    ↓
Success Response
    └─ Return 200 with data
```

---

## Timestamp Flow

```
Client (JavaScript)
    ├─ Current time: Date.now() (milliseconds)
    └─ Epoch format: Math.floor(Date.now() / 1000)
    ↓
    API Request
    ↓
Server (Node.js)
    └─ Stores: Math.floor(Date.now() / 1000) → Database (BIGINT)
    ↓
    Database
    └─ Stores as: 1708340000 (example)
    ↓
    History Query
    ↓
Client (JavaScript)
    └─ Display: new Date(epochTime * 1000).toLocaleDateString()
```

---

## Concurrency Handling

```
Multiple simultaneous requests from same user:

Request 1: Exchange ₹100
Request 2: Transfer ₹50
Request 3: Withdrawal ₹30

Database Level:
├─ Each request gets current balance
├─ Updates executed sequentially
└─ Final balance = Initial - (100+50+30) = Initial - 180

Frontend:
├─ Each request gets independent response
├─ History refreshed after each
└─ User sees all transactions

Recommended:
├─ Disable buttons during processing
├─ Show loading state
└─ Refresh after each transaction
```

---

## Audit Trail

```
Every transaction stores:
├─ ip: Client IP address
├─ add_time: When created (epoch)
├─ status: Current state
└─ user_id: Who initiated

Enables:
├─ Fraud detection
├─ Dispute resolution
├─ Activity logging
└─ Compliance reporting
```

---

## Performance Path

```
High Volume Scenario:
1000 concurrent users exchanging coins

Database Optimization:
├─ Indexes on: user_id, status, add_time
├─ Batch operations where possible
├─ Connection pooling (default in Sequelize)
└─ Read replicas for history (optional)

Frontend Optimization:
├─ Pagination (50 records per page)
├─ Lazy loading history
├─ Client-side caching
└─ Debounce API calls
```

---

**Visual Reference Complete**
**Ready for implementation!**
