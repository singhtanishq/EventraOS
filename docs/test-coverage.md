# EventraOS Test Coverage

This report records the testing actually performed during the October 2026 frontend audit. Everything ran locally: Laravel API (`php artisan serve --port=8000`, SQLite) and the Vite dev server (`npm run dev`, port 5173 — 5173 was occupied by another project, so EventraOS served on **5174**; the Vite proxy forwarded `/api` to the backend).

Automated checks were run with the project's own tooling (`tsc`, `eslint`, `vitest`, `vite build`). Browser testing was manual, driven through browser automation (Chromium) at desktop 1440×900, tablet 768×1024 and mobile 390×844.

---

## 1. Automated checks

| Check | Command | Baseline (before fixes) | Final (after fixes) |
|---|---|---|---|
| Type check | `npx tsc -b` | ✅ clean | ✅ clean |
| Lint | `npm run lint` | ❌ broken — ESLint 9 with no flat config, command could not run | ✅ runs; **0 errors**, 138 pre-existing warnings (utility code, documented in `ui-audit.md`) |
| Unit tests | `npx vitest run` | ❌ 12 failed / 35 passed (47) | ✅ **48/48 pass** |
| Production build | `npm run build` | not run at baseline | ✅ succeeds (~14 s, code-split chunks) |
| Backend API smoke | direct `curl` probes of `/api/search/*`, `/api/auth/*`, `/api/bookings`, `/api/payments`, `/api/bookings/{id}/invoice`, `/api/bookings/{id}/voucher` | — | ✅ all respond as documented (booking 500 only for the known backend `room_type_id` blocker, see `ui-audit.md` §5) |

The stale unit tests were asserting a US-format spec; they were updated to the app's real `en-IN` behaviour (see `ui-audit.md` M9). The one genuine bug they uncovered (`getRelativeTime` labelling 1-hour-old timestamps "Yesterday") was fixed in `src/lib/utils.ts`.

## 2. Routes discovered and tested

The route table (`frontend/src/App.tsx`) declares **54 distinct page views** across 3 layouts. Every one was opened, rendered-checked (heading + content + console errors), and exercised where interactive:

| Area | Routes | Result |
|---|---|---|
| Auth (3) | `/login`, `/register`, `/forgot-password` | ✅ all pass (validation, wrong-password error, real login for all 3 roles; `/forgot-password` was created during this audit — see `ui-audit.md` M4) |
| Public (2) | `/`, `/search` | ✅ pass |
| Service results (12) | `/hotels`, `/hotels/:id`, `/flights`, `/flights/:id`, `/trains`, `/buses`, `/venues`, `/venues/:id`, `/cars`, `/activities`, `/transfers`, `/packages` | ✅ all pass with live API data; `/venues?city=Delhi` correctly shows the empty state (no Delhi venues seeded) |
| Checkout (3) | `/checkout`, `/booking/payment/:id`, `/booking/confirmation/:reference` | ✅ all pass — full journey completed twice from clean sessions |
| Customer (12) | `/customer/dashboard`, `/trips`, `/bookings/:id`, `/wallet`, `/loyalty`, `/coupons`, `/favorites`, `/reviews`, `/notifications`, `/security`, `/travelers`, `/support` | ✅ all pass (booking detail initially crashed to a blank page — fixed, see `ui-audit.md` H4) |
| Agent (9) | `/agent`, `/agent/dashboard`, `/customers`, `/booking-workspace`, `/quotes`, `/bookings`, `/commissions`, `/tasks`, `/support` | ✅ all render and load live data |
| Admin (15) | `/admin`, `/admin/dashboard`, `/customers`, `/agents`, `/bookings`, `/suppliers`, `/venues`, `/hotels`, `/transports`, `/promotions`, `/payments`, `/refunds`, `/commissions`, `/reports`, `/audit-logs` | ✅ all render and load live data |
| Catch-all | `*` → `/` | ✅ verified (previously reachable via dead nav links, now all nav links are real) |

**Summary: 54 of 54 routes render and function; 0 blocked.**

## 3. Interaction and workflow tests

