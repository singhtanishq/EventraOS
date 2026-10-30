# EventraOS UI Audit

This document records the genuine UI/UX issues found during the October 2026 frontend audit and the corrections made. Every issue below was reproduced in the running application (React dev server on `http://localhost:5174`, Laravel API on `http://localhost:8000`) before being fixed, and re-verified afterwards.

Severity scale: **Critical** (breaks a core user journey), **High** (major usability/correctness defect), **Medium** (noticeable quality/correctness issue), **Low** (polish).

---

## 1. Critical issues fixed

### C1. Guest users were kicked out of public pages (`/login?expired=1`)
- **Observed:** Opening any hotel/flight/venue detail page while logged out hard-redirected to `/login?expired=1`. Browsing as a guest was impossible.
- **Root cause:** `useAuth()`'s bootstrap effect checked `localStorage.getItem('eventraos-auth')` — the Zustand persist key, which exists as soon as any state has ever been written, even logged out. It therefore always called `GET /auth/me`, which 401s for guests, and the axios response interceptor turned every 401 into a hard redirect.
- **Fix:** `src/hooks/useAuth.ts` now reads the token from the store (`useAuthStore.getState().token`) and only verifies against the API when a token exists; `src/lib/api.ts` no longer hard-redirects on `/auth/me` failures (session checks degrade gracefully to a local logout).
- **Verified:** Guest can open `/hotels/4`, `/flights/150`, `/venues/4`; add-to-cart still prompts sign-in.

### C2. Logged-in users were silently logged out when opening detail pages
- **Observed:** Clicking a hotel result while logged in landed on `/login?expired=1`.
- **Root cause:** `GET /auth/me` returns `{ data: { user } }` with **no token**. `initAuth` called `setAuth(data.user, data.token)` with `token === undefined`, overwriting the persisted token; the next API request went out unauthenticated and the interceptor hard-redirected.
- **Fix:** `useAuth.ts` keeps the existing token when the `/auth/me` response does not include one (`setAuth(data.user, data.token || token)`).
- **Verified:** Login → open detail pages → session persists; booking flow completes.

### C3. Hotel detail page showed no rooms — hotel booking impossible
- **Observed:** "Select a room to see pricing" with no room list; the Reserve button never appeared.
- **Root cause:** The page read `hotel.room_types`, but the API returns rooms under `hotel.pricing.room_types`.
- **Fix:** Response is normalized once after fetch (`room_types = raw.room_types ?? raw.pricing?.room_types ?? []`) in `src/pages/hotels/HotelDetail.tsx`.
- **Verified:** Room cards, rate selection and the Reserve button render; end-to-end hotel booking completed.

### C4. Flight detail page showed no fares — flight booking impossible
- **Observed:** "No fares are currently available for this flight."
- **Root cause:** Same shape mismatch — fares live at `flight.pricing.fare_options`, the page read `flight.fare_options`.
- **Fix:** Normalized in `src/pages/flights/FlightDetail.tsx`; the selected `fare_id` is now included in cart metadata and forwarded to the booking API (server re-prices with the chosen fare).
- **Verified:** Three fare options render; booking with an explicit `fare_id` succeeds.

### C5. Venue detail page showed no packages or add-ons
- **Observed:** Package selector and add-on configurator were empty.
- **Root cause:** The page expected `venue.venue_packages` / `venue.venue_addons` / `venue.capacity` / `venue.rating`; the API nests them under `pricing.packages`, `pricing.addons` and `metadata.*` with a leaner field set.
- **Fix:** A `normalizeVenue()` adapter in `src/pages/venues/VenueDetail.tsx` maps the API response onto the page's interfaces (packages, add-ons, capacity, rating, review count, venue types, availability window).
- **Verified:** Packages, add-ons and live total render; venue booking with `package_id` succeeds.

### C6. Checkout was frozen on step 1 in the dev server
- **Observed:** "Continue to Traveler Details" did nothing in `npm run dev`; the stepper updated but the panel never swapped. The identical flow worked in the production build.
- **Root cause:** `AnimatePresence mode="wait"` combined with React StrictMode: the exiting step's exit animation completed but framer-motion never committed the unmount, so the next step never mounted. Only 3 of 57 `AnimatePresence` usages used `mode="wait"` — all three in core flows (Checkout, Login, PaymentProcessing).
- **Fix:** Removed `mode="wait"` from those three files (the enter/exit crossfade still runs).
- **Verified:** All three checkout steps, the login success swap and the payment-result states work in dev; full booking completed twice from a clean session.

## 2. High issues fixed

