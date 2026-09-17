# EventraOS - Complete Travel & Events Booking Platform

> One platform for travel, stays, events, transportation and experiences.

## Overview

EventraOS is a comprehensive full-stack travel, hospitality, transportation, event, and booking management platform. It supports three primary user roles: **Customer**, **Agent**, and **Admin**, with a flexible permission system designed for extensibility.

## Features

### Core Booking Services
- **Hotels** - Search, compare, book with room selection, add-ons, cancellation policies
- **Flights** - Domestic/International, multi-city, seat selection, baggage, fare families
- **Trains** - Routes, classes, quotas, waitlist support
- **Buses** - Operators, bus types, seat maps, boarding/dropping points
- **Venues** - Weddings, conferences, corporate events with packages & custom configurator
- **Car Rentals** - Categories, transmissions, fuel types, driver options
- **Activities** - Sightseeing, adventures, cultural experiences, guided tours
- **Transfers** - Airport, city-to-city, hourly, shared/private options
- **Packages** - Curated bundles combining multiple services

### Platform Features
- **Unified Cart** - Combine multiple service types in one booking
- **Multi-step Checkout** - Travelers, add-ons, review, payment
- **Payment Engine** - Multiple providers, demo mode, state machine
- **Booking Lifecycle** - Hold, confirm, cancel, reschedule, refund
- **Provider Abstraction** - Pluggable adapters for external APIs
- **Multi-currency** - INR, USD, EUR, GBP, AED, SGD support
- **Loyalty Program** - Eventra Rewards with tiers
- **Promotions** - Coupons, discounts, stacking rules
- **Commissions** - Agent commissions with tiered rates
- **Notifications** - Email, SMS, in-app, push (architected)
- **Support** - Ticketing system with priorities
- **Reviews** - Post-trip verified reviews

### Role-Based Features

#### Customer
- Dashboard with trips, wallet, loyalty, favorites
- Search across all service types
- Booking management (cancel, reschedule, review)
- Wallet & loyalty points
- Saved travelers & favorites
- Support tickets

#### Agent
- Customer management
- Assisted booking workspace
- Quote generation
- Commission tracking
- Task management
- Support case handling

#### Admin
- KPI dashboard with charts
- Customer/Agent/Booking management
- Supplier & venue management
- Promotions & commission rules
- Reports & exports
- Audit logs & system health

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **React Router v6** for routing
- **TanStack Query** for server state
- **Zustand** for client state
- **React Hook Form + Zod** for forms
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Day Picker** for dates
- **Swiper** for carousels
- **React Hook Form** for forms

### Backend
- **Laravel 11** with PHP 8.3+
- **Laravel Sanctum** for authentication
- **Spatie Laravel Permission** for RBAC
- **Spatie Laravel Activitylog** for audit trails
- **MySQL** database
- **Redis** for caching/queues
- **Barryvdh DomPDF** for PDF generation
- **Maatwebsite Excel** for exports

## Getting Started

