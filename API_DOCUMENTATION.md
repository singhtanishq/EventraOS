# EventraOS - API Documentation

## Overview
EventraOS provides a comprehensive REST API for managing travel bookings, customers, agents, and administrative operations.

## Base URL
```
Production: https://api.eventraos.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication
All API endpoints require authentication via Laravel Sanctum tokens.

### Headers
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

### Token Types
- **Access Token**: Short-lived (2 hours), used for API requests
- **Refresh Token**: Long-lived (90 days), used to obtain new access tokens

## Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 requests | 1 minute |
| Register | 3 requests | 1 minute |
| OTP Requests | 3 requests | 1 minute |
| Password Reset | 3 requests | 1 hour |
| Booking Creation | 10 requests | 1 minute |
| Payment Processing | 5 requests | 1 minute |
| Search | 30 requests | 1 minute |
| General API | 100 requests | 1 minute |

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Error message"]
  },
  "correlation_id": "req_1234567890_abcdef"
}
```

### Pagination Response
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "current_page": 1,
    "data": [],
    "first_page_url": "url",
    "from": 1,
    "last_page": 10,
    "last_page_url": "url",
    "next_page_url": "url",
    "path": "url",
    "per_page": 20,
    "prev_page_url": null,
    "to": 20,
    "total": 200
  }
}
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/verify-email` | Verify email address |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/profile` | Update profile |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/2fa/enable` | Enable 2FA |
| POST | `/auth/2fa/verify` | Verify 2FA code |
| POST | `/auth/2fa/disable` | Disable 2FA |
| GET | `/auth/sessions` | Get active sessions |
| DELETE | `/auth/sessions/{id}` | Revoke session |
| DELETE | `/auth/sessions` | Revoke all sessions |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search/hotels` | Search hotels |
| GET | `/search/flights` | Search flights |
| GET | `/search/trains` | Search trains |
| GET | `/search/buses` | Search buses |
| GET | `/search/venues` | Search venues |
| GET | `/search/cars` | Search cars |
| GET | `/search/activities` | Search activities |
| GET | `/search/transfers` | Search transfers |
| GET | `/search/packages` | Search packages |
| GET | `/search/suggestions` | Get search suggestions |
| GET | `/search/popular` | Get popular destinations |
| GET | `/hotels/{id}` | Get hotel details |
| GET | `/flights/{id}` | Get flight details |
| GET | `/venues/{id}` | Get venue details |
| GET | `/hotels/{id}/availability` | Check hotel availability |
| GET | `/flights/{id}/availability` | Check flight availability |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | List user bookings |
| POST | `/bookings` | Create booking |
| GET | `/bookings/{id}` | Get booking details |
| POST | `/bookings/{id}/hold` | Create booking hold |
| POST | `/bookings/{id}/confirm` | Confirm booking |
| POST | `/bookings/{id}/cancel` | Cancel booking |
| POST | `/bookings/{id}/reschedule` | Reschedule booking |
| GET | `/bookings/{id}/voucher` | Download voucher |
| GET | `/bookings/{id}/invoice` | Download invoice |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/initiate` | Initiate payment |
| POST | `/payments/{id}/process` | Process payment |
| POST | `/payments/{id}/retry` | Retry failed payment |
| POST | `/payments/{id}/capture` | Capture authorized payment |
| POST | `/payments/{id}/refund` | Refund payment |
| GET | `/payments/{id}/status` | Get payment status |
| GET | `/payments/methods` | Get available payment methods |
| GET | `/payments/customer-methods` | Get customer's saved methods |

### Customer (Customer Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/profile` | Get profile |
| PUT | `/customer/profile` | Update profile |
| GET | `/customer/trips` | Get trips |
| GET | `/customer/wallet` | Get wallet |
| GET | `/customer/loyalty` | Get loyalty account |
| GET | `/customer/travelers` | Get saved travelers |
| POST | `/customer/travelers` | Add traveler |
| PUT | `/customer/travelers/{id}` | Update traveler |
| DELETE | `/customer/travelers/{id}` | Delete traveler |
| GET | `/customer/favorites` | Get favorites |
| POST | `/customer/favorites` | Add favorite |
| DELETE | `/customer/favorites/{id}` | Remove favorite |
| GET | `/customer/reviews` | Get reviews |
| POST | `/customer/reviews` | Create review |
| GET | `/customer/support` | Get support tickets |
| POST | `/customer/support` | Create support ticket |
| GET | `/customer/notifications` | Get notifications |
| PUT | `/customer/notifications/{id}/read` | Mark notification read |
| GET | `/customer/coupons` | Get coupons |

### Agent (Agent Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent/dashboard` | Get dashboard |
| GET | `/agent/customers` | Get assigned customers |
| POST | `/agent/customers` | Create customer |
| GET | `/agent/booking-workspace` | Get booking workspace |
| POST | `/agent/search` | Search for customer |
| GET | `/agent/bookings` | Get agent bookings |
| POST | `/agent/bookings` | Create booking |
| GET | `/agent/quotes` | Get quotes |
| POST | `/agent/quotes` | Create quote |
| GET | `/agent/commissions` | Get commissions |
| GET | `/agent/tasks` | Get tasks |
| POST | `/agent/tasks` | Create task |
| PUT | `/agent/tasks/{id}` | Update task |
| GET | `/agent/support` | Get support tickets |

