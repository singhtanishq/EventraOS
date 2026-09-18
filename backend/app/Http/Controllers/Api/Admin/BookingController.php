<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with(['items', 'customer.user'])->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->where('booking_reference', 'like', "%{$search}%");
        }

        if ($status = $request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($type = $request->query('type') && $request->query('type') !== 'all') {
            $query->whereHas('items', fn ($q) => $q->where('item_type', $request->query('type')));
        }

        $bookings = $query->paginate($request->integer('per_page', 20))->through(fn ($b) => [
            'id' => $b->id,
            'uuid' => $b->uuid,
            'booking_reference' => $b->booking_reference,
            'customer_name' => $b->customer?->user?->name ?? '—',
            'customer_email' => $b->customer?->user?->email ?? '—',
            'items' => $b->items->map(fn ($i) => ['id' => $i->id, 'item_type' => $i->item_type, 'service_name' => $i->service_name, 'service_date' => $i->service_date?->toDateString()]),
            'status' => $b->status,
            'payment_status' => $b->payment_status,
            'grand_total' => (float) $b->grand_total,
            'currency' => $b->currency,
            'amount_paid' => (float) $b->amount_paid,
            'amount_refunded' => (float) $b->amount_refunded,
            'created_at' => $b->created_at->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => ['bookings' => collect($bookings->items()), 'total_count' => $bookings->total()]]);
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $booking->load(['items.provider', 'items.guests', 'customer.user', 'payments.paymentMethod', 'refunds', 'cancellations']);
        return response()->json(['success' => true, 'data' => $booking]);
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:confirmed,cancelled,completed',
            'internal_notes' => 'sometimes|nullable|array',
        ]);

        $booking->update($validated);
        return response()->json(['success' => true, 'message' => 'Booking updated.', 'data' => $booking->fresh()]);
    }
}
