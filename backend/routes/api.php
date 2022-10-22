<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SavedTravelerController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\PromotionController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
});

// Search (public, read-only, rate limited)
Route::prefix('search')->middleware('throttle:60,1')->group(function () {
    Route::get('/hotels', [SearchController::class, 'searchHotels']);
    Route::get('/flights', [SearchController::class, 'searchFlights']);
    Route::get('/trains', [SearchController::class, 'searchTrains']);
    Route::get('/buses', [SearchController::class, 'searchBuses']);
    Route::get('/venues', [SearchController::class, 'searchVenues']);
    Route::get('/cars', [SearchController::class, 'searchCars']);
    Route::get('/activities', [SearchController::class, 'searchActivities']);
    Route::get('/transfers', [SearchController::class, 'searchTransfers']);
    Route::get('/packages', [SearchController::class, 'searchPackages']);
    Route::get('/suggestions', [SearchController::class, 'getSuggestions']);
    Route::get('/popular', [SearchController::class, 'getPopularDestinations']);
});

// Inventory details (public)
Route::get('/hotels/{hotel}', [SearchController::class, 'getHotelDetails']);
Route::get('/flights/{flight}', [SearchController::class, 'getFlightDetails']);
Route::get('/venues/{venue}', [SearchController::class, 'getVenueDetails']);

// Promotions
Route::post('/promotions/validate', [PromotionController::class, 'validate'])->middleware('throttle:20,1');

// Payment methods (public catalog)
Route::get('/payment-methods', [PaymentController::class, 'methods']);

// Webhooks (signature-verified inside the controller)
Route::post('/webhooks/payment/{provider}', [PaymentController::class, 'webhook']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/2fa/enable', [AuthController::class, 'enable2FA']);
        Route::post('/2fa/verify', [AuthController::class, 'verify2FA']);
        Route::post('/2fa/disable', [AuthController::class, 'disable2FA']);
        Route::get('/sessions', [AuthController::class, 'getSessions']);
        Route::delete('/sessions/{session}', [AuthController::class, 'revokeSession']);
        Route::delete('/sessions', [AuthController::class, 'revokeAllSessions']);
    });

    // Bookings (any authenticated user owns/creates their own)
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/bookings/reference/{reference}', [BookingController::class, 'showByReference']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/hold', [BookingController::class, 'createHold']);
    Route::post('/bookings/{booking}/confirm', [BookingController::class, 'confirmBooking']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancelBooking']);
    Route::post('/bookings/{booking}/reschedule', [BookingController::class, 'rescheduleBooking']);
    Route::get('/bookings/{booking}/voucher', [BookingController::class, 'downloadVoucher']);
    Route::get('/bookings/{booking}/invoice', [BookingController::class, 'downloadInvoice']);

    // Payments
    Route::prefix('payments')->middleware('throttle:15,1')->group(function () {
        Route::post('/initiate', [PaymentController::class, 'initiate']);
        Route::post('/{payment}/process', [PaymentController::class, 'process']);
        Route::post('/{payment}/retry', [PaymentController::class, 'retry']);
        Route::get('/{payment}/status', [PaymentController::class, 'status']);
    });

    // Customer dashboard
    Route::prefix('customer')->group(function () {
        Route::get('/dashboard', [CustomerController::class, 'dashboard']);
        Route::get('/profile', [CustomerController::class, 'profile']);
        Route::put('/profile', [CustomerController::class, 'updateProfile']);
        Route::get('/trips', [CustomerController::class, 'trips']);
        Route::get('/wallet', [CustomerController::class, 'wallet']);
        Route::get('/loyalty', [CustomerController::class, 'loyalty']);
        Route::get('/coupons', [CustomerController::class, 'coupons']);
        Route::get('/favorites', [CustomerController::class, 'favorites']);
        Route::post('/favorites', [CustomerController::class, 'addFavorite']);
        Route::delete('/favorites/{favorite}', [CustomerController::class, 'removeFavorite']);
        Route::get('/reviews', [CustomerController::class, 'reviews']);
        Route::post('/reviews', [CustomerController::class, 'createReview']);
        Route::get('/support', [CustomerController::class, 'supportTickets']);
        Route::post('/support', [CustomerController::class, 'createSupportTicket']);
        Route::get('/notifications', [CustomerController::class, 'notifications']);
        Route::put('/notifications/read-all', [CustomerController::class, 'markAllNotificationsRead']);
        Route::put('/notifications/{notification}/read', [CustomerController::class, 'markNotificationRead']);
        Route::get('/security', [CustomerController::class, 'security']);
    });

    // Saved travelers
    Route::apiResource('customer/travelers', SavedTravelerController::class)
        ->only(['index', 'store', 'show', 'update', 'destroy']);

    // Agent routes (role:agent)
    Route::middleware('role:agent')->prefix('agent')->group(function () {
        Route::get('/dashboard', [AgentController::class, 'dashboard']);
        Route::get('/customers', [AgentController::class, 'customers']);
        Route::post('/customers', [AgentController::class, 'createCustomer']);
        Route::get('/bookings', [AgentController::class, 'bookings']);
        Route::post('/bookings', [AgentController::class, 'createBooking']);
        Route::get('/quotes', [AgentController::class, 'quotes']);
        Route::post('/quotes', [AgentController::class, 'createQuote']);
        Route::get('/commissions', [AgentController::class, 'commissions']);
        Route::get('/tasks', [AgentController::class, 'tasks']);
        Route::post('/tasks', [AgentController::class, 'createTask']);
        Route::put('/tasks/{task}', [AgentController::class, 'updateTask']);
        Route::get('/support', [AgentController::class, 'support']);
    });

    // Admin routes (role:admin)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/system-health', [AdminController::class, 'systemHealth']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);

        // Resource management
        Route::apiResource('customers', \App\Http\Controllers\Api\Admin\CustomerController::class)->only(['index', 'show', 'update', 'destroy']);
        Route::apiResource('agents', \App\Http\Controllers\Api\Admin\AgentController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
        Route::apiResource('bookings', \App\Http\Controllers\Api\Admin\BookingController::class)->only(['index', 'show', 'update']);
        Route::apiResource('suppliers', \App\Http\Controllers\Api\Admin\SupplierController::class);
        Route::apiResource('venues', \App\Http\Controllers\Api\Admin\VenueController::class);
        Route::apiResource('hotels', \App\Http\Controllers\Api\Admin\HotelController::class);
        Route::apiResource('promotions', \App\Http\Controllers\Api\Admin\PromotionController::class);
        Route::apiResource('payments', \App\Http\Controllers\Api\Admin\PaymentController::class)->only(['index', 'show']);
        Route::apiResource('refunds', \App\Http\Controllers\Api\Admin\RefundController::class)->only(['index', 'show', 'update']);
        Route::apiResource('commissions', \App\Http\Controllers\Api\Admin\CommissionController::class)->only(['index', 'show', 'update']);
    });
});
