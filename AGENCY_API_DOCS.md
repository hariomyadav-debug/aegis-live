# Agency & Host API Documentation

Complete CRUD and operations APIs for Agency and Agency_user management system translated from PHP to Node.js.

## Base URL
```
/api/agency
```

---

## 📋 AGENCY MANAGEMENT APIs

### Create Agency
```
POST /api/agency/create
Body: {
  "name": "Agency Name",
  "full_name": "Full Agency Name",
  "badge": "badge_url",
  "trading_balance": 1000,
  "country": "USA",
  "whatsapp_number": "+1234567890",
  "briefing": "Description"
}
Response: { id, name, state, user_id, ... }
```

### Get Agencies (List)
```
POST /api/agency/list
Body: {
  "page": 1,
  "pageSize": 10,
  "state": 1,        // 0=pending, 1=approved, 2=rejected
  "country": "USA"
}
Response: { Records: [...], Pagination: {...} }
```

### Get Agency by ID
```
GET /api/agency/:id
Response: { id, name, user_id, state, ... }
```

### Update Agency
```
PUT /api/agency/:id
Body: { name, full_name, country, state, ... }
Response: { updated agency object }
```

### Delete Agency
```
DELETE /api/agency/:id
Response: { success: true }
```

### Search Agencies
```
POST /api/agency/search
Body: { "searchTerm": "search text", "page": 1, "pageSize": 10 }
Response: { Records: [...], Pagination: {...} }
```

### Approve Agency
```
POST /api/agency/:id/approve
Body: { "reason": "optional" }
Response: { approved agency object }
```

### Reject Agency
```
POST /api/agency/:id/reject
Body: { "reason": "rejection reason" }
Response: { rejected agency object }
```

---

## 💰 AGENCY OPERATIONS APIs

### Get Agency Home Dashboard
```
POST /api/agency/home
Body: { "user_id": 123 }
Response: { 
  agency: { ... },
  user: { user_id, full_name, profile_pic }
}
```

### Get Agency Wallet
```
POST /api/agency/wallet
Body: { "user_id": 123 }
Response: {
  user: { user_id, full_name, money, coin },
  agency: { ... }
}
```

### Transfer Money to User
```
POST /api/agency/transfer
Auth: Required
Body: { "to_user_id": 456, "amount": 100 }
Response: { transfer record with status }
```

### Get Transfer History
```
POST /api/agency/transfer-history
Auth: Required
Body: { "page": 1, "pageSize": 50 }
Response: { Records: [...], Pagination: {...} }
```

### Exchange Money for Coins
```
POST /api/agency/exchange
Auth: Required
Body: { "amount": 100 }
Response: {
  exchange: { ... },
  coins_earned: 9500,
  rate: 9500
}
```

### Get Exchange History
```
POST /api/agency/exchange-history
Auth: Required
Body: { "page": 1, "pageSize": 50 }
Response: { Records: [...], Pagination: {...} }
```

### Request Withdrawal
```
POST /api/agency/withdrawal-request
Auth: Required
Body: {
  "amount": 100,
  "type": 1,           // 1=Bank, 2=USDT
  "account_bank": "Bank Name",
  "account": "Account Number",
  "ifcs": "IFCS Code",
  "name": "Account Holder"
}
Response: { withdrawal record }
```

### Get Withdrawal History
```
POST /api/agency/withdrawal-history
Auth: Required
Body: { "page": 1, "pageSize": 50, "status": 0 }
Response: { Records: [...], Pagination: {...} }
```

---

## 👥 AGENCY USER/HOST ROUTES

### Create Agency User/Host
```
POST /api/agency/user/create
Body: {
  "user_id": 456,
  "agency_id": 123,
  "reason": "optional",
  "divide_agency": 30
}
Response: { agency_user record }
```

### Get Agency Users (List)
```
POST /api/agency/user/list
Body: {
  "page": 1,
  "pageSize": 10,
  "agency_id": 123,
  "state": 1
}
Response: { Records: [...], Pagination: {...} }
```

### Get Agency User by ID
```
GET /api/agency/user/:id
Response: { agency_user with related user info }
```

### Update Agency User
```
PUT /api/agency/user/:id
Body: { "state": 1, "divide_agency": 40 }
Response: { updated agency_user }
```

### Delete Agency User
```
DELETE /api/agency/user/:id
Response: { success: true }
```

### Get Users by Agency ID
```
POST /api/agency/user/by-agency
Body: { "agency_id": 123, "page": 1, "pageSize": 20, "state": 1 }
Response: { Records: [...], Pagination: {...} }
```

### Approve Agency User
```
POST /api/agency/user/:id/approve
Body: { "reason": "optional" }
Response: { approved agency_user }
```

### Reject Agency User
```
POST /api/agency/user/:id/reject
Body: { "reason": "rejection reason" }
Response: { rejected agency_user }
```

---

## 🏠 HOST/TEAM MANAGEMENT APIs

