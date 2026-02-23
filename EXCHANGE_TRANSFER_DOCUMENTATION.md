# Exchange and Transfer System Documentation

## Overview
This documentation covers the Exchange, Transfer, and Withdrawal systems for the Aegis Live Agency platform.

## Database Tables

### 1. Exchange_records Table
Stores all currency exchange transactions (Money → Coins)

**Fields:**
- `id` (INT) - Primary key, auto increment
- `user_id` (INT) - User performing exchange (Foreign Key: Users.user_id)
- `uid` (VARCHAR) - User identifier
- `cash_amount` (BIGINT) - Money amount provided
- `coin_amount` (BIGINT) - Coins received
- `exchange_rate` (DECIMAL) - Rate used (default 95 coins per ₹1)
- `votes` (INT) - Voting/ranking value
- `order_no` (VARCHAR) - Order reference number
- `trade_no` (VARCHAR) - Trade reference number
- `status` (SMALLINT) - 0=pending, 1=completed, 2=cancelled
- `add_time` (BIGINT) - Creation timestamp (epoch)
- `uptime` (BIGINT) - Update timestamp (epoch)

**SQL Migration:**
See `migrations/create-exchange-transfer-tables.sql`

---

### 2. Transfers Table
Stores all money transfer transactions between users

**Fields:**
- `id` (INT) - Primary key, auto increment
- `from_user_id` (INT) - Sender user ID (FK: Users)
- `to_user_id` (INT) - Recipient user ID (FK: Users)
- `touid` (VARCHAR) - Recipient identifier
- `agency_id` (INT) - Associated agency (Optional FK: Agencies)
- `agency` (VARCHAR) - Agency name/identifier
- `amount` (BIGINT) - Transfer amount
- `coin` (BIGINT) - Alias for amount
- `closing` (BIGINT) - Sender's balance after transfer
- `Balance` (BIGINT) - Alias for closing balance
- `status` (SMALLINT) - 0=pending, 1=completed, 2=cancelled, 3=failed
- `add_time` (BIGINT) - Creation timestamp
- `uptime` (BIGINT) - Update timestamp
- `ip` (VARCHAR) - Client IP address
- `description` (TEXT) - Optional notes

**Indexes:**
- `from_user_id`, `to_user_id`, `agency_id`, `status`, `add_time`

---

### 3. Cash_records Table
Stores withdrawal requests from users

**Fields:**
- `id` (INT) - Primary key
- `user_id` (INT) - User requesting withdrawal (FK: Users)
- `amount` (BIGINT) - Withdrawal amount
- `order_number` (VARCHAR) - Unique order reference
- `status` (SMALLINT) - 0=pending, 1=approved, 2=rejected, 3=completed, 4=failed
- `type` (SMALLINT) - 1=bank, 2=wallet, 3=other
- `account_bank` (VARCHAR) - Bank name
- `account` (VARCHAR) - Account number
- `ifcs` (VARCHAR) - IFSC code (India)
- `name` (VARCHAR) - Account holder name
- `add_time` (BIGINT) - Request time
- `up_time` (BIGINT) - Last update time
- `reason` (TEXT) - Rejection reason

---

## API Endpoints

### Exchange Endpoints

#### POST `/api/agency/exchange`
Exchange money for coins

**Request Body:**
```json
{
  "amount": 100
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "exchange": { /* exchange record */ },
    "coins_earned": 9500,
    "rate": 95
  },
  "message": "Exchange completed successfully"
}
```

**Error Cases:**
- Missing amount
- Invalid amount (< ₹10)
- Insufficient balance

---

#### POST `/api/agency/exchange-history`
Get user's exchange history

**Request Body:**
```json
{
  "page": 1,
  "pageSize": 50
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "Records": [
      {
        "id": 1,
        "user_id": 123,
        "cash_amount": 100,
        "coin_amount": 9500,
        "exchange_rate": 95,
        "status": 1,
        "add_time": 1708340000
      }
    ],
    "Pagination": {
      "total_pages": 1,
      "total_records": 5,
      "current_page": 1,
      "records_per_page": 50
    }
  }
}
```

---

### Transfer Endpoints

#### POST `/api/agency/transfer`
Transfer money to another user

**Request Body:**
```json
{
  "to_user_id": 456,
  "amount": 50
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "transfer": {
      "id": 1,
      "from_user_id": 123,
      "to_user_id": 456,
      "amount": 50,
      "closing": 950,
      "status": 1,
      "add_time": 1708340000
    }
  },
  "message": "Transfer completed successfully"
}
```

