# EventraOS - Complete Travel & Events Booking Platform

> One platform to **travel, stay, move & celebrate** — a full-stack, production-ready travel & event booking system covering hotels, flights, trains, buses, venues, car rentals, activities, transfers, and holiday packages.

EventraOS is a complete OTA-style (Online Travel Agency) platform built with a **Laravel API backend** and a **React + TypeScript SPA**. It ships with a provider-abstraction layer that aggregates multiple inventory sources, a unified multi-service cart and checkout, a booking → payment → confirmation pipeline with PDF vouchers/invoices, and dedicated workspaces for **customers**, **travel agents**, and **administrators**.

---

## ✨ Features

### Core Booking Services (9 verticals)
| Service | Endpoint | Highlights |
|---|---|---|
| Hotels | `GET /api/search/hotels` | Room types, rate plans, cancellation policies, star/amenity filters |
| Flights | `GET /api/search/flights` | Airports, airlines, cabin classes, fare families |
| Trains | `GET /api/search/trains` | Routes, classes, fare inventory, seat availability |
| Buses | `GET /api/search/buses` | Operators, boarding/dropping points, per-departure seat inventory |
| Venues | `GET /api/search/venues` | Packages, rooms, add-ons, capacity, availability calendar |
| Car Rentals | `GET /api/search/cars` | Daily rates, km inclusions, driver options, deposits, pickup locations |
| Activities | `GET /api/search/activities` | Categories, schedules, participant pricing, guided experiences |
| Transfers | `GET /api/search/transfers` | Vehicle classes, pricing tiers, fleet inventory |
| Packages | `GET /api/search/packages` | Multi-day bundles with inclusions/exclusions |

Plus `GET /api/search/suggestions` (autocomplete) and `GET /api/search/popular` (trending destinations).

### Platform Features
- **Unified Cart** — combine any service types in one booking (persisted client-side, re-priced server-side)
- **Multi-step Checkout** — cart review → traveler details → payment method → pay
- **Booking Lifecycle** — draft → payment_pending → confirmed, with inventory holds, cancellation, reschedule, refunds
- **Payment Engine** — pluggable gateway layer with a fully working **demo gateway** (initiate → process → capture → auto-confirm), retries and payment history
- **PDF Documents** — booking vouchers, invoices, credit notes, and itineraries
- **Provider Abstraction** — pluggable adapters for external supplier APIs (a seeded demo provider ships for all 9 services)
- **Loyalty Program** — Eventra Rewards with points awarded on confirmation
- **Promotions** — promo-code validation and discounts
- **Commissions** — agent commissions created automatically on booking confirmation
- **Notifications** — queued mailables with seeded templates + in-app notification center
- **Multi-currency, support ticketing, reviews, favorites, saved travelers**

### Role-Based Features

| Role | Capabilities |
|---|---|
| **Customer** | Dashboard, My Trips, booking detail (voucher/invoice/cancel), wallet, loyalty, coupons, favorites, reviews, notifications, saved travelers, support, profile & security (2FA, sessions, password) |
| **Agent** | Dashboard with targets, customer management, booking workspace, quotes, bookings, commissions, tasks, support |
| **Admin** | KPI dashboard, customers/agents/bookings/suppliers/venues/hotels/transport, promotions, payments, refunds, commissions, reports (revenue trends, top customers/agents), audit logs, system health, settings |

Role-based access is enforced by **Spatie Laravel Permission** middleware on every protected route group.

---

## 🧰 Tech Stack

### Frontend
- **React 18** with **TypeScript 5** (zero-error type-checked build)
- **Vite 5** — instant dev server, code-split production bundles
- **React Router v6** — nested layouts + protected routes
- **TanStack Query v5** — server state, keep-previous-data pagination
- **Zustand** (persisted) — auth session, cart, search
- **Tailwind CSS 3** — custom `eventra-*` design system
- **Framer Motion**, **Lucide icons**, **React Hook Form + Zod**, **React Hot Toast**