### Get Host Dashboard
```
POST /api/agency/host/dashboard
Auth: Required
Body: { "agency_id": 123 }
Response: {
  host_info: { ... },
  agency: { ... },
  user: { ... }
}
```

### Get Team Members
```
POST /api/agency/:agency_id/members
Auth: Required
Body: { "page": 1, "pageSize": 20, "state": 1 }
Response: { Records: [...], Pagination: {...} }
```

### Remove Member from Agency
```
POST /api/agency/:agency_id/member/:member_id/remove
Auth: Required
Response: { success: true }
```

### Get Member Statistics
```
POST /api/agency/:agency_id/member/:member_id/stats
Auth: Required
Body: { "start_date": "2024-01-01", "end_date": "2024-01-31" }
Response: { total_votes, commission, salary }
```

### Update Member Commission
```
POST /api/agency/:agency_id/member/:member_id/commission
Auth: Required
Body: { "divide_agency": 35 }
Response: { updated member with new commission }
```

### Apply as Host to Agency
```
POST /api/agency/apply-as-host
Auth: Required
Body: { "agency_id": 123, "reason": "optional" }
Response: { application record }
```

### Search Available Agencies
```
POST /api/agency/search-available
Auth: Required
Body: { "search_term": "agency name", "page": 1, "pageSize": 20 }
Response: { Records: [...], Pagination: {...} }
```

---

## 📧 INVITATION/REQUEST APIs

### Send Host Invitation
```
POST /api/agency/invite/send-to-host
Auth: Required
Body: { "agency_id": 123, "host_user_id": 456, "message": "optional" }
Response: { invitation record }
```

### Get My Invitations
```
POST /api/agency/invite/my-invitations
Auth: Required
Body: { "page": 1, "pageSize": 20 }
Response: { Records: [...], Pagination: {...} }
```

### Accept Invitation
```
POST /api/agency/invite/:invitation_id/accept
Auth: Required
Response: { 
  invitation: { ... },
  agency_user: { ... }
}
```

### Reject Invitation
```
POST /api/agency/invite/:invitation_id/reject
Auth: Required
Response: { updated invitation with status=2 }
```

### Get Pending Invitations (Agency Owner)
```
POST /api/agency/:agency_id/invitations/pending
Auth: Required
Response: { invitations: [...] }
```

### Cancel Invitation
```
DELETE /api/agency/invite/:invitation_id
Auth: Required
Response: { success: true }
```

---

## ✅ Authentication

All protected endpoints require:
- **Authorization Header**: `Authorization: Bearer {token}`
- Token validated via `authMiddleware`
- User ID extracted from `req.authData.user_id`

---

## 📊 State Values

### Agency States
- `0` = Pending (审核中)
- `1` = Approved (审核通过)
- `2` = Rejected (审核失败)
- `3` = Family Dissolved

### Agency User States
- `0` = Pending
- `1` = Approved
- `2` = Active
- `3` = Inactive

### Invitation States
- `0` = Pending
- `1` = Accepted
- `2` = Rejected

### Withdrawal States
- `0` = Pending
- `1` = Success
- `2` = Failed/Rejected

---

## 📁 File Structure

```
src/
├── controller/
│   └── agency_controller/
│       ├── agency.controller.js          # Basic CRUD
│       ├── agency_user.controller.js     # Host management
│       ├── agency_operations.controller.js   # Transfer, exchange, withdrawal
│       ├── agency_host.controller.js     # Host operations
│       └── agency_invitation.controller.js   # Invitations
├── service/
│   └── repository/
│       ├── Agency.service.js
│       ├── Agency_user.service.js
│       ├── Transfer.service.js
│       ├── Exchange.service.js
│       ├── Withdrawal.service.js
│       └── Invitation.service.js
└── routes/
    └── agency.routes.js                  # All routes
```

---

## 🔄 Example Workflow

### Create and Manage an Agency

1. **Create Agency**
   ```
   POST /api/agency/create
   { name: "My Agency", full_name: "...", ... }
   ```

2. **Send Invitations to Hosts**
   ```
   POST /api/agency/invite/send-to-host
   { agency_id: 1, host_user_id: 456 }
   ```

3. **Hosts Accept Invitations**
   ```
   POST /api/agency/invite/1/accept
   ```

4. **View Team Members**
   ```
   POST /api/agency/1/members
   ```

5. **Manage Transfers/Exchanges**
   ```
   POST /api/agency/transfer
   POST /api/agency/exchange
   ```

6. **Request Withdrawal**
   ```
   POST /api/agency/withdrawal-request
   ```

---

## ❗ Error Handling

All endpoints return standardized responses:

```json
{
  "status": true/false,
  "data": {},
  "message": "Error description",
  "toast": true/false
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `403` - Forbidden/Access Denied
- `404` - Not Found
- `500` - Internal Server Error

---

**Last Updated**: February 2026
**API Version**: 1.0
