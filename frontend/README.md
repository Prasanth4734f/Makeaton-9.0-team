# REVORA Frontend

**Manage subscriptions. Automate billing. Protect recurring revenue.**

React + Vite frontend for the REVORA Subscription Revenue Intelligence Platform.

> **Owned by:** Harshitha (Frontend & UX)  
> **Branch:** `feature/frontend-harshitha`

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Demo Accounts

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Admin    | admin@revora.in        | Admin@123     |
| Staff    | staff@revora.in        | Staff@123     |
| Customer | customer@revora.in     | Customer@123  |

> Authentication is simulated client-side in demo/mock mode. Real auth is implemented by Sai (backend).

---

## Tech Stack

| Tool              | Purpose                        |
|-------------------|-------------------------------|
| React 18          | UI framework                   |
| Vite              | Build tool & dev server        |
| React Router v6   | Client-side routing            |
| Tailwind CSS v4   | Utility-first styling          |
| Lucide React      | Icons                          |
| Recharts          | Financial charts               |
| Axios             | HTTP client                    |
| React Hook Form   | Form state management          |
| Zod               | Schema validation              |
| Vitest            | Unit testing                   |
| React Testing Lib | Component testing              |

---

## Folder Structure

```
frontend/src/
├── assets/
├── components/
│   ├── layout/       # Sidebar, Header, MainLayout
│   ├── ui/           # Button, Modal, StatusBadge, Loading, EmptyState
│   └── common/       # DataTable, PageHeader, ConfirmDialog, ProtectedRoute
├── context/          # AuthContext (auth state + mock auth)
├── data/             # mockData.js (realistic INR mock data)
├── pages/            # All 13 pages
├── services/         # API service layer (mock adapters)
├── tests/            # Vitest tests
└── utils/            # formatters, validators, permissions
```

---

## Pages

| Path               | Page                   | Access          |
|--------------------|------------------------|-----------------|
| `/login`           | Login                  | Public          |
| `/register`        | Register               | Public          |
| `/forgot-password` | Forgot Password        | Public          |
| `/dashboard`       | Dashboard              | Admin, Staff    |
| `/products`        | Products               | Admin, Staff    |
| `/plans`           | Subscription Plans     | Admin, Staff    |
| `/quotations`      | Quotations             | Admin, Staff    |
| `/subscriptions`   | Subscriptions          | Admin, Staff    |
| `/invoices`        | Invoices               | Admin, Staff    |
| `/payments`        | Payments               | Admin, Staff    |
| `/action-center`   | Revenue Action Center  | Admin, Staff    |
| `/customer-portal` | Customer Portal        | Customer        |
| `/profile`         | My Profile             | All             |

---

## API Integration

The frontend uses a **mock adapter** pattern in `src/services/`. Each service file exports async functions that currently return mock data with simulated latency.

To switch to the real backend (Sai's FastAPI):

1. Set `VITE_MOCK_MODE=false` in `.env`
2. Set `VITE_API_BASE_URL=http://localhost:8000/api`
3. Replace mock implementations in each `*Service.js` with real axios calls using the `api` instance from `services/api.js`

No page components need to be modified — they call service functions only.

### Expected API Endpoints (for Sai's reference)

```
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/plans
POST   /api/plans
PUT    /api/plans/:id
DELETE /api/plans/:id

GET    /api/quotations
POST   /api/quotations
PUT    /api/quotations/:id/send
PUT    /api/quotations/:id/accept
DELETE /api/quotations/:id

GET    /api/subscriptions
POST   /api/subscriptions
PUT    /api/subscriptions/:id/cancel
PUT    /api/subscriptions/:id/pause
PUT    /api/subscriptions/:id/resume

GET    /api/invoices
PUT    /api/invoices/:id/send
PUT    /api/invoices/:id/mark-paid

GET    /api/payments
POST   /api/payments
PUT    /api/payments/:id/retry

GET    /api/dashboard/stats
GET    /api/dashboard/mrr
GET    /api/dashboard/revenue-by-product

GET    /api/intelligence/actions
PUT    /api/intelligence/actions/:id/resolve
PUT    /api/intelligence/actions/:id/snooze
```

---

## Testing

```bash
npm run test          # Watch mode
npm run test:run      # Single run (CI)
npm run test:coverage # Coverage report
```

---

## Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=REVORA
VITE_MOCK_MODE=true
VITE_APP_VERSION=1.0.0
```

---

## Team Integration Notes

- **Sai (Backend):** Replace service mocks with axios calls. Auth token must be returned as `token` field in login response and stored in `revora_auth` localStorage key.
- **Prasanth (Intelligence):** `intelligenceService.js` calls `/api/intelligence/actions`. Action shape: `{ id, type, priority, title, description, customerId, customerName, customerCompany, amount, recommendedAction, status, createdAt }`.
- **Krishna (Database):** All currency values are stored/returned in INR (integer paise or whole rupees). Frontend formats with `en-IN` locale.

---

*REVORA — Subscription Revenue Intelligence Platform*
*Frontend by Harshitha | Hackathon 2024*
