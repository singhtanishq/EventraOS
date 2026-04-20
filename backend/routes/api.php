<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AdminController;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/auth/refresh', [AuthController::class, 'refresh']);

// Search routes (public)
Route::get('/search/hotels', [SearchController::class, 'searchHotels']);
Route::get('/search/flights', [SearchController::class, 'searchFlights']);
Route::get('/search/trains', [SearchController::class, 'searchTrains']);
Route::get('/search/buses', [SearchController::class, 'searchBuses']);
Route::get('/search/venues', [SearchController::class, 'searchVenues']);
Route::get('/search/cars', [SearchController::class, 'searchCars']);
Route::get('/search/activities', [SearchController::class, 'searchActivities']);
Route::get('/search/transfers', [SearchController::class, 'searchTransfers']);
Route::get('/search/packages', [SearchController::class, 'searchPackages']);
Route::get('/search/suggestions', [SearchController::class, 'getSuggestions']);
Route::get('/search/popular', [SearchController::class, 'getPopularDestinations']);

// Hotel detail
Route::get('/hotels/{hotel}', [SearchController::class, 'getHotelDetails']);
Route::get('/flights/{flight}', [SearchController::class, 'getFlightDetails']);
Route::get('/venues/{venue}', [SearchController::class, 'getVenueDetails']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/2fa/enable', [AuthController::class, 'enable2FA']);
    Route::post('/auth/2fa/verify', [AuthController::class, 'verify2FA']);
    Route::post('/auth/2fa/disable', [AuthController::class, 'disable2FA']);
    Route::get('/auth/sessions', [AuthController::class, 'getSessions']);
    Route::delete('/auth/sessions/{session}', [AuthController::class, 'revokeSession']);
    Route::delete('/auth/sessions', [AuthController::class, 'revokeAllSessions']);

    // Bookings
    Route::apiResource('bookings', BookingController::class)->only(['index', 'show', 'store']);
    Route::post('/bookings/{booking}/hold', [BookingController::class, 'createHold']);
    Route::post('/bookings/{booking}/confirm', [BookingController::class, 'confirmBooking']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancelBooking']);
    Route::post('/bookings/{booking}/reschedule', [BookingController::class, 'rescheduleBooking']);
    Route::get('/bookings/{booking}/voucher', [BookingController::class, 'downloadVoucher']);
    Route::get('/bookings/{booking}/invoice', [BookingController::class, 'downloadInvoice']);

    // Payments
    Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
    Route::post('/payments/{payment}/process', [PaymentController::class, 'process']);
    Route::post('/payments/{payment}/retry', [PaymentController::class, 'retry']);
    Route::post('/payments/{payment}/capture', [PaymentController::class, 'capture']);
    Route::post('/payments/{payment}/refund', [PaymentController::class, 'refund']);
    Route::get('/payments/{payment}/status', [PaymentController::class, 'status']);

    // Customer
    Route::get('/customer/profile', [CustomerController::class, 'profile']);
    Route::put('/customer/profile', [CustomerController::class, 'updateProfile']);
    Route::get('/customer/trips', [CustomerController::class, 'trips']);
    Route::get('/customer/wallet', [CustomerController::class, 'wallet']);
    Route::get('/customer/loyalty', [CustomerController::class, 'loyalty']);
    Route::get('/customer/travelers', [CustomerController::class, 'travelers']);
    Route::apiResource('customer/travelers', \App\Http\Controllers\Api\SavedTravelerController::class);
    Route::get('/customer/favorites', [CustomerController::class, 'favorites']);
    Route::post('/customer/favorites', [CustomerController::class, 'addFavorite']);
    Route::delete('/customer/favorites/{favorite}', [CustomerController::class, 'removeFavorite']);
    Route::get('/customer/reviews', [CustomerController::class, 'reviews']);
    Route::post('/customer/reviews', [CustomerController::class, 'createReview']);
    Route::get('/customer/support', [CustomerController::class, 'supportTickets']);
    Route::post('/customer/support', [CustomerController::class, 'createSupportTicket']);
    Route::get('/customer/notifications', [CustomerController::class, 'notifications']);
    Route::put('/customer/notifications/{notification}/read', [CustomerController::class, 'markNotificationRead']);

    // Agent routes
    Route::middleware('role:agent')->group(function () {
        Route::get('/agent/dashboard', [AgentController::class, 'dashboard']);
        Route::get('/agent/customers', [AgentController::class, 'customers']);
        Route::post('/agent/customers', [AgentController::class, 'createCustomer']);
        Route::get('/agent/bookings', [AgentController::class, 'bookings']);
        Route::post('/agent/bookings', [AgentController::class, 'createBooking']);
        Route::get('/agent/quotes', [AgentController::class, 'quotes']);
        Route::post('/agent/quotes', [AgentController::class, 'createQuote']);
        Route::get('/agent/commissions', [AgentController::class, 'commissions']);
        Route::get('/agent/tasks', [AgentController::class, 'tasks']);
        Route::post('/agent/tasks', [AgentController::class, 'createTask']);
        Route::put('/agent/tasks/{task}', [AgentController::class, 'updateTask']);
        Route::get('/agent/support', [AgentController::class, 'support']);
    });

    // Admin routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/system-health', [AdminController::class, 'systemHealth']);
        
        Route::apiResource('admin/customers', \App\Http\Controllers\Api\Admin\CustomerController::class);
        Route::apiResource('admin/agents', \App\Http\Controllers\Api\Admin\AgentController::class);
        Route::apiResource('admin/bookings', \App\Http\Controllers\Api\Admin\BookingController::class);
        Route::apiResource('admin/suppliers', \App\Http\Controllers\Api\Admin\SupplierController::class);
        Route::apiResource('admin/venues', \App\Http\Controllers\Api\Admin\VenueController::class);
        Route::apiResource('admin/hotels', \App\Http\Controllers\Api\Admin\HotelController::class);
        Route::apiResource('admin/promotions', \App\Http\Controllers\Api\Admin\PromotionController::class);
        Route::apiResource('admin/payments', \App\Http\Controllers\Api\Admin\PaymentController::class);
        Route::apiResource('admin/refunds', \App\Http\Controllers\Api\Admin\RefundController::class);
        Route::apiResource('admin/commissions', \App\Http\Controllers\Api\Admin\CommissionController::class);
        Route::get('/admin/reports', [AdminController::class, 'reports']);
        Route::get('/admin/audit-logs', [AdminController::class, 'auditLogs']);
        Route::get('/admin/settings', [AdminController::class, 'settings']);
        Route::put('/admin/settings', [AdminController::class, 'updateSettings']);
    });
});

// Webhook routes
Route::post('/webhooks/payment/{provider}', [PaymentController::class, 'webhook']);
Route::post('/webhooks/provider/{provider}', [BookingController::class, 'providerWebhook']);