# EventraOS

**One platform to travel, stay, move & celebrate.** EventraOS is a full-stack, OTA-style (Online Travel Agency) booking platform covering **nine service verticals** — hotels, flights, trains, buses, venues, car rentals, activities, transfers and holiday packages — built as a **Laravel API** plus a **React + TypeScript SPA**, with dedicated workspaces for customers, travel agents and administrators.

Every screenshot captured for this project is embedded directly in [Section 3 — Complete Screenshot Gallery](#3-complete-screenshot-gallery) below: 70 images, each with its own heading and description, covering the home page, authentication, all nine search verticals, detail pages, the full checkout flow, all three role workspaces and the responsive layouts.

---

## Table of Contents

1. [What EventraOS Does](#1-what-eventraos-does)
2. [Project Highlights](#2-project-highlights)
3. [Complete Screenshot Gallery](#3-complete-screenshot-gallery)
4. [Application Route Reference](#4-application-route-reference)
5. [Technology Stack](#5-technology-stack)
6. [Architecture & Project Structure](#6-architecture--project-structure)
7. [Prerequisites](#7-prerequisites)
8. [Installation & Local Setup](#8-installation--local-setup)
9. [Running the Application](#9-running-the-application)
10. [Available Scripts](#10-available-scripts)
11. [Configuration & Environment Variables](#11-configuration--environment-variables)
12. [User Workflows](#12-user-workflows)
13. [Responsive Design](#13-responsive-design)
14. [Testing & Quality Checks](#14-testing--quality-checks)
15. [Known Limitations](#15-known-limitations)
16. [Development Guidelines](#16-development-guidelines)
17. [License & Support](#17-license--support)

---

## 1. What EventraOS Does

EventraOS is a complete booking pipeline for travel and events:

- **Search** nine inventory verticals through one provider-abstraction layer (a seeded demo provider ships for all nine services, generating rolling 30–45-day inventory).
- **Combine** any mix of services into a single cart and check out once.
- **Pay** through a pluggable payment engine (a fully working demo gateway auto-captures and confirms).
- **Manage** bookings afterwards: vouchers, invoices, cancellation, reschedule, refunds — as a customer, an agent booking on behalf of clients, or an administrator.

The demo seed creates three role accounts (see [Demo Credentials](#demo-credentials)) and a populated catalogue (12 cities, hotels, flights, trains, buses, venues, cars, activities, transfers and packages).

## 2. Project Highlights

- **9 booking verticals** with per-service filters, sorting and pagination — all served through `GET /api/search/{service}`.
- **Unified booking builder** — any combination of services in one cart, re-priced server-side at booking time.
- **Multi-step checkout** — cart review → traveler details → payment method → pay, with promo-code validation.
- **Booking lifecycle** — draft → payment_pending → confirmed, with cancellation, reschedule and refund flows.
- **PDF documents** — server-generated vouchers, invoices, credit notes and itineraries (Barryvdh DomPDF).
- **Provider abstraction** — every external integration (inventory and payments) sits behind adapter interfaces; swap the demo providers for real suppliers without touching application code.
- **Role-based workspaces** — 12 customer-account pages, 8 agent-workspace pages and 14 admin-console pages, protected by Spatie Laravel Permission middleware.
- **Platform features** — loyalty points, wallet, coupons, notifications, saved travelers, support ticketing, reviews, favorites, multi-currency scaffolding, audit logs and system health.

## 3. Complete Screenshot Gallery

All screenshots below were captured from the actual running application (Laravel API + Vite dev server) after frontend stabilization. Desktop shots are 1440×900, tablet 768×1024, mobile 390×844 (captured at 2× pixel density). Paths are relative to this README.

### 3.1 Home & Overview (5 screenshots)

#### 1. Home Page — Hero (Guest)

The primary entry screen for a signed-out visitor: public-beta badge, the "Everything you need to travel, stay, move & celebrate" headline, primary calls-to-action, and the unified search widget with service tabs, destination, date and guest fields.

![Home page hero for guests with unified search widget](docs/screenshots/01-overview/home-desktop.png)

#### 2. Home Page — Hero (Signed In)

The same hero as an authenticated customer sees it — the header now shows the account chip ("Demo") instead of Sign In/Sign Up, and the search widget holds its state (2 Adults preselected).

![Home page hero for a signed-in user](docs/screenshots/01-overview/home-hero.png)

#### 3. Home Page — "All Ways to Travel" Services Grid

The home page's service catalogue section: one Explore card per vertical — Hotels, Flights, Trains, Buses, Venues, Car Rentals, Activities, Transfers and Packages — each linking into its results page.

![All Ways to Travel services grid](docs/screenshots/01-overview/home-services.png)

#### 4. Home Page — Closing CTA & Footer

The closing "Ready to Start Your Journey?" call-to-action with account-creation buttons, followed by the site footer with its Services, Support and Company link columns.

![Home page CTA banner and footer](docs/screenshots/01-overview/home-footer.png)

#### 5. Home Page — Responsive Capture Pass

The signed-in home hero saved during the responsive capture pass (this particular pass was written at desktop width, so it mirrors entry 2; the genuine narrow-viewport states — hamburger navigation, stacked layouts — follow in section 3.9).

![Home page hero captured during the responsive pass](docs/screenshots/01-overview/home-mobile.png)

### 3.2 Authentication (4 screenshots)

#### 6. Login Page

Split-screen authentication: a navy marketing panel ("9 Service Types / 500+ Airlines / 24/7 Support") beside the sign-in card with email, password with show/hide toggle, "Remember me", Forgot-password link and social sign-in placeholders.

![Login page with split-screen layout](docs/screenshots/02-authentication/login-desktop.png)

#### 7. Login — Empty-Submit Validation

Submitting the login form empty surfaces inline Zod validation — "Please enter a valid email address" under the email field and "Password must be at least 8 characters" under the password field.

![Login form validation errors](docs/screenshots/02-authentication/login-validation.png)

#### 8. Registration Page

The account-creation form with name, email, phone, password + confirmation, a live password-requirements checklist and the terms-acceptance checkbox.

![Registration page](docs/screenshots/02-authentication/register-desktop.png)

#### 9. Forgot Password Page

The password-reset request screen added to the auth flow: an email field that posts to the backend's forgot-password endpoint and shows a confirmation state on success.

![Forgot password page](docs/screenshots/02-authentication/forgot-password-desktop.png)

### 3.3 Unified Search & the Nine Service Verticals (10 screenshots)

#### 10. Unified Search Page

The cross-service search hub: "What are you looking for?" service tiles (All Services plus the nine verticals) above destination, check-in/check-out, guest and room fields, followed by per-service category cards.

![Unified search page with service tiles](docs/screenshots/03-search/search-unified-desktop.png)

#### 11. Hotel Results

Hotel search results for Delhi (5–8 Nov, 3 nights): result header with count and dates, sort dropdown, filter sidebar (price sliders, star rating, property type, amenities) and live result cards showing per-night and total pricing.

![Hotel results page with filters](docs/screenshots/03-search/hotel-results-desktop.png)

#### 12. Flight Results

Flight results for DEL → BOM: route and date summary, stops/cabin/price filters, and an IndiGo 6E683 result card with schedule details.

![Flight results page](docs/screenshots/03-search/flight-results-desktop.png)

#### 13. Train Results

Train results with class (1AC–2S) and quota filters, and train cards showing availability for the selected journey date.

![Train results page](docs/screenshots/03-search/train-results-desktop.png)

#### 14. Bus Results

Bus results with AC/sleeper and operator filters; each card lists boarding and dropping points and amenities.

![Bus results page](docs/screenshots/03-search/bus-results-desktop.png)

#### 15. Venue Results

Venue search for Mumbai on 20 Nov for 100 guests: event-type filter chips and a result card with capacity and pricing.

![Venue results page](docs/screenshots/03-search/venue-results-desktop.png)

#### 16. Car Rental Results

Car rentals in Delhi with a per-day price slider, category and transmission filters, and an active-filter count badge on the Filters button.

![Car rental results page](docs/screenshots/03-search/car-results-desktop.png)

#### 17. Activity Results

Activities in Delhi for 2 participants with category and duration filters and book-now cards.

![Activity results page](docs/screenshots/03-search/activity-results-desktop.png)

#### 18. Transfer Results

Airport/city transfer results for Delhi → Jaipur: vehicle classes with per-vehicle pricing and luggage filters.

![Transfer results page](docs/screenshots/03-search/transfer-results-desktop.png)

#### 19. Holiday Package Results

Curated multi-day packages with duration and price sorting and destination badges.

![Package results page](docs/screenshots/03-search/package-results-desktop.png)

### 3.4 Service Detail Pages (3 screenshots)

#### 20. Hotel Detail — Rooms, Rates & Price Summary

The Leela Palace detail page: room types with occupancy and meal plans, selectable rate plans with cancellation rules, amenities and policies, and a sticky sidebar breaking the ₹54,000 total down over 3 nights with the Reserve action.

![Hotel detail page with rooms and price summary](docs/screenshots/04-details/hotel-detail-desktop.png)

#### 21. Flight Detail — Fare Options

The flight detail page for IndiGo 6E683: itinerary timeline and baggage rules, fare-option radios (Economy Saver through first class) with per-fare pricing and availability.

![Flight detail page with fare options](docs/screenshots/04-details/flight-detail-desktop.png)

#### 22. Venue Detail — Package & Add-On Configurator

The venue configurator: selected package panel with guest count (100) and duration (6 hours), package selector modal, add-on checkboxes with per-guest/per-hour/fixed pricing and a live running total.

![Venue detail page with package configurator](docs/screenshots/04-details/venue-detail-desktop.png)

### 3.5 Checkout & Payment (5 screenshots)

#### 23. Checkout Step 1 — Review Your Selection

The cart review step: the hotel line item with dates and guests, its remove control, the price summary (subtotal, taxes & fees, ₹64,800 total) and a promo-code field.

![Checkout review step](docs/screenshots/05-checkout/checkout-review.png)

#### 24. Checkout Step 2 — Traveler Details

One validated traveler form per guest (title, name, email, phone, date of birth, nationality) with completion tracking that gates the Continue action.

![Checkout traveler details step](docs/screenshots/05-checkout/checkout-travelers.png)

#### 25. Checkout Step 3 — Payment Method

The payment step listing the available methods served by the API — Credit/Debit Card, UPI, Net Banking and EventraOS Wallet — with the final "Pay ₹64,800" action.

![Checkout payment method step](docs/screenshots/05-checkout/checkout-payment.png)

#### 26. Payment Processing — Demo Gateway Capture

The payment screen at the moment the demo gateway finishes: all four progress steps (securing, authorizing, capturing, confirming) completed, amount and payment reference shown, and a toast announcing the created booking reference before the automatic redirect.

![Payment processing success screen](docs/screenshots/05-checkout/payment-processing.png)

#### 27. Booking Confirmation

The confirmation page for booking EVR-HTL-2YYGYN: Confirmed + "Payment: Paid" badges, the booked item with dates and traveler chips, server-computed price summary, and actions for My Trips and invoice download.

![Booking confirmation page](docs/screenshots/05-checkout/booking-confirmation.png)

### 3.6 Customer Workspace (12 screenshots)

#### 28. Customer Dashboard

The customer landing page: stat cards (trips, spend, loyalty), the upcoming-trips list, recent bookings with status badges and quick actions into wallet, loyalty and notifications.

![Customer dashboard](docs/screenshots/06-customer/dashboard-desktop.png)

#### 29. My Trips

The trip manager: status tabs (All/Upcoming/Completed/Cancelled/Pending), type filter, search and sort, and trip cards — including confirmed Leela Palace bookings and payment-pending items — each linking into its booking detail.

![My Trips page with filters and trip cards](docs/screenshots/06-customer/my-trips-desktop.png)

#### 30. Booking Detail

A single booking's management page: status timeline, per-item cards with travelers, voucher and invoice download buttons, and cancel/reschedule actions for confirmed bookings.

![Booking detail page with document downloads](docs/screenshots/06-customer/booking-detail-desktop.png)

#### 31. Wallet

The EventraOS wallet: current balance, add-funds and withdraw actions, and the transaction history list.

![Customer wallet page](docs/screenshots/06-customer/wallet-desktop.png)

#### 32. Loyalty — Eventra Rewards

The rewards page: points balance, current tier and the points earn/redemption history.

![Loyalty rewards page](docs/screenshots/06-customer/loyalty-desktop.png)

#### 33. Coupons

Available promo coupons presented as cards with copy-to-clipboard code buttons and validity details.

![Coupons page](docs/screenshots/06-customer/coupons-desktop.png)

#### 34. Favorites

The customer's saved services list with remove controls.

![Favorites page](docs/screenshots/06-customer/favorites-desktop.png)

#### 35. My Reviews

Reviews the customer has written, with ratings and linked services.

![My reviews page](docs/screenshots/06-customer/reviews-desktop.png)

#### 36. Notifications

The notification center with per-item mark-as-read and a mark-all control.

![Notifications page](docs/screenshots/06-customer/notifications-desktop.png)

#### 37. Security Center

The security workspace: active sessions with revoke controls, two-factor-authentication setup (TOTP), password change and the security-event log.

![Security center page](docs/screenshots/06-customer/security-desktop.png)

#### 38. Saved Travelers

The traveler address book used to prefill checkout forms, with add/edit/delete modals.

![Saved travelers page](docs/screenshots/06-customer/saved-travelers-desktop.png)

#### 39. Customer Support

The support ticket list with ticket creation and detail view.

![Customer support page](docs/screenshots/06-customer/support-desktop.png)

### 3.7 Agent Workspace (8 screenshots)

#### 40. Agent Dashboard

The agent landing page: performance targets, the booking pipeline and the agent's task list.

![Agent dashboard](docs/screenshots/07-agent/agent-dashboard-desktop.png)

#### 41. Agent Customers

Client management for agents: searchable customer table with add-customer action.

![Agent customers page](docs/screenshots/07-agent/agent-customers-desktop.png)

#### 42. Agent Booking Workspace

The multi-service booking builder: client picker and service composition workspace for assembling a client's itinerary.

![Agent booking workspace](docs/screenshots/07-agent/agent-booking-workspace-desktop.png)

#### 43. Agent Quotes

Quote management: the quote list with creation flow fed by the agent's customer book.

![Agent quotes page](docs/screenshots/07-agent/agent-quotes-desktop.png)

#### 44. Agent Bookings

All bookings made on behalf of the agency, with status filters and a detail modal.

![Agent bookings page](docs/screenshots/07-agent/agent-bookings-desktop.png)

#### 45. Agent Commissions

The commission ledger with summary totals and per-booking commission rows.

![Agent commissions page](docs/screenshots/07-agent/agent-commissions-desktop.png)

#### 46. Agent Tasks

The agent's task list with status transitions (pending → in progress → completed).

![Agent tasks page](docs/screenshots/07-agent/agent-tasks-desktop.png)

#### 47. Agent Support

The agency support queue with ticket list and detail view.

![Agent support page](docs/screenshots/07-agent/agent-support-desktop.png)

### 3.8 Admin Console (14 screenshots)

#### 48. Admin Dashboard

The console home: KPI cards, revenue chart, booking/activity summaries and a system-health panel, with a date-range selector.

![Admin dashboard with KPIs and system health](docs/screenshots/08-admin/admin-dashboard-desktop.png)

#### 49. Admin — Customers

Customer management table with search, status filters and delete-with-confirmation.

![Admin customers management](docs/screenshots/08-admin/admin-customers-desktop.png)

#### 50. Admin — Agents

Agent account management: create-agent modal and termination controls.

![Admin agents management](docs/screenshots/08-admin/admin-agents-desktop.png)

#### 51. Admin — Bookings

Every booking in the platform with status/type filters and a detail view for status updates.

![Admin bookings management](docs/screenshots/08-admin/admin-bookings-desktop.png)

#### 52. Admin — Suppliers

The supplier registry backing the provider layer, with create and remove actions.

![Admin suppliers registry](docs/screenshots/08-admin/admin-suppliers-desktop.png)

#### 53. Admin — Venues

Venue inventory management with deactivate controls.

![Admin venues inventory](docs/screenshots/08-admin/admin-venues-desktop.png)

#### 54. Admin — Hotels

Hotel inventory management with deactivate controls.

![Admin hotels inventory](docs/screenshots/08-admin/admin-hotels-desktop.png)

#### 55. Admin — Transport

Transport supplier management (the page reads the supplier registry filtered to transport providers).

![Admin transport suppliers](docs/screenshots/08-admin/admin-transports-desktop.png)

#### 56. Admin — Promotions

Promo-code management: create form, active toggles and deletion.

![Admin promotions management](docs/screenshots/08-admin/admin-promotions-desktop.png)

#### 57. Admin — Payments

The platform payment ledger with per-payment detail (read-only).

![Admin payments ledger](docs/screenshots/08-admin/admin-payments-desktop.png)

#### 58. Admin — Refunds

The refund workflow: pending requests with approve/reject/complete actions.

![Admin refunds workflow](docs/screenshots/08-admin/admin-refunds-desktop.png)

#### 59. Admin — Commissions

Commission lifecycle management (eligible → approved → paid) across agents.

![Admin commissions management](docs/screenshots/08-admin/admin-commissions-desktop.png)

#### 60. Admin — Reports

Revenue reporting with a day-range selector: trends plus top customers and agents.

![Admin reports page](docs/screenshots/08-admin/admin-reports-desktop.png)

#### 61. Admin — Audit Logs

The audit-trail viewer for critical operations, with actor/event filters and pagination.

![Admin audit logs viewer](docs/screenshots/08-admin/admin-audit-logs-desktop.png)

### 3.9 Responsive Design (9 screenshots)

#### 62. Home — Tablet (768×1024)

The home page at tablet width between the desktop and mobile breakpoints.

![Home page on tablet](docs/screenshots/09-responsive/home-tablet.png)

#### 63. Hotel Results — Tablet (768×1024)

Hotel results at tablet width: the filter sidebar collapses behind the Filters button and the grid adapts.

![Hotel results on tablet](docs/screenshots/09-responsive/hotel-results-tablet.png)

#### 64. Hotel Results — Mobile (390×844)

Results at phone width: single-column cards with the sticky header and a Filters button replacing the sidebar.

![Hotel results on mobile](docs/screenshots/09-responsive/hotel-results-mobile.png)

#### 65. Hotel Detail — Mobile (390×844)

The hotel detail page stacking to a single column on a phone, with the price summary and Reserve action flowing below the content.

![Hotel detail on mobile](docs/screenshots/09-responsive/hotel-detail-mobile.png)

#### 66. Mobile Navigation Drawer Open

The hamburger navigation drawer open on a phone, listing all nine service links.

![Mobile navigation drawer open](docs/screenshots/09-responsive/mobile-nav-open.png)

#### 67. Hotel Filters — Mobile Slide-Over Open

The results filter slide-over on a phone: price-range slider, star-rating, property-type and amenity checkboxes over a dimmed results page.

![Mobile filter slide-over open](docs/screenshots/09-responsive/hotel-filters-mobile-open.png)

#### 68. Checkout — Mobile (390×844)

The checkout review step on a phone: stepper icons, the cart line item and Continue action in a single column with the price summary following.

![Checkout on mobile](docs/screenshots/09-responsive/checkout-mobile.png)

#### 69. Customer Dashboard — Mobile (390×844)

The customer dashboard at phone width after a card-row overflow fix — no horizontal scrolling at 390 px.

![Customer dashboard on mobile](docs/screenshots/09-responsive/customer-dashboard-mobile.png)

#### 70. Admin — Mobile Slide-Over Sidebar

The admin console on a phone with its navigation drawer slid over a dimmed content area, listing all fourteen console sections.

![Admin mobile sidebar open](docs/screenshots/09-responsive/admin-mobile-sidebar.png)

## 4. Application Route Reference

All routes are declared in `frontend/src/App.tsx` (54 distinct page views). Protected routes redirect unauthenticated visitors to `/login`; `/admin/*` and `/agent/*` additionally redirect users without the matching role.

| Route | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/search` | Unified search | Public |
| `/login`, `/register`, `/forgot-password` | Authentication (split-screen layout) | Public |
| `/hotels`, `/hotels/:id` | Hotel results / detail | Public |
| `/flights`, `/flights/:id` | Flight results / detail | Public |
| `/trains`, `/buses` | Train / bus results (add to cart directly) | Public |
| `/venues`, `/venues/:id` | Venue results / configurator | Public |
| `/cars`, `/activities`, `/transfers`, `/packages` | Results (add to cart directly) | Public |
| `/checkout` | 3-step checkout | Customer |
| `/booking/payment/:paymentId` | Payment processing (demo gateway) | Customer |
| `/booking/confirmation/:reference` | Booking confirmation + documents | Customer |
| `/customer/dashboard` | Stats, upcoming trips, notifications | Customer |
| `/customer/trips` | My Trips (filterable list) | Customer |
| `/customer/bookings/:id` | Booking detail, cancel/reschedule, PDFs | Customer |
| `/customer/wallet` | Wallet balance, add/withdraw, transactions | Customer |
| `/customer/loyalty` | Eventra Rewards points & tier | Customer |
| `/customer/coupons` | Available coupons | Customer |
| `/customer/favorites` | Saved services | Customer |
| `/customer/reviews` | My reviews | Customer |
| `/customer/notifications` | Notification center | Customer |
| `/customer/security` | Sessions, 2FA (TOTP), password | Customer |
| `/customer/travelers` | Saved traveler address book | Customer |
| `/customer/support` | Support tickets | Customer |
| `/agent` (+ `/dashboard`, `/customers`, `/booking-workspace`, `/quotes`, `/bookings`, `/commissions`, `/tasks`, `/support`) | Agent workspace (8 pages) | Agent |
| `/admin` (+ `/dashboard`, `/customers`, `/agents`, `/bookings`, `/suppliers`, `/venues`, `/hotels`, `/transports`, `/promotions`, `/payments`, `/refunds`, `/commissions`, `/reports`, `/audit-logs`) | Admin console (14 pages) | Admin |
| `*` | Redirects to `/` | — |

Results pages read per-service URL query params (e.g. `/hotels?destination=Delhi&check_in=…&check_out=…&rooms=…&adults=…`, `/flights?origin=DEL&destination=BOM&departure_date=…&adults=…`, `/venues?city=…&event_date=…&guest_count=…`) — links are shareable and bookmarkable. The backend API (`backend/routes/api.php`, 100+ route registrations) mirrors these areas under `/api/*` with Sanctum auth and role middleware.

## 5. Technology Stack

### Frontend (`frontend/`)
| Technology | Purpose |
|---|---|
| **React 18 + TypeScript 5** | UI (zero-error type-checked build via `tsc -b`) |
| **Vite 5** | Dev server, `/api` proxy, code-split production bundles |
| **React Router v6** | Nested layouts, protected routes, URL-driven search state |
| **TanStack Query v5** | Server state, keep-previous-data pagination |
| **Zustand (+persist)** | Auth session (`eventraos-auth`), cart (`eventraos-cart`), search params |
| **Tailwind CSS 3** | Custom `eventra-*` design system (typography scale, colour tokens, component classes) |
| **Framer Motion** | Page/step transitions, entrance animations |
| **React Hook Form + Zod** | Form state and validation (login, register, traveler details) |
| **React Hot Toast** | Feedback messages |
| **Lucide icons, Headless UI, Swiper, react-day-picker** | UI primitives |
| **ESLint 9 (flat config), Vitest, Playwright (tooling only)** | Quality gates |

### Backend (`backend/`)
| Technology | Purpose |
|---|---|
| **Laravel 13 (PHP 8.3+)** | API framework |
| **Laravel Sanctum** | Token authentication (SPA stateful mode) |
| **Spatie Laravel Permission** | Role/permission RBAC on customer/agent/admin route groups |
| **Spatie Laravel Activitylog** | Audit trails for critical operations |
| **Barryvdh DomPDF** | Voucher / invoice / credit-note / itinerary PDFs |
| **SQLite** | Zero-config local database (MySQL/PostgreSQL-compatible migrations) |

## 6. Architecture & Project Structure

```
EventraOS/
├── backend/                          # Laravel 13 API
│   ├── app/
│   │   ├── Http/Controllers/Api/     # Auth, Search, Booking, Payment, Customer, Agent, Admin…
│   │   ├── Models/                   # 100+ domain models (Booking, BookingItem, Payment, …)
│   │   ├── Services/
│   │   │   ├── Providers/            # ProviderManager + Demo*Provider for all 9 services
│   │   │   ├── Booking/              # BookingService: create → hold → confirm → cancel → refund
│   │   │   ├── Payment/              # Gateway-agnostic payment pipeline + demo gateway
│   │   │   ├── PDF/                  # Voucher / invoice / credit-note / itinerary generators
│   │   │   └── …                     # Notification, Commission, Loyalty, Tax, Currency services
│   │   └── Mail/                     # Queueable mailables
│   ├── database/migrations/          # 30 migrations (full travel domain)
│   ├── database/seeders/             # Demo users, rolling inventory, promotions, payment methods
│   ├── resources/views/pdf/          # Blade templates for PDF documents
│   ├── routes/api.php                # 100+ API routes with RBAC middleware
│   └── tests/Feature/ApiSmokeTest.php# End-to-end API smoke suite
│
├── frontend/                         # React 18 + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx                   # Route table, protected routes, session boot
│   │   ├── layouts/                  # Layout (public), AuthLayout, AdminLayout, AgentLayout
│   │   ├── pages/
│   │   │   ├── public/               # Home, unified SearchPage
│   │   │   ├── hotels|flights|trains|buses|venues|cars|activities|transfers|packages/
│   │   │   ├── checkout/             # Checkout, PaymentProcessing, BookingConfirmation
│   │   │   ├── auth/                 # Login, Register, ForgotPassword
│   │   │   ├── customer/             # 12 customer-account pages
│   │   │   ├── agent/                # 8 agent-workspace pages
│   │   │   └── admin/                # 14 admin-console pages
│   │   ├── components/ui/            # Button, Input, Modal, Card, Badge, Avatar, skeletons…
│   │   ├── hooks/                    # useAuth, useBookings, useSearch, useDebounce…
│   │   ├── store/                    # Zustand: auth, cart, search
│   │   ├── lib/                      # api.ts (axios client + interceptors), utils, formatters
│   │   └── index.css                 # eventra-* design tokens & component classes
│   ├── eslint.config.js              # ESLint 9 flat config
│   └── vite.config.ts                # Dev server + preview proxy, manual chunks
│
└── docs/                             # This audit's deliverables
    ├── screenshots/                  # 70 screenshots, organized by area (all embedded in §3)
    ├── screenshot-index.md
    ├── test-coverage.md
    └── ui-audit.md
```

### How the pieces fit

```mermaid
flowchart TD
    A[main.tsx boot] --> B[React Router]
    B --> C{Route type}
    C -->|public| D[Layout - header/footer]
    C -->|auth| E[AuthLayout]
    C -->|workspace| F[AgentLayout / AdminLayout - role guard]
    D --> G[Results / Detail Pages]
    G --> H[Search Store - URL params]
    G --> I[Cart Store - Zustand persist]
    I --> J[Checkout: review, travelers, payment]
    J --> K[axios api.ts - Bearer token]
    K --> L[Laravel API - Sanctum + RBAC]
    L --> M[ProviderManager - 9 demo providers]
    L --> N[BookingService - server-side re-pricing]
    L --> O[PaymentService - demo gateway capture]
    N --> P[PDF service - voucher / invoice]
    O --> Q[BookingConfirmation page]
```

**Provider abstraction.** Every vertical goes through `ProviderInterface` (`search`, `getDetails`, `checkAvailability`, `createHold`, `confirmBooking`). `DemoHotelProvider` & friends read seeded inventory; replacing them with real supplier APIs requires no application-code changes.

**Server-side re-pricing.** The cart is a client-side convenience only. `BookingService::calculateItemPrice()` recomputes every line from provider data (honouring `fare_id` / `package_id` selections), applies tax (18%) and service fees (2%), so client prices are never trusted.

**State machine.** `DRAFT → PAYMENT_PENDING → CONFIRMED → COMPLETED`, with `CANCELLED → REFUND → CREDIT NOTE` branches. Cancellation and reschedule are available on confirmed bookings from the customer's booking-detail page.

## 7. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| PHP | **8.3+** | with `pdo_sqlite` (and `pdo_mysql`/`pdo_pgsql` if not using SQLite) |
| Composer | 2.x | backend dependencies |
| Node.js | 18+ (tested on 24) | frontend |
| npm | 9+ | ships with Node |
| A modern browser | — | for the SPA |

No external services are required for local development: SQLite works out of the box and the demo payment gateway auto-captures.

## 8. Installation & Local Setup

The project folder already contains both applications. From the repository root:

**1. Backend**

```bash
cd backend
composer install

# Configure environment — SQLite works out of the box
cp .env.example .env
php artisan key:generate

# Create schema + demo data (users, inventory, promotions, payment methods)
php artisan migrate --seed
```

**2. Frontend**

```bash
cd ../frontend
npm install
cp .env.example .env   # sets VITE_API_URL=/api (dev proxy)
```

### Demo Credentials

All demo accounts use the password **`password`**.

| Role | Email |
|---|---|
| Admin | `admin@demo.com` |
| Agent | `agent@demo.com` |
| Customer | `customer@demo.com` |

> Seeders generate demo inventory for **~30–45 days from the seed date**. If searches return empty results, refresh with `php artisan migrate:fresh --seed`.

## 9. Running the Application

**Backend API**

```bash
cd backend
php artisan serve --port=8000        # API at http://localhost:8000/api
```

**Frontend dev server**

```bash
cd frontend
npm run dev                          # SPA at http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:8000`. If port 5173 is occupied, Vite picks the next free port (e.g. 5174) — use whatever URL the terminal prints.

**Production build & local preview**

```bash
cd frontend
npm run build                        # type-checks (tsc -b) and bundles into dist/
npm run preview                      # serves dist/ at http://localhost:4173, /api proxied
```

Stop either server with `Ctrl-C`.

## 10. Available Scripts

### `frontend/package.json`
| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run build` | `tsc -b` type-check + production bundle into `dist/` |
| `npm run preview` | Serve the production bundle with the same `/api` proxy |
| `npm run lint` | ESLint (flat config; currently **0 errors**, 138 warnings in utility code) |
| `npm run test` | Vitest unit tests (48 tests over `lib/utils`) |
| `npm run test:ui` | Vitest browser UI |
| `npm run test:e2e` | Playwright runner (no E2E specs exist in the repo) |

### `backend/`
| Command | Purpose |
|---|---|
| `php artisan serve --port=8000` | API server |
| `php artisan migrate --seed` | Schema + demo data |
| `php artisan test` | Feature test suite (in-memory SQLite) |
| `php artisan migrate:fresh --seed` | Rebuild demo data (also refreshes rolling inventory) |

## 11. Configuration & Environment Variables

### `frontend/.env`
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `/api` | API base URL. Keep `/api` locally (dev/preview proxy); set an absolute URL for deployed builds |

### `backend/.env` (relevant keys)
| Variable | Default | Purpose |
|---|---|---|
| `DB_CONNECTION` | `sqlite` | SQLite file at `backend/database/database.sqlite`; switch to `mysql`/`pgsql` and re-migrate if preferred |
| `QUEUE_CONNECTION` | `database` | Mailables are queued. `sync` delivers inline; `database`/`redis` need a worker (`php artisan queue:work`) — see [Known Limitations](#15-known-limitations) |
| `APP_URL` | `http://localhost:8000` | Used for asset/links in PDFs and mail |
| `BOOKING_HOLD_DURATION_MINUTES` | config default 15 | Inventory hold window during checkout |

No secrets are required for local development; never commit real credentials.

## 12. User Workflows

### Booking journey (customer) — fully verified end-to-end
1. **Search** from the home widget or `/search` (destination/dates/guests are carried into every results page).
2. **Compare** results with filters/sorting; open a detail page (hotel/flight/venue) or add directly to the cart (train/bus/car/activity/transfer/package).
3. **Configure** — hotel: room + rate plan; flight: fare + seats; venue: package + add-ons with live total.
4. **Reserve** → the cart (persisted in localStorage) shows the item with an 18% tax + 2% service-fee estimate.
5. **Checkout** (login required): review → traveler details (first/last/email required, passport fields for flights) → payment method.
6. **Pay** — the demo gateway captures automatically; the UI polls payment status and redirects to the confirmation page with the booking reference and server-computed total.
7. **After booking** — download the invoice/voucher PDFs, view it in My Trips, cancel or reschedule while confirmed.

*Verification note:* this journey was completed twice from clean sessions during the audit (see `docs/test-coverage.md`). The demo gateway performs no real charge. One backend limitation currently prevents a manually-selected **hotel room** from being transmitted to the booking API (the server books the auto-selected first room); details in `docs/ui-audit.md` §5.

### Agent workflow
Log in as `agent@demo.com` → workspace with targets/pipeline dashboard, customer management, a multi-service booking workspace, quotes, bookings, commissions, tasks and support. The workspace's provider-search and multi-service actions are UI stubs (toast feedback) — creating a booking happens through the standard search/checkout flow.

### Admin workflow
Log in as `admin@demo.com` → console with KPI dashboard + revenue reports (range selector), management tables for customers/agents/bookings/suppliers/venues/hotels/transports, promotions, payments, refund approvals, commission approvals and audit logs. Destructive actions (delete customer/agent, refunds) use confirmation modals and were deliberately **not** executed during testing.

## 13. Responsive Design

Tested at **1440×900**, **768×1024** and **390×844** (plus programmatic horizontal-overflow checks on every route):

- Navigation collapses to a hamburger drawer below `lg` with all nine services (screenshot 66).
- Results pages swap the desktop filter sidebar for a slide-over Filters modal (screenshot 67).
- Admin/agent sidebars become slide-overs with a dimmed overlay (screenshot 70).
- Checkout, dashboards and detail pages stack to single columns (screenshots 64, 65, 68, 69).

A dashboard overflow defect at 390 px was found and fixed during the audit. No universal device compatibility is claimed beyond the tested viewports.

## 14. Testing & Quality Checks

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ clean |
| `npm run lint` | ✅ 0 errors (138 pre-existing warnings, documented) |
| `npm run test` | ✅ 48/48 unit tests |
| `npm run build` | ✅ production build succeeds |
| Browser coverage | ✅ 54/54 routes rendered & exercised; 2 full booking journeys; 3 viewports |

Detailed records: [`docs/test-coverage.md`](docs/test-coverage.md) (route matrix, interaction tests, observations) and [`docs/ui-audit.md`](docs/ui-audit.md) (29 defects found & fixed, with root causes). The complete image collection is embedded in [Section 3](#3-complete-screenshot-gallery) and catalogued in [`docs/screenshot-index.md`](docs/screenshot-index.md).

Manual browser testing and scripted checks were both used; the frontend has no component/E2E suite in the repo (Playwright is installed as tooling but contains no specs — the backend's `ApiSmokeTest` covers the API end-to-end).

## 15. Known Limitations

- **Hotel room selection is not transmitted to the booking API** — a backend defect in `DemoHotelProvider::checkAvailability()` rejects any explicit `room_type_id`, so the server books the first room (which the UI auto-selects by default). Flights (`fare_id`) and venues (`package_id`) transmit correctly. Requires a small backend fix; documented in `docs/ui-audit.md` §5.1.
- **My Trips dates** — `service_date` is never populated on booking items by the backend, so trip cards show "Dates on request" (`docs/ui-audit.md` §5.2).
- **Emails are queued but not delivered** in the default dev setup (`QUEUE_CONNECTION=database`, no worker running); the confirmation page's "email sent" copy assumes delivery.
- **Seed-data artefacts** — e.g. hotel addresses contain random placeholder text ("DPTwMiebuK Street"); inventory is date-bound and needs re-seeding.
- **UI stubs** (toast-only, by design): Google/Apple sign-in, map views, travel-insurance, hotel share/favourite, review editing, live chat, agent provider-search & multi-service workspace actions.
- **Footer placeholder links** (`#`) exist for pages that don't exist (Privacy Policy, Terms, Careers…).
- No automated browser-test suite ships with the frontend.

## 16. Development Guidelines

- **Start everything:** backend on `:8000`, frontend `npm run dev`. Keep `VITE_API_URL=/api`.
- **Before committing frontend changes:** `npx tsc -b`, `npm run lint`, `npm run test`, and `npm run build` should all pass (current state: all green).
- **Design system:** use the `eventra-*` Tailwind tokens and shared UI components in `src/components/ui/` — pages compose `Button`, `Card`, `Modal`, skeletons and the typography scale rather than ad-hoc styles.
- **Server state** goes through TanStack Query; **session/cart** through the Zustand stores. Don't call `axios` directly — use `src/lib/api.ts` (attaches the Bearer token and correlation IDs).
- **New pages** belong in `src/pages/<area>/`, get lazy-registered in `App.tsx`, and reuse `ProtectedRoute` plus the matching layout.
- **Testing boundaries:** keep the demo database clean — don't exercise destructive admin actions or external services; the demo gateway is safe.

## 17. License & Support

No licence file is present in the repository — all rights are reserved by the project owner until a licence is added. (The previous README claimed MIT; that claim was not backed by a `LICENSE` file.)

For issues or questions about this codebase, contact the repository owner. Documentation in this repository:

- [`docs/screenshot-index.md`](docs/screenshot-index.md) — catalogue of the screenshot collection
- [`docs/test-coverage.md`](docs/test-coverage.md) — what was tested and how
- [`docs/ui-audit.md`](docs/ui-audit.md) — every issue found and fixed, with root causes

---

**EventraOS** — one platform for travel, stays, events, transportation and experiences.