### Authentication
- Empty submit → inline zod errors ("valid email", "min 8 characters") ✅
- Wrong password → "Invalid credentials" toast ✅
- Correct login as customer, agent and admin → role-appropriate landing ✅
- Sign out (header menu) → `POST /auth/logout` + redirect to `/login` ✅ (behaviour fixed during audit)

### Search & discovery
- Homepage search widget carries destination/dates/guests to `/search` (fixed during audit) ✅
- `/search` Search button carries per-service params to each results page (fixed during audit) ✅
- Hotel/flight filters (price sliders, star/stops/cabin checkboxes) write URL params and refetch ✅
- Sort dropdowns write `sort` back to the URL ✅
- Pagination controls render (dataset ≤ 20 per page, so single pages — Prev/Next disabled state verified) ✅
- Empty state (venues in Delhi) with "Clear all filters" ✅

### Booking journey (executed twice, end to end)
1. Hotel results → detail (rooms + rates render — fixed during audit) ✅
2. Reserve → cart badge → checkout review step ✅
3. Traveler forms validated (first/last/email required) ✅
4. Payment method list (`GET /api/payment-methods`) → Pay ✅
5. Demo gateway capture → auto-redirect to `/booking/confirmation/{reference}` ✅
6. Confirmation shows server-authoritative pricing (₹64,795: 54,000 + 18% tax + 2% fee − 5 loyalty discount; the client estimate ₹64,800 differs only by the server-side loyalty discount) ✅
7. Download Invoice / Download Voucher return real PDFs (`%PDF-`) ✅ (both were broken before the audit)
8. My Trips lists the booking; detail page opens ✅

### Mutations exercised safely
- Promo apply/remove (UI state; validation toast on empty) ✅
- Mark notification read / mark all (API round-trip) ✅
- Admin/agent list modals opened; destructive actions (delete customer/agent, refunds) **not** executed — local demo data was preserved
- No external services were touched; the demo payment gateway runs fully locally

## 4. Responsive checks

| Viewport | Pages inspected | Findings |
|---|---|---|
| Desktop 1440×900 | all 54 routes | ✅ no overflow, no clipping |
| Tablet 768×1024 | home, hotel results | ✅ no horizontal overflow; filter sidebar collapses behind the Filters button |
| Mobile 390×844 | home, hotel results, hotel detail, checkout, customer dashboard, admin dashboard, mobile nav, mobile filter modal, admin sidebar | 1 defect found & fixed: customer dashboard overflowed (544 px doc width) — card rows now wrap. All other pages ≤ viewport width |

Programmatic overflow check (`document.scrollWidth > innerWidth`) run per page; mobile navigation drawer and admin sidebar slide-over verified open/closed.

## 5. Console / network observations

- Before fixes: repeated 401s from unauthenticated `/auth/me` calls and a hard redirect chain on public pages; `POST /api/bookings` 500 when a room selection was sent (backend issue, §5 of `ui-audit.md`).
- After fixes: no console errors during the full journey; network log clean except the known backend `room_type_id` 500, which only occurs when the (now-removed) hotel room id is sent.
- `/api/auth/me` is called twice per load (App boot + `useAuth` init) — harmless duplication, left as-is as both paths guard each other.

## 6. Manual vs automated

- **Automated:** type-check, lint, unit tests, production build, API probes, scripted overflow checks.
- **Manual/browser automation:** everything in §2–§4, including two full booking journeys, role switching (customer/agent/admin), and PDF download verification.
- The frontend has no component/E2E test suite in the repo (`@playwright/test` is installed but no tests exist); the vitest suite covers `lib/utils` only. No new test tooling was added.

## 7. Known limitations / remaining blockers

- Backend blocker preventing hotel room selection transmission (details and required backend change in `ui-audit.md` §5.1).
- `service_date` never populated by the backend → My Trips shows "Dates on request" (`ui-audit.md` §5.2).
- Emails queued, not delivered (`QUEUE_CONNECTION=database`, no worker).
- Stub features listed in `ui-audit.md` §5.5 are out of scope for a frontend audit.
- Destructive admin actions and real payments were deliberately not exercised.