### Backend
- **Laravel 13** with **PHP 8.3+**
- **Laravel Sanctum** — token authentication
- **Spatie Laravel Permission** — role/permission RBAC
- **Spatie Laravel Activitylog** — audit trails
- **Barryvdh DomPDF** — voucher/invoice/credit-note/itinerary PDFs
- **SQLite** out of the box (zero-config dev) · **MySQL/PostgreSQL**-compatible migrations

---

## 🚀 Getting Started

### Prerequisites
- PHP **8.3+** with `pdo_sqlite` (and `pdo_mysql` if using MySQL)
- Composer 2
- Node.js **18+** and npm

### 1. Backend

```bash
cd backend
composer install

# Configure environment — SQLite works out of the box
cp .env.example .env
php artisan key:generate

# Create the schema and seed demo data (providers, inventory, users, promotions…)
php artisan migrate --seed

# Start the API server
php artisan serve --port=8000
```

> The API is live at `http://localhost:8000/api`. Seeders generate **demo inventory for ~30–45 days from the seed date** — re-run `php artisan migrate:fresh --seed` if the seeded dates have passed.

### 2. Frontend

```bash
cd frontend
npm install

# Configure the API base URL (defaults to the Vite dev proxy → localhost:8000)
cp .env.example .env

npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to `http://localhost:8000`.

### 3. Production build

```bash
cd frontend
npm run build      # type-checks (tsc -b) and bundles into dist/
npm run preview    # serve the production bundle locally
```

### 🔑 Demo Credentials

All demo accounts use the password **`password`**.

| Role | Email |
|---|---|
| Admin | `admin@demo.com` |
| Agent | `agent@demo.com` · `rajesh.agent@demo.com` |
| Customer | `customer@demo.com` · `priya@demo.com` · `john@demo.com` |

---

## 🔄 Booking Flow (end to end)

```
Search ──▶ Results ──▶ Add to Cart ──▶ Checkout
                                        │
                        ① Review cart   │
                        ② Travelers     │
                        ③ Payment method│
                                        ▼
                            POST /api/bookings              (prices re-validated server-side)
                                        │
                            POST /api/payments/initiate
                                        │
                            POST /api/payments/{id}/process (demo gateway captures)
                                        │
                            BookingService::confirmBooking  (items confirmed, invoice PDF,
                                        │                    loyalty + commissions awarded)
                                        ▼
                            /booking/confirmation/{reference}
                            + voucher / invoice downloads in My Trips
```

---

## 🧪 Testing

```bash
# Backend — API smoke suite (search, auth, RBAC, booking → payment → confirmation, PDFs)
cd backend && php artisan test

# Frontend — type check & unit tests
cd frontend && npx tsc -b
cd frontend && npm run test
```

The feature suite (`backend/tests/Feature/ApiSmokeTest.php`) runs against an in-memory SQLite database, seeds it fresh, and exercises every critical flow end-to-end — ideal as a CI gate.

---

## 📁 Project Structure