### H1. Hotel/flight/venue ratings showed 0.0 (0 reviews) on detail pages
- **Root cause:** Ratings live under `metadata.rating` / `metadata.review_count`; pages read top-level fields. The results pages showed the correct values (e.g. The Leela Palace ★ 4.6, 356 reviews) while the detail page showed ★ 0.0 (0 reviews).
- **Fix:** Detail pages fall back to `metadata`. **Verified:** Detail pages match the results-page values.

### H2. The logged-in user menu was entirely dead
- **Observed:** All seven customer links (`/dashboard`, `/trips`, `/wallet`, `/favorites`, `/support`, `/profile`, `/security`) pointed at non-existent routes; every one bounced to the homepage via the catch-all route.
- **Fix:** Rewired to the real `/customer/*` routes; removed the `Profile` entry (no profile page exists in the app); `Security` now points to `/customer/security` for all roles.
- **Verified:** Every dropdown item lands on a real page.

### H3. Search discarded everything the user typed
- **Observed:** Filling destination/dates/guests on the homepage widget or `/search`, then pressing Search, navigated to `/hotels` **with no query params**; results fell back to defaults.
- **Root cause:** Home's Search button was a bare `<Link to="/search">` around uncontrolled inputs; `SearchPage.handleSearch()` navigated to the service route without params.
- **Fix:** Home widget is controlled state and builds `/search?...`; `SearchPage` translates the unified form into each service page's real param contract (`check_in/check_out` for hotels, `departure_date` for flights, `event_date`/`guest_count` for venues, etc.) via `buildServiceParams()`. The bottom category cards carry context too; a dead icon-only button was removed.
- **Verified:** Search "Delhi, 5–8 Nov, 2 guests" on `/search` lands on `/hotels?destination=Delhi&check_in=2026-11-05&check_out=2026-11-08…` with correct results.

### H4. Booking detail page crashed to a blank screen
- **Observed:** `/customer/bookings/1` rendered an empty page (`#root` unmounted) — React 18 discards the tree on uncaught render errors and the app has no error boundary.
- **Root cause:** The API returns `travelers: null` on booking items; the component read `traveler.is_lead_guest` and `travelers.length` unguarded.
- **Fix:** The booking response is normalized once (nullable collections become `[]`, null traveler entries filtered); three render sites made null-safe.
- **Verified:** Booking detail renders for bookings with and without traveler records.

### H5. Voucher download hit a non-existent, unauthenticated endpoint
- **Observed:** "Download Voucher" always failed.
- **Root cause:** Raw `fetch('/api/vouchers/{id}/download')` — no such route exists (the real one is `GET /api/bookings/{booking}/voucher`), and the raw fetch carried no `Authorization` header while the route sits behind `auth:sanctum`.
- **Fix:** Voucher and invoice downloads in `BookingDetail.tsx` now use the authenticated axios client against `GET /api/bookings/{id}/voucher|invoice` and save the streamed PDF via an object URL. The dead `jspdf` import was removed.
- **Verified:** Both downloads return `%PDF-` payloads (invoice 4.3 KB, voucher 5.6 KB).

### H6. Venue packages were double-counted in the cart
- **Observed:** Adding a venue with a ₹1,080 package produced a cart line of ₹2,160 + taxes — the package was included both as `basePrice` and as a priced option.
- **Fix:** The package is the line's base price; only genuine add-ons are options. `package_id` is forwarded to the booking API (which re-prices the selected package).
- **Verified:** Cart shows the venue package once; server-side price matches.

## 3. Medium issues fixed

| # | Issue | Fix |
|---|---|---|
| M1 | Admin sidebar linked to non-existent `/admin/settings` and `/admin/system-health`; agent menu linked to non-existent `/customer/profile` | Dead entries removed; nav now matches the actual route table |
| M2 | Sign Out in all three layouts cleared state locally but never called `POST /auth/logout`, leaving the server token valid | All three layouts call the API, then clear state and navigate to `/login` |
| M3 | Visiting `/admin/*` as a non-admin rendered a **blank page** (`return null` in the layouts) | Wrong-role visits now redirect to `/` |
| M4 | "Forgot password?" linked to a non-existent `/forgot-password` | New `ForgotPassword` page + route using the existing `POST /auth/forgot-password` endpoint |
| M5 | Register's Terms/Privacy links went to non-existent routes | Rendered as plain text until real pages exist |
| M6 | My Trips rendered **"1 Jan 1970 – 1 Jan 1970"** when the API returns `start_date: null` (epoch artefact of `new Date(null)`) | Renders "Dates on request" when no date is present |
| M7 | Customer dashboard had horizontal overflow at 390 px (document 544 px vs 390 px viewport) — trip/booking card rows could not wrap | Rows use `flex-wrap`; date/traveler row wraps with `gap-y` |
| M8 | `useBookings` left `isLoading` stuck and never set `error` when the API failed | Error handled in `finally`, error state surfaced |
| M9 | 12 of 47 unit tests failed — they asserted a US-format spec (`Jan 15, 2024`, `$1,000.00`, `EVR-HTL-…`) while the app deliberately uses Indian formats (`en-IN`, 3-letter prefixes) | Tests updated to document the real behaviour; a genuine `getRelativeTime` precedence bug they exposed was fixed (see L4) |
| M10 | `npm run lint` was completely broken — ESLint 9 requires a flat config and none existed | Added `eslint.config.js` (TS + react-hooks + react-refresh); result: **0 errors**, 138 pre-existing warnings in utility code (documented baseline) |
| M11 | My Trips ignored the `?filter=upcoming` deep link sent by the dashboard's "Upcoming Trips" card | Initial filter state reads the URL param |