### Prerequisites
- PHP 8.3+
- Composer
- Node.js 18+
- MySQL 8.0+
- Redis (optional, for queues/cache)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd EventraOS
```

2. **Backend Setup**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure .env with database credentials
php artisan migrate --seed
php artisan serve
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Mailpit (email testing): http://localhost:8025

### Demo Credentials
After running seeders:
- **Customer**: customer@demo.com / password
- **Agent**: agent@demo.com / password
- **Admin**: admin@demo.com / password

## Project Structure

```
EventraOS/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── features/         # Feature-based modules
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Layout components
│   │   ├── lib/              # Utilities, API client
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                  # Laravel 11
│   ├── app/
│   │   ├── Console/          # Artisan commands
│   │   ├── Events/           # Event classes
│   │   ├── Http/
│   │   │   ├── Controllers/  # API controllers
│   │   │   ├── Middleware/   # Custom middleware
│   │   │   ├── Requests/     # Form requests
│   │   │   └── Resources/    # API resources
│   │   ├── Jobs/             # Queue jobs
│   │   ├── Listeners/        # Event listeners
│   │   ├── Models/           # Eloquent models
│   │   ├── Notifications/    # Notification classes
│   │   ├── Policies/         # Authorization policies
│   │   ├── Providers/        # Service providers
│   │   ├── Rules/            # Validation rules
│   │   ├── Services/         # Business logic services
│   │   └── Traits/           # Model traits
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   │   ├── factories/        # Model factories
│   │   ├── migrations/       # Database migrations
│   │   └── seeders/          # Database seeders
│   ├── routes/
│   │   ├── api.php           # API routes
│   │   ├── web.php           # Web routes
│   │   └── channels.php      # Broadcasting channels
│   ├── storage/
│   └── tests/
│
└── README.md
```

## Architecture Highlights

### Provider Abstraction Layer
All external integrations (flights, hotels, payments) use a provider adapter pattern:
```php
interface ProviderInterface {
    public function search(array $criteria): SearchResultCollection;
    public function getDetails(string $itemId): ProviderItemDetails;
    public function createHold(array $data): HoldResult;
    public function confirmBooking(string $holdRef, array $data): BookingConfirmation;
}
```

### Booking State Machine
```
DRAFT → HELD → PAYMENT_PENDING → PAYMENT_PROCESSING → CONFIRMED
                    ↓
              PAYMENT_FAILED → DRAFT
```

### Payment Flow
```
Booking → Payment Intent → Provider → Authorization → Capture → Confirmation
```

### Security Features
- Laravel Sanctum token authentication
- Role-based access control (Spatie Permission)
- Rate limiting on auth/payment endpoints
- CSRF protection
- Input validation & sanitization
- Audit logging for all critical operations
- 2FA support (TOTP)
- Secure password hashing (bcrypt)
- Audit trails for financial operations

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Current user

### Search
- `GET /api/search/hotels` - Hotel search
- `GET /api/search/flights` - Flight search
- `GET /api/search/trains` - Train search
- `GET /api/search/buses` - Bus search
- `GET /api/search/venues` - Venue search
- `GET /api/search/cars` - Car rental search
- `GET /api/search/activities` - Activity search
- `GET /api/search/transfers` - Transfer search
- `GET /api/search/packages` - Package search

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{id}` - Booking details
- `POST /api/bookings/{id}/cancel` - Cancel booking
- `POST /api/bookings/{id}/reschedule` - Reschedule booking

### Payments
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/{id}/process` - Process payment
- `POST /api/payments/{id}/refund` - Refund payment

### Admin
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/customers` - Manage customers
- `GET /admin/agents` - Manage agents
- `GET /admin/bookings` - Manage bookings
- `GET /admin/reports` - Reports & analytics

## Environment Variables

Key environment variables (see `.env.example`):

```env
APP_NAME=EventraOS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eventraos
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_FROM_ADDRESS=no-reply@eventraos.local
MAIL_FROM_NAME="EventraOS"

PROVIDER_MODE=demo
BOOKING_HOLD_DURATION_MINUTES=15
PAYMENT_TIMEOUT_MINUTES=10
DEFAULT_CURRENCY=INR
```

## Development

### Running Tests
```bash
# Backend
cd backend && php artisan test

# Frontend
cd frontend && npm run test
```

### Code Style
```bash
# Backend
cd backend && php artisan pint

# Frontend
cd frontend && npm run lint
```

### Database
```bash
# Fresh migration with seeding
cd backend && php artisan migrate:fresh --seed

# Create migration
cd backend && php artisan make:migration create_table_name
```

## Deployment

### Production Checklist
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure production database
- [ ] Set up Redis for queues/cache
- [ ] Configure production mail server
- [ ] Set up SSL certificates
- [ ] Configure CDN for assets
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan view:cache`
- [ ] Build frontend: `npm run build`

### Docker (Optional)
```dockerfile
# Example Dockerfile structure
FROM php:8.3-fpm
# Install dependencies
# Copy application
# Run migrations
# Start PHP-FPM
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@eventraos.com or create an issue in the repository.

## Acknowledgments

- Laravel Framework
- React & Vite Teams
- Tailwind CSS
- All open-source contributors

---

**EventraOS** - One platform for travel, stays, events, transportation and experiences.