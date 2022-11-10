<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Commission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Commission::with(['agent.user', 'booking'])->orderBy('created_at', 'desc');

        if ($status = $request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($search = $request->query('search')) {
            $query->where('commission_reference', 'like', "%{$search}%");
        }

        $commissions = $query->paginate($request->integer('per_page', 20))->through(fn ($c) => [
            'id' => $c->id,
            'uuid' => $c->uuid,
            'commission_reference' => $c->commission_reference,
            'booking_reference' => $c->booking?->booking_reference,
            'agent_name' => $c->agent?->user?->name ?? '—',
            'agent_number' => $c->agent?->agent_number ?? '—',
            'customer_name' => $c->booking?->customer?->user?->name ?? '—',
            'status' => $c->status,
            'booking_amount' => (float) $c->booking_amount,
            'commission_rate' => (float) $c->commission_rate,
            'commission_amount' => (float) $c->commission_amount,
            'net_commission' => (float) $c->net_commission,
            'currency' => $c->currency,
            'eligible_date' => $c->eligible_date?->toDateString(),
            'created_at' => $c->created_at->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => ['commissions' => collect($commissions->items()), 'total_count' => $commissions->total()]]);
    }

    public function show(Request $request, Commission $commission): JsonResponse
    {
        $commission->load(['agent.user', 'booking']);
        return response()->json(['success' => true, 'data' => $commission]);
    }

    public function update(Request $request, Commission $commission): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:eligible,approved,paid,reversed,on_hold',
            'payout_reference' => 'required_if:status,paid|nullable|string|max:100',
        ]);

        DB::transaction(function () use ($commission, $validated, $request) {
            $updateData = ['status' => $validated['status']];

            if ($validated['status'] === 'approved') {
                $updateData['approved_at'] = now();
                $updateData['approved_by'] = $request->user()->id;
            }

            if ($validated['status'] === 'paid') {
                $updateData['paid_at'] = now();
                $updateData['paid_by'] = $request->user()->id;
                $updateData['payout_reference'] = $validated['payout_reference'] ?? null;
            }

            if ($validated['status'] === 'reversed') {
                $updateData['reversed_at'] = now();
                $updateData['reversal_reason'] = 'Admin action';
                $updateData['reversed_by'] = $request->user()->id;
            }

            $commission->update($updateData);
        });

        return response()->json(['success' => true, 'message' => 'Commission updated.', 'data' => $commission->fresh()]);
    }
}