### Admin (Admin Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Get dashboard |
| GET | `/admin/system-health` | Get system health |
| GET | `/admin/customers` | List customers |
| POST | `/admin/customers` | Create customer |
| GET | `/admin/customers/{id}` | Get customer |
| PUT | `/admin/customers/{id}` | Update customer |
| DELETE | `/admin/customers/{id}` | Delete customer |
| GET | `/admin/agents` | List agents |
| POST | `/admin/agents` | Create agent |
| GET | `/admin/agents/{id}` | Get agent |
| PUT | `/admin/agents/{id}` | Update agent |
| DELETE | `/admin/agents/{id}` | Delete agent |
| GET | `/admin/bookings` | List bookings |
| GET | `/admin/bookings/{id}` | Get booking |
| PUT | `/admin/bookings/{id}` | Update booking |
| POST | `/admin/bookings/{id}/cancel` | Cancel booking |
| POST | `/admin/bookings/{id}/refund` | Refund booking |
| GET | `/admin/suppliers` | List suppliers |
| POST | `/admin/suppliers` | Create supplier |
| GET | `/admin/suppliers/{id}` | Get supplier |
| PUT | `/admin/suppliers/{id}` | Update supplier |
| DELETE | `/admin/suppliers/{id}` | Delete supplier |
| GET | `/admin/venues` | List venues |
| GET | `/admin/hotels` | List hotels |
| GET | `/admin/transports` | List transports |
| GET | `/admin/promotions` | List promotions |
| POST | `/admin/promotions` | Create promotion |
| GET | `/admin/payments` | List payments |
| GET | `/admin/refunds` | List refunds |
| GET | `/admin/commissions` | List commissions |
| GET | `/admin/reports` | Get reports |
| GET | `/admin/audit-logs` | Get audit logs |
| GET | `/admin/settings` | Get settings |
| PUT | `/admin/settings` | Update settings |
| GET | `/admin/system-health` | Get system health |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/payment/{provider}` | Payment webhooks |
| POST | `/webhooks/provider/{provider}` | Provider webhooks |

## Data Models

### User
```json
{
  "id": 1,
  "uuid": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "avatar": "url",
  "role": "customer|agent|admin",
  "email_verified_at": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Booking
```json
{
  "id": 1,
  "uuid": "uuid",
  "booking_reference": "EVR-HTL-7X2M91",
  "status": "confirmed",
  "payment_status": "paid",
  "grand_total": 15000,
  "currency": "INR",
  "items": [
    {
      "item_type": "hotel",
      "service_name": "Grand Hotel Dubai",
      "total_price": 12000,
      "service_date": "2024-02-15",
      "service_end_date": "2024-02-18"
    }
  ],
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Payment
```json
{
  "id": 1,
  "uuid": "uuid",
  "payment_reference": "PAY-ABC123",
  "status": "captured",
  "amount": 15000,
  "currency": "INR",
  "payment_method": {
    "name": "Credit Card",
    "code": "card"
  },
  "processed_at": "2024-01-01T10:00:00Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Webhooks

### Payment Webhook
```json
{
  "event": "payment.captured",
  "data": {
    "payment_id": "PAY-ABC123",
    "booking_reference": "EVR-HTL-7X2M91",
    "amount": 15000,
    "currency": "INR",
    "status": "captured"
  },
  "timestamp": "2024-01-01T10:00:00Z",
  "signature": "sha256=..."
}
```

### Provider Webhook
```json
{
  "event": "booking.confirmed",
  "provider": "amadeus",
  "data": {
    "provider_booking_reference": "ABC123",
    "confirmation_number": "XYZ789",
    "status": "confirmed"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## SDKs & Libraries

### JavaScript/TypeScript
```bash
npm install @eventraos/sdk
```

```typescript
import { EventraOS } from '@eventraos/sdk';

const client = new EventraOS({
  apiKey: 'your-api-key',
  environment: 'production' // or 'sandbox'
});

// Search hotels
const hotels = await client.hotels.search({
  destination: 'Dubai',
  checkIn: '2024-02-15',
  checkOut: '2024-02-18',
  guests: { adults: 2, children: 0 }
});
```

### PHP
```bash
composer require eventraos/sdk
```

```php
use EventraOS\Client;

$client = new Client([
    'api_key' => 'your-api-key',
    'environment' => 'production'
]);

$hotels = $client->hotels()->search([
    'destination' => 'Dubai',
    'check_in' => '2024-02-15',
    'check_out' => '2024-02-18',
    'guests' => ['adults' => 2]
]);
```

## Testing

### Sandbox Environment
- Base URL: `https://api-sandbox.eventraos.com/api/v1`
- Test credentials provided onboarding
- All payments simulated
- Rate limits: 100 req/min

### Test Cards
| Number | Result |
|--------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient Funds |
| 4000 0000 0000 3220 | 3D Secure Required |

## Support
- Email: support@eventraos.com
- Documentation: https://docs.eventraos.com
- Status Page: https://status.eventraos.com
- API Status: https://api-status.eventraos.com