**Error Cases:**
- Missing to_user_id or amount
- Invalid amount
- Insufficient balance
- Recipient not found

---

#### POST `/api/agency/transfer-history`
Get transfer history (sent and received)

**Request Body:**
```json
{
  "page": 1,
  "pageSize": 50
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "Records": [
      {
        "id": 1,
        "from_user_id": 123,
        "to_user_id": 456,
        "amount": 50,
        "closing": 950,
        "status": 1,
        "add_time": 1708340000,
        "agency_user": { /* sender info */ },
        "to_user": { /* recipient info */ }
      }
    ],
    "Pagination": { /* pagination info */ }
  }
}
```

---

### Withdrawal Endpoints

#### POST `/api/agency/withdrawal-request`
Request a withdrawal

**Request Body:**
```json
{
  "amount": 100,
  "type": 1,
  "account_bank": "HDFC",
  "account": "1234567890",
  "ifcs": "HDFC0001234",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "amount": 100,
    "order_number": "123_1708340000123",
    "status": 0,
    "add_time": 1708340000
  },
  "message": "Withdrawal request submitted successfully"
}
```

**Validation:**
- Minimum amount: ₹50
- Pending withdrawals affect available balance

---

#### POST `/api/agency/withdrawal-history`
Get withdrawal history

**Request Body:**
```json
{
  "page": 1,
  "pageSize": 50,
  "status": null
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "Records": [
      {
        "id": 1,
        "user_id": 123,
        "amount": 100,
        "status": 0,
        "order_number": "123_1708340000123",
        "add_time": 1708340000
      }
    ],
    "Pagination": { /* pagination info */ }
  }
}
```

---

## Frontend Pages

### Exchange Page
**Path:** `/pages/agency/exchange.js`

**Features:**
- Exchange money for coins
- View exchange rate (95 coins per ₹1)
- Toggle exchange history
- Real-time balance display
- Confirmation dialog

**Integration:**
- Fetches agency data from `/api/agency/home`
- Calls `/api/agency/exchange` to process exchange
- Calls `/api/agency/exchange-history` to load history

---

### Transfer Page
**Path:** `/pages/agency/transfer.js`

**Features:**
- Transfer money to another user
- Recipient UID/ID input
- Amount input with validation
- View transfer history (sent and received)
- Status indicators (Completed, Pending, Failed)
- Real-time balance display

**Integration:**
- Fetches agency data from `/api/agency/home`
- Calls `/api/agency/transfer` to process transfer
- Calls `/api/agency/transfer-history` to load history

---

## Exchange Rate Configuration

Default exchange rate: **95 coins per ₹1**

The rate can be customized in `Exchange.service.js`:
```javascript
async function getExchangeRate(userId) {
    const agency = await Agency.findOne({
        where: { user_id: userId, state: 1 }
    });
    
    if (agency) {
        return 9500; // Premium rate
    }
    
    return 100; // Regular rate (1 coin per ₹0.01)
}
```

---

## Database Schema Notes

1. All timestamp fields use **Epoch time** (seconds since 1970)
   - Use `Math.floor(Date.now() / 1000)` in Node.js
   - Convert to Date: `new Date(epochTime * 1000)`

2. Money and coin amounts use **BIGINT** to support large numbers

3. Status codes are standardized:
   - Exchanges: 0=pending, 1=completed, 2=cancelled
   - Transfers: 0=pending, 1=completed, 2=cancelled, 3=failed
   - Withdrawals: 0=pending, 1=approved, 2=rejected, 3=completed, 4=failed

4. Foreign key constraints ensure referential integrity

5. Indexes on frequently queried columns for performance

---

## User Balance Management

### Available balance calculation:
```javascript
availableBalance = user.money - pendingWithdrawalAmount
```

### Money flow:
- **Exchange:** Money decreases, Coins increase
- **Transfer:** Money decreases for sender, increases for recipient
- **Withdrawal:** Money reserved until completed/rejected

---

## Implementation Checklist

- [x] Create Exchange_record model
- [x] Create Transfer model
- [x] Create Cash_record model
- [x] Create/Update Exchange service
- [x] Create/Update Transfer service
- [x] Create Withdrawal service
- [x] Create/Update Agency operations controller
- [x] Create Exchange page component
- [x] Create Transfer page component
- [ ] Run database migrations (see SQL file)
- [ ] Test all API endpoints
- [ ] Configure environment variables

---

## Notes

1. The system automatically deducts money from user and updates balances
2. All transactions are logged in respective tables
3. Support for multiple withdrawal types (bank, wallet, etc.)
4. IP addresses are captured for audit trails
5. Timestamps use epoch format for consistency