## 4. Low issues fixed

| # | Issue | Fix |
|---|---|---|
| L1 | Two `<Toaster>`s mounted (main.tsx + App.tsx) — every toast rendered twice | Duplicate removed |
| L2 | Cars/venues/activities/packages/My Trips referenced `/placeholder-*.jpg` files that do not exist → broken images whenever the API omits images | New `public/placeholder.svg` asset; all five references point at it |
| L3 | Notification bell in the admin/agent topbars displayed a hardcoded red "3" badge with no data | Misleading badge removed |
| L4 | `getRelativeTime` labelled a 1-hour-old notification "Yesterday" (day tier checked before hours, plus negative-floor rounding) | Rewritten to compare absolute differences, smallest unit first |
| L5 | Search page had an icon-only button with no handler | Removed |
| L6 | `vite preview` had no `/api` proxy, so production builds could not be exercised locally | `preview.proxy` added to `vite.config.ts` |
| L7 | Dead code quality errors blocked a clean lint run (`no-redeclare` in performance.ts, `Function` type, `require()` in bundle-analysis) | Fixed in place; lint is now error-free |

## 5. Known issues found but **not** fixed (outside the frontend boundary)

These require backend or seed-data changes and are recorded as blockers rather than silently papered over:

1. **Hotel room selection is not transmitted to the booking API.** The backend's `DemoHotelProvider::checkAvailability()` rejects **any** explicit `room_type_id` — it looks the id up on the bare `HotelRoomType` model, which has no `availability` attribute (that field is only assembled by the API layer), so availability is always `false` and `POST /api/bookings` returns 500 ("Service no longer available"). With no `room_type_id` the server falls back to the **first** room. Because the UI auto-selects the first available room, the default flow prices consistently — but a manually selected room is not what gets booked. Sending `fare_id` (flights) and `package_id` (venues) works correctly. **Required backend fix:** `checkAvailability` should read the room from the already-fetched details collection (`collect($details->getPricing()['room_types'])->firstWhere('id', $roomTypeId)`) exactly as `BookingService::calculateItemPrice()` already does. The frontend plumbing to send the id exists and is ready.
2. **`service_date` is never populated on booking items**, so `GET /api/customer/trips` returns `start_date: null` and My Trips cannot show real dates (now rendered as "Dates on request" instead of "1 Jan 1970"). Backend should derive it from the item `configuration`.
3. **Seed-data quality:** the hotel detail address renders "DPTwMiebuK Street, Delhi" — randomised placeholder text from the seeder, not a frontend defect.
4. **Footer placeholder links** (Cancellation Policy, FAQs, About Us, Careers, Privacy Policy, Terms of Service) point at `#` — no such pages exist anywhere in the app.
5. **Stub features by design** (toast-only): Google/Apple sign-in, map views on hotel/venue results, flight travel insurance, hotel share/favourite buttons, review editing, live chat, agent "provider search" and "add another service" in the booking workspace.
6. **Emails are queued but never delivered** in the default dev setup (`QUEUE_CONNECTION=database`, no worker running); the confirmation page's "email has been sent" copy is aspirational.
7. **Demo inventory is date-bound.** Seeders generate rolling inventory from the seed date; searches for past windows return empty results (the app clamps default dates forward via `toSearchDate`).

## 6. Verification

After the fixes: `tsc -b` clean, ESLint **0 errors** (138 warnings, pre-existing), **48/48 unit tests pass**, production build succeeds, and the full booking journey (search → detail → cart → travelers → payment → demo-gateway capture → confirmation → PDF invoice/voucher → My Trips) completes end-to-end twice from clean sessions.
