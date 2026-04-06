# 💸 Expensetivity — Myanmar Expense Tracker

A full-stack expense tracking application built with React.js + Node.js, featuring MMK currency support, receipt uploads, and beautiful card view.

---

## ✨ Features

- 🔐 **User Auth** — Register/Login with JWT
- 📊 **Dashboard** — Spending stats, pie chart by category, 6-month bar chart trend
- 💸 **Expense Management** — Add, edit, delete expenses
- 🗂️ **Card Views** — Show expenses in card view
- 🏷️ **Custom Categories** — Default categories + create your own with emoji & color
- 🔍 **Filter & Search** — By name, category, date range
- 📎 **Receipt Upload** — Attach JPG, PNG, PDF receipts
- 💰 **MMK Currency** — All amounts in Myanmar Kyat
- 📱 **Responsive** — Works on mobile and desktop

---

## 🗂️ Project Structure

```
expense-tracker/
├── backend/          # Node.js + Express + MongoDB
└── frontend/         # React.js
```

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Environment

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The app will be at **http://localhost:3000**

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/expenses` | ✅ | List expenses (paginated, filterable) |
| POST | `/api/expenses` | ✅ | Create expense (multipart/form-data) |
| PUT | `/api/expenses/:id` | ✅ | Update expense |
| DELETE | `/api/expenses/:id` | ✅ | Delete expense |
| GET | `/api/expenses/stats/summary` | ✅ | Dashboard stats |
| GET | `/api/categories` | ✅ | List all categories |
| POST | `/api/categories` | ✅ | Create custom category |
| DELETE | `/api/categories/:id` | ✅ | Delete custom category |

### Query Parameters for GET /api/expenses
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `search` | string | Search by name |
| `category` | string | Filter by category ID |
| `startDate` | ISO date | Filter from date |
| `endDate` | ISO date | Filter to date |
| `sortBy` | string | `date`, `amount`, `name` |
| `sortOrder` | string | `asc` or `desc` |

---

## 🎨 Tech Stack

**Frontend**
- React 18 + React Router 6
- Vite 5 (build tool)
- Recharts (charts)
- Axios (HTTP)
- react-hot-toast (notifications)
- date-fns (date formatting)
- Custom CSS (no Tailwind dependency)

**Backend**
- Express.js
- Mongoose + MongoDB
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Multer (file uploads)
- express-validator

---

## 📁 Default Categories

Food & Dining · Saving · Cosmetic · Transport · Shopping · Healthcare · Entertainment · Bills & Utilities · Education · Other

Users can create additional custom categories with custom emoji and color.

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- File uploads limited to 5MB
- Only accepted filetypes: JPG, PNG, WEBP, PDF
- All expense routes are protected with JWT middleware
- Users can only access their own data