```
EventraOS/
├── backend/                          # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/     # Auth, Search, Booking, Payment, Customer, Agent, Admin…
│   │   ├── Models/                   # 90+ domain models (Booking, BookingItem, Payment, …)
│   │   ├── Services/
│   │   │   ├── Providers/            # ProviderManager + Demo*Provider for all 9 services
│   │   │   ├── Booking/              # Booking lifecycle: create, confirm, cancel, reschedule
│   │   │   ├── Payment/              # Gateway-agnostic payment pipeline
│   │   │   ├── PDF/                  # Voucher / invoice / credit-note / itinerary PDFs
│   │   │   └── …                     # Notification, Commission, Loyalty, Tax, Currency
│   │   └── Mail/                     # Queueable mailables
│   ├── database/
│   │   ├── migrations/               # 29 migrations (full travel domain)
│   │   └── seeders/                  # Demo users, rolling inventory, promotions, payment methods
│   ├── resources/views/pdf/          # Blade templates for the PDF documents
│   ├── routes/api.php                # 100+ API routes with RBAC middleware
│   └── tests/Feature/                # End-to-end API smoke tests
│
└── frontend/                         # React 18 + TypeScript SPA
    └── src/
        ├── components/ui/            # Reusable design-system components
        ├── layouts/                  # Layout, AuthLayout, AdminLayout, AgentLayout
        ├── pages/
        │   ├── public/               # Home, unified search
        │   ├── hotels|flights|trains|buses|venues|cars|activities|transfers|packages/
        │   ├── checkout/             # Checkout, PaymentProcessing, BookingConfirmation
        │   ├── customer/             # 12 customer-account pages
        │   ├── agent/                # 8 agent-workspace pages
        │   └── admin/                # 14 admin-console pages
        ├── hooks/                    # useAuth, useBookings, useSearch, useDebounce…
        ├── store/                    # Zustand: auth session, cart, search
        ├── lib/                      # API client (interceptors), utils
        └── App.tsx                   # Route table with layouts & protected routes
```

---

## 🏗️ Architecture Highlights

### Provider Abstraction Layer
All external integrations (flights, hotels, payments) use a provider adapter pattern — swap the seeded demo providers for real supplier APIs without touching application code:

```php
interface ProviderInterface {
    public function search(array $criteria): SearchResultCollection;
    public function getDetails(string $itemId): ?ProviderItemDetails;
    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult;
    public function createHold(array $data): HoldResult;
    public function confirmBooking(string $holdRef, array $data): BookingConfirmation;
}
```

### Booking State Machine
```
DRAFT → PAYMENT_PENDING → CONFIRMED → COMPLETED
                │                 │
                ▼                 ▼
         (payment failed)    CANCELLED → REFUND → CREDIT NOTE
```

### Security Features
- Laravel Sanctum token authentication (explicit `web` guard for credential verification)
- Role-based access control (Spatie Permission) on customer/agent/admin route groups
- Rate limiting on auth, search, and payment endpoints
- 2FA (TOTP), session management, and security event logging
- Audit logging for all critical operations (financial and booking events)
- Server-side price re-validation at booking time — client prices are never trusted

---

## ⚙️ Configuration Notes

| Topic | Detail |
|---|---|
| **API URL** | Frontend `.env`: `VITE_API_URL=/api` (dev proxy) or the absolute URL of the deployed API |
| **CORS / SPA auth** | `bootstrap/app.php` enables Sanctum stateful SPA middleware on `api/*` |
| **Database** | SQLite by default (`DB_CONNECTION=sqlite`); switch to MySQL in `backend/.env` and re-run migrations |
| **Queue** | Emails are queued (`QUEUE_CONNECTION=sync` in dev); use `database` or `redis` in production |
| **Payment gateways** | The demo gateway always succeeds and auto-confirms; implement `processWithProvider()` in `PaymentService` for real gateways |
| **Demo inventory dates** | Seeders generate 30–45 days of rolling inventory from the seed date — re-seed to refresh |

---

## 🚢 Deployment

### Production Checklist
- [ ] Set `APP_ENV=production`, `APP_DEBUG=false`
- [ ] Configure production database (MySQL/PostgreSQL) and run `php artisan migrate --seed`
- [ ] Set up Redis for queues/cache and run `php artisan queue:work`
- [ ] Configure production mail server
- [ ] Set up SSL certificates and a CDN for assets
- [ ] Set up monitoring/logging and a backup strategy
- [ ] Run `php artisan config:cache`, `php artisan route:cache`, `php artisan view:cache`
- [ ] Build the frontend: `npm run build`, serve `dist/` behind a CDN/nginx (SPA fallback to `index.html`)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 📮 Support

For support, email support@eventraos.com or create an issue in the repository.

---

**EventraOS** — One platform for travel, stays, events, transportation and experiences.
