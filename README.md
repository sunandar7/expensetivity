# Expensetivity - Expense & Wallet Tracker

A full-stack multi-currency expense tracking and wallet management application built with React.js and Node.js. It features multi-currency auto-conversion, daily exchange rate synchronization, wallet tracking, monthly budget planning, receipt uploads, and visual analytics dashboards.

---

## Features

- **User Authentication**: Secure user registration, login, JWT token authentication, and user profile/base currency settings.
- **Multi-Currency Support**: Support for MMK, USD, JPY, THB, KRW with real-time automatic conversion to the user's base currency.
- **Automated Exchange Rate Sync**: Daily cron job fetching official exchange rates automatically synchronized at 3:30 PM MMT.
- **Wallet Management**: Create and manage multiple accounts/wallets with distinct currencies and balance tracking linked to expenses.
- **Budgeting System**: Set monthly spending limits, view remaining allowance, and monitor budget utilization progress.
- **Expense Tracking**: Add, edit, and delete detailed expense records including category, wallet, payment method, date, notes, and currency.
- **Receipt Uploads**: Attach receipt images or PDF files stored via Cloudinary or local storage.
- **Custom Categories**: Built-in default categories plus user-defined custom categories with customizable color indicators.
- **Dashboard & Analytics**: Overview of total spending, category distribution breakdown (pie chart), and 6-month spending trends (bar chart).
- **Search & Filtering**: Multi-field search, category filter, date range filter, pagination, and sorting (date, amount, name).
- **Theme & Interface**: Responsive design supporting dark and light themes with smooth user interface interactions.

---

## Project Structure

```
expense-tracker/
├── backend/          # Node.js + Express.js + MongoDB API & Cron scheduler
└── frontend/         # React.js + Vite UI frontend application
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- MongoDB (Local instance or MongoDB Atlas cluster)

### 1. Clone & Dependencies Installation

```bash
# Backend Setup
cd backend
cp .env.example .env
# Configure environment variables in backend/.env
npm install

# Frontend Setup
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Environment Variables

**backend/.env**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Application

```bash
# Terminal 1 - Backend Server
cd backend
npm run dev

# Terminal 2 - Frontend Development Server
cd frontend
npm run dev
```

The application will be accessible at **http://localhost:3000** (or **http://localhost:5173**).

---

## API Reference

### Authentication Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Register new user account |
| POST | `/api/auth/login` | No | User login & retrieve JWT token |
| GET | `/api/auth/me` | Yes | Get authenticated user profile |
| PUT | `/api/auth/profile` | Yes | Update user profile & base currency |

### Expense Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/expenses` | Yes | Get paginated list of expenses with filters |
| GET | `/api/expenses/:id` | Yes | Get single expense details |
| POST | `/api/expenses` | Yes | Create expense with optional receipt upload |
| PUT | `/api/expenses/:id` | Yes | Update expense details or receipt |
| DELETE | `/api/expenses/:id` | Yes | Delete expense record |
| GET | `/api/expenses/stats/summary` | Yes | Get spending dashboard summary stats |
| GET | `/api/expenses/convert` | Yes | Convert currency rates |

### Wallet Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/wallets` | Yes | List all user wallets |
| GET | `/api/wallets/:id` | Yes | Get single wallet details |
| POST | `/api/wallets` | Yes | Create new wallet |
| PUT | `/api/wallets/:id` | Yes | Update wallet details |
| DELETE | `/api/wallets/:id` | Yes | Delete wallet |

### Budget Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/budget/current` | Yes | Get current active budget |
| POST | `/api/budget` | Yes | Set or update monthly budget limit |

### Category Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/categories` | Yes | Get default & custom categories |
| POST | `/api/categories` | Yes | Create custom category |
| DELETE | `/api/categories/:id` | Yes | Delete custom category |

### System Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/health` | No | System health check & exchange rate trigger |

---

## Tech Stack

### Frontend
- React 18 + React Router 6
- Vite 5
- Recharts (Data visualization & charts)
- Axios (HTTP Client)
- react-hot-toast (Notifications)
- date-fns (Date utilities)
- Custom CSS Design Tokens

### Backend
- Express.js
- MongoDB + Mongoose ORM
- JWT (jsonwebtoken) & bcryptjs
- Multer & Cloudinary SDK
- node-cron (Automated scheduler)
- express-validator

---

## Default Categories

Food & Dining, Saving, Cosmetic, Transport, Shopping, Healthcare, Entertainment, Bills & Utilities, Education, Other.

Users can also create custom categories with custom color tags.

---

## Security & Reliability

- Password security hashed using bcrypt (12 rounds).
- Protected REST API endpoints using JWT bearer tokens.
- Secure receipt handling limited to 5MB (supported formats: JPG, PNG, WEBP, PDF).
- Isolated per-user data access scoping across all queries.
- CORS policies configured for production & development environments.

