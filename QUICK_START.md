# EventraOS Quick Start Guide

## Prerequisites
- Node.js 18+
- PHP 8.3+
- Composer
- MySQL 8.0+
- Redis (optional, for queues/cache)

## Quick Start (Docker - Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd EventraOS

# Start all services
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
# Then access:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - Mailpit (emails): http://localhost:8025
```

## Manual Setup

### Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
# DB_DATABASE=eventraos
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations and seeders
php artisan migrate --seed

# Start development server
php artisan serve
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE eventraos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
cd backend
php artisan migrate

# Seed demo data
php artisan db:seed
```

## Demo Credentials

After running seeders:

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@demo.com | password |
| Agent | agent@demo.com | password |
| Admin | admin@demo.com | password |

## Available Commands

### Backend
```bash
# Run tests
cd backend && php artisan test

# Run tests with coverage
cd backend && php artisan test --coverage

# Clear caches
cd backend && php artisan optimize:clear

# Create migration
cd backend && php artisan make:migration create_table_name

# Create model
cd backend && php artisan make:model ModelName -m

# Create controller
cd backend && php artisan make:controller Api/ControllerName --api

# Create seeder
cd backend && php artisan make:seeder SeederName

# Queue worker
cd backend && php artisan queue:work

# Scheduler
cd backend && php artisan schedule:work
```

### Frontend
```bash
# Run dev server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Run tests
cd frontend && npm run test

# Run tests with UI
cd frontend && npm run test:ui

# Run e2e tests
cd frontend && npm run test:e2e

# Lint
cd frontend && npm run lint

# Preview production build
cd frontend && npm run preview
```

## Environment Variables

### Backend (.env)
```env
APP_NAME=EventraOS
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

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
MAIL_FROM_NAME=EventraOS

PROVIDER_MODE=demo
BOOKING_HOLD_DURATION_MINUTES=15
PAYMENT_TIMEOUT_MINUTES=10
DEFAULT_CURRENCY=INR
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=EventraOS
VITE_APP_ENV=development
```

## Project Structure

```
EventraOS/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/       # 50+ reusable UI components
│   │   ├── features/         # Feature-based modules
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Layout components
│   │   ├── lib/              # Utilities, API client
│   │   ├── pages/            # 60+ page components
│   │   ├── services/         # API services
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx
│   └── package.json
│
├── backend/                  # Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Contracts/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── composer.json
│
├── docker-compose.yml
├── README.md
└── API_DOCUMENTATION.md
```

## Running Tests

```bash
# Backend tests
cd backend && php artisan test

# Frontend unit tests
cd frontend && npm run test

# Frontend e2e tests
cd frontend && npm run test:e2e
```

## Deployment

### Production Build
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Useful URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/api/documentation |
| Mailpit | http://localhost:8025 |
| phpMyAdmin | http://localhost:8080 (if enabled) |

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
docker-compose ps mysql

# Check logs
docker-compose logs mysql

# Reset database
docker-compose down -v
docker-compose up -d
```

### Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Cache Issues
```bash
cd backend
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

## Support

- Documentation: https://docs.eventraos.com
- API Reference: https://docs.eventraos.com/api
- Issues: https://github.com/eventraos/eventraos/issues
- Email: support@eventraos.com