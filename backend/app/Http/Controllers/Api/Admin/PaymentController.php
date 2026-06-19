<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['booking', 'customer.user', 'paymentMethod'])->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->where('payment_reference', 'like', "%{$search}%");
        }

        if ($status = $request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        $payments = $query->paginate($request->integer('per_page', 20))->through(fn ($p) => [
            'id' => $p->id,
            'uuid' => $p->uuid,
            'payment_reference' => $p->payment_reference,
            'booking_reference' => $p->booking?->booking_reference,
            'customer_name' => $p->customer?->user?->name ?? '—',
            'payment_method_name' => $p->paymentMethod?->name ?? '—',
            'status' => $p->status,
            'amount' => (float) $p->amount,
            'currency' => $p->currency,
            'gateway_status' => $p->gateway_status,
            'initiated_at' => $p->initiated_at->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => ['payments' => collect($payments->items()), 'total_count' => $payments->total()]]);
    }

    public function show(Request $request, Payment $payment): JsonResponse
    {
        $payment->load(['booking', 'customer.user', 'paymentMethod', 'attempts', 'refunds']);
        return response()->json(['success' => true, 'data' => $payment]);
    }
}
