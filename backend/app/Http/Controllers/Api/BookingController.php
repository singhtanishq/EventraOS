<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\BookingHold;
use App\Models\Payment;
use App\Models\Customer;
use App\Models\Provider;
use App\Services\Booking\BookingService;
use App\Services\Payment\PaymentService;
use App\Services\Providers\ProviderManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    protected BookingService $bookingService;
    protected PaymentService $paymentService;
    protected ProviderManager $providerManager;
    protected \App\Services\PDF\PDFService $pdfService;

    public function __construct(
        BookingService $bookingService,
        PaymentService $paymentService,
        ProviderManager $providerManager,
        \App\Services\PDF\PDFService $pdfService
    ) {
        $this->bookingService = $bookingService;
        $this->paymentService = $paymentService;
        $this->providerManager = $providerManager;
        $this->pdfService = $pdfService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found',
            ], 404);
        }

        $query = Booking::with(['items', 'payments'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->whereHas('items', function ($q) use ($request) {
                $q->where('item_type', $request->type);
            });
        }

        $perPage = $request->get('per_page', 15);
        $bookings = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.item_type' => 'required|in:hotel,flight,train,bus,venue,car,activity,transfer,package',
            'items.*.service_id' => 'required|integer',
            'items.*.configuration' => 'sometimes|array',
            'items.*.travelers' => 'sometimes|array',
            'items.*.travelers.*.first_name' => 'required|string',
            'items.*.travelers.*.last_name' => 'required|string',
            'items.*.travelers.*.email' => 'required|email',
            'items.*.travelers.*.phone' => 'sometimes|string',
            'special_requests' => 'sometimes|array',
            'promo_code' => 'sometimes|string',
            'currency' => 'sometimes|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $customer = $user->customer;

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found',
            ], 404);
        }

        try {
            $booking = DB::transaction(function () use ($request, $customer) {
                return $this->bookingService->createBooking($customer, $request->all());
            });

            // Load relationships for response
            $booking->load(['items', 'payments', 'customer']);

            return response()->json([
                'success' => true,
                'message' => 'Booking created successfully',
                'data' => $booking,
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create booking: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, Booking $booking)
    {
        $user = $request->user();
        
        // Check authorization
        if ($user->hasRole('customer') && $booking->customer_id !== $user->customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $booking->load([
            'items.provider',
            'items.guests',
            'items.holds',
            'payments.paymentMethod',
            'refunds',
            'cancellations',
            'reschedules',
            'invoices',
            'customer.user',
            'agent.user',
        ]);

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    public function createHold(Request $request, Booking $booking)
    {
        $user = $request->user();
        
        if ($user->hasRole('customer') && $booking->customer_id !== $user->customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        if (!in_array($booking->status, ['draft', 'payment_pending'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot create hold for this booking status',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'exists:booking_items,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $holds = [];
        
        foreach ($validator->validated()['item_ids'] as $itemId) {
            $item = $booking->items()->find($itemId);
            
            if (!$item) continue;

            $provider = $item->provider ?? $this->providerManager->getProvider($item->item_type);
            
            if (!$provider) {
                return response()->json([
                    'success' => false,
                    'message' => "No provider available for {$item->item_type}",
                ], 422);
            }

            $holdResult = $provider->createHold([
                'booking_reference' => $booking->booking_reference,
                'items' => [$item->toArray()],
            ]);

            if ($holdResult->isSuccessful()) {
                $hold = BookingHold::create([
                    'booking_id' => $booking->id,
                    'booking_item_id' => $item->id,
                    'provider_id' => $provider->provider->id,
                    'provider_hold_reference' => $holdResult->getHoldReference(),
                    'expires_at' => $holdResult->getExpiresAt(),
                    'status' => 'active',
                    'held_inventory' => $holdResult->getHeldItems(),
                ]);
                $holds[] = $hold;
            }
        }

        if (!empty($holds)) {
            $booking->update([
                'status' => 'held',
                'hold_expires_at' => collect($holds)->min('expires_at'),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Hold created successfully',
            'data' => $holds,
        ]);
    }

    public function confirmBooking(Request $request, Booking $booking)
    {
        $user = $request->user();
        
        if ($user->hasRole('customer') && $booking->customer_id !== $user->customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($booking->status !== 'held') {
            return response()->json([
                'success' => false,
                'message' => 'Booking must be in held status to confirm',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'payment_id' => 'sometimes|exists:payments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $confirmedBooking = DB::transaction(function () use ($booking, $request) {
                return $this->bookingService->confirmBooking($booking, $request->all());
            });

            return response()->json([
                'success' => true,
                'message' => 'Booking confirmed successfully',
                'data' => $confirmedBooking->load(['items', 'payments']),
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm booking: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function cancelBooking(Request $request, Booking $booking)
    {
        $user = $request->user();
        
        if ($user->hasRole('customer') && $booking->customer_id !== $user->customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        if (!$booking->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'This booking cannot be cancelled',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
            'item_ids' => 'sometimes|array', // For partial cancellation
            'item_ids.*' => 'exists:booking_items,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $cancelledBooking = DB::transaction(function () use ($booking, $request) {
                return $this->bookingService->cancelBooking($booking, $request->all());
            });

            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully',
                'data' => $cancelledBooking->load(['items', 'refunds']),
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel booking: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function rescheduleBooking(Request $request, Booking $booking)
    {
        $user = $request->user();
        
        if ($user->hasRole('customer') && $booking->customer_id !== $user->customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        if (!$booking->canBeRescheduled()) {
            return response()->json([
                'success' => false,
                'message' => 'This booking cannot be rescheduled',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'item_id' => 'required|exists:booking_items,id',
            'new_service_date' => 'required|date|after_or_equal:today',
            'new_service_time' => 'sometimes|date_format:H:i',
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $rescheduledBooking = DB::transaction(function () use ($booking, $request) {
                return $this->bookingService->rescheduleBooking($booking, $request->all());
            });

            return response()->json([
                'success' => true,
                'message' => 'Reschedule requested successfully',
                'data' => $rescheduledBooking->load(['items', 'reschedules']),
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reschedule booking: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function downloadVoucher(Request $request, Booking $booking)
    {
        $user = $request->user();
        
        if ($user->hasRole('customer') && $booking->customer_id !== $user->customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        if (!$booking->isConfirmed()) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher only available for confirmed bookings',
            ], 422);
        }

        $pdf = $this->bookingService->generateVoucher($booking);

        return response()->streamDownload(function () use ($pdf) {
            echo $pdf->output();
        }, "voucher-{$booking->booking_reference}.pdf");
    }

    public function downloadInvoice(Request $request, Booking $booking)
    {
        $user = $request->user();

        if ($user->hasRole('customer') && $booking->customer_id !== $user->customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $invoice = \App\Models\Invoice::where('booking_id', $booking->id)->latest()->first();

        if (!$invoice) {
            $invoice = $this->bookingService->generateInvoice($booking);
        }

        $pdf = $this->pdfService->generateInvoiceStream($invoice);

        return response()->streamDownload(function () use ($pdf) {
            echo $pdf->output();
        }, "invoice-{$booking->booking_reference}.pdf");
    }

    public function providerWebhook(Request $request, string $providerCode)
    {
        $provider = Provider::where('code', $providerCode)->first();

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Unknown provider',
            ], 404);
        }

        // Verify webhook signature
        if (!$this->verifyWebhookSignature($provider, $request)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid signature',
            ], 401);
        }

        // Process webhook based on event type
        $eventType = $request->header('X-Event-Type') ?? $request->input('event_type');
        
        $this->bookingService->handleProviderWebhook($provider, $eventType, $request->all());

        return response()->json([
            'success' => true,
            'message' => 'Webhook processed',
        ]);
    }

    protected function verifyWebhookSignature(Provider $provider, Request $request): bool
    {
        // Implement signature verification based on provider
        return true;
    }
}