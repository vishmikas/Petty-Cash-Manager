# 💰 Petty Cash Manager

A full-stack, multi-user **Petty Cash Management System** with role-based access control, real-time balance tracking, expense approval workflows, and analytics — built with the MERN stack.

---

## ✨ Features

### 🔐 Role-Based Access Control
| Role | Capabilities |
|------|-------------|
| **Admin** | Allocate petty cash to employees, manage users & departments, approve/reject expenses |
| **Employee** | Submit expense claims, view personal balance & transaction history |
| **Accountant** | Access full financial reports, analytics dashboards, and export to Excel |

### 💼 Core Functionality
- **Cash Allocation** — Admins distribute petty cash funds to employees by department
- **Expense Submission** — Employees log categorized expenses with descriptions and dates
- **Approval Workflow** — Pending expenses routed to admin for approve/reject with notes
- **Balance Tracking** — Real-time petty cash balance per employee, updated on approval
- **Audit Logging** — Full immutable trail of all system actions
- **Excel Export** — Accountants can export filtered transaction reports (via ExcelJS)
- **Analytics Dashboard** — Spending breakdowns by category, department, and time period

### 🛡️ Security
- JWT-based stateless authentication (Bearer token)
- Password hashing with **bcryptjs**
- Rate limiting (100 req / 15 min per IP) via **express-rate-limit**
- NoSQL injection protection via **express-mongo-sanitize**
- HTTP security headers via **Helmet**
- Graceful shutdown with SIGTERM / SIGINT handling

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| Helmet | HTTP security headers |
| express-rate-limit | API rate limiting |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React | UI framework |
| React Router | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client |
| ExcelJS + FileSaver | Excel report export |
| Lucide React | Icon library |

---

## 📁 Project Structure

```
Petty-Cash-Manager/
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # JWT protect & role authorize middleware
│   │   ├── auditLog.js          # Automatic audit trail logging
│   │   └── errorHandler.js      # Centralised error responses
│   ├── models/
│   │   ├── User.js              # User schema (roles, balance, dept)
│   │   ├── Transaction.js       # Expense & allocation schema
│   │   ├── Department.js        # Department schema
│   │   └── AuditLog.js          # Immutable audit log schema
│   ├── routes/
│   │   ├── auth.js              # Register, login, me, update-password
│   │   ├── users.js             # User CRUD (admin only)
│   │   ├── departments.js       # Department management
│   │   └── transactions.js      # Expenses, allocations, approvals, analytics
│   ├── utils/
│   │   ├── constants.js         # Roles, categories, status codes, messages
│   │   ├── jwt.js               # Token generation helper
│   │   ├── response.js          # Standardised API response helpers
│   │   └── asyncHandler.js      # Async route error wrapper
│   └── server.js                # App entry point, DB connect, middleware setup
│
└── frontend/
    └── src/
        ├── components/
        │   ├── DashboardStats.jsx       # Summary stat cards
        │   ├── EmployeeExpenseForm.jsx  # Expense submission form
        │   ├── FilterPanel.jsx          # Date / category / status filters
        │   ├── TransactionTable.jsx     # Sortable transaction list
        │   ├── Navbar.jsx               # Role-aware navigation bar
        │   └── Toast.jsx                # Notification toasts
        ├── pages/
        │   ├── Login.jsx                # Authentication page
        │   ├── Admindashboard.jsx       # Admin overview & controls
        │   ├── Employeedashboard.jsx    # Employee portal
        │   ├── AccountantDashboard.jsx  # Reports & analytics
        │   ├── ApprovalPage.jsx         # Pending expense review
        │   └── UsersPage.jsx            # User management (admin)
        ├── contexts/
        │   └── AuthContext.js           # Global auth state
        ├── services/
        │   └── api.js                   # Axios instance + interceptors
        └── utils/
            ├── constants.js             # Shared frontend constants
            ├── excelExport.js           # Excel generation logic
            └── helpers.js               # Date, currency, formatting helpers
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login & receive JWT |
| `GET` | `/api/auth/me` | Protected | Get current user |
| `PUT` | `/api/auth/updatepassword` | Protected | Change password |

### Transactions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/transactions` | Protected | List transactions (filtered) |
| `POST` | `/api/transactions` | Employee | Submit an expense |
| `GET` | `/api/transactions/pending` | Admin | List pending approvals |
| `PUT` | `/api/transactions/:id/approve` | Admin | Approve an expense |
| `PUT` | `/api/transactions/:id/reject` | Admin | Reject an expense |
| `GET` | `/api/transactions/analytics` | Protected | Spending analytics |
| `GET` | `/api/transactions/categories/list` | Protected | Get expense categories |

### Users & Departments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/users` | Admin | List all users |
| `POST` | `/api/users` | Admin | Create a user |
| `PUT` | `/api/users/:id` | Admin | Update a user |
| `GET` | `/api/departments` | Protected | List departments |
| `POST` | `/api/departments` | Admin | Create department |

### Health Check
```
GET /api/health
```
Returns server uptime, database connection status, and timestamp.

---

## 💡 Expense Categories

The system supports the following built-in categories:

- 🖊️ Office Supplies
- 🚗 Transportation
- 🍽️ Meals & Entertainment
- 💡 Utilities
- 🔧 Maintenance
- 📦 Miscellaneous
- 📁 General
- 💵 Petty Cash Allocation

---

## 🧪 Testing

Screenshots from manual testing are available in the [`Testing_Results/`](./Testing_Results/) directory, covering the Admin, Employee, and Accountant dashboards.

---

## 👤 Author

**Dilum Samarathunga**


