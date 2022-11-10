<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RefundController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Refund::with(['booking', 'customer.user'])->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->where('refund_reference', 'like', "%{$search}%");
        }

        if ($status = $request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        $refunds = $query->paginate($request->integer('per_page', 20))->through(fn ($r) => [
            'id' => $r->id,
            'uuid' => $r->uuid,
            'refund_reference' => $r->refund_reference,
            'booking_reference' => $r->booking?->booking_reference,
            'customer_name' => $r->customer?->user?->name ?? '—',
            'refund_type' => $r->refund_type,
            'reason' => $r->reason,
            'status' => $r->status,
            'requested_amount' => (float) $r->requested_amount,
            'approved_amount' => $r->approved_amount !== null ? (float) $r->approved_amount : null,
            'net_refund' => $r->net_refund !== null ? (float) $r->net_refund : null,
            'currency' => $r->currency,
            'created_at' => $r->created_at->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => ['refunds' => collect($refunds->items()), 'total_count' => $refunds->total()]]);
    }

    public function show(Request $request, Refund $refund): JsonResponse
    {
        $refund->load(['booking', 'customer.user', 'payment']);
        return response()->json(['success' => true, 'data' => $refund]);
    }

    public function update(Request $request, Refund $refund): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected,processing,completed',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:1000',
            'approved_amount' => 'sometimes|numeric|min:0',
        ]);

        DB::transaction(function () use ($refund, $validated, $request) {
            $updateData = ['status' => $validated['status'], 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()];

            if (isset($validated['approved_amount'])) {
                $updateData['approved_amount'] = $validated['approved_amount'];
            }

            if ($validated['status'] === 'rejected') {
                $updateData['rejection_reason'] = $validated['rejection_reason'] ?? null;
            }

            if ($validated['status'] === 'completed') {
                $updateData['processed_amount'] = $validated['approved_amount'] ?? $refund->requested_amount;
                $updateData['net_refund'] = $validated['approved_amount'] ?? $refund->requested_amount;
                $updateData['processed_at'] = now();

                // Update the parent payment
                $refund->payment?->update(['status' => 'refunded', 'refunded_at' => now()]);
            }

            $refund->update($updateData);
        });

        return response()->json(['success' => true, 'message' => 'Refund updated.', 'data' => $refund->fresh()]);
    }
}
