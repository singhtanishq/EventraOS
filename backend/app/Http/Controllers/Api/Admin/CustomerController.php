<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::with(['user', 'assignedAgent.user'])->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        if ($status = $request->query('status')) {
            if ($status === 'vip') $query->where('is_vip', true);
            elseif ($status !== 'all') $query->whereHas('user', fn ($q) => $q->where('is_active', $status === 'active'));
        }

        $customers = $query->paginate($request->integer('per_page', 20))->through(fn ($c) => [
            'id' => $c->id,
            'uuid' => $c->uuid,
            'customer_number' => $c->customer_number,
            'user' => $c->user?->only(['name', 'email', 'phone', 'is_active']),
            'total_bookings' => $c->bookings()->count(),
            'completed_bookings' => $c->bookings()->where('status', 'completed')->count(),
            'cancelled_bookings' => $c->bookings()->where('status', 'cancelled')->count(),
            'total_spent' => (float) $c->bookings()->where('payment_status', 'paid')->sum('grand_total'),
            'loyalty_points' => (int) ($c->loyaltyAccount?->points_balance ?? 0),
            'assigned_agent' => $c->assignedAgent ? ['id' => $c->assignedAgent->id, 'agent_number' => $c->assignedAgent->agent_number, 'user' => ['name' => $c->assignedAgent->user?->name]] : null,
            'is_vip' => (bool) $c->is_vip,
            'status' => $c->user?->is_active ? 'active' : 'inactive',
            'created_at' => $c->created_at->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => ['customers' => collect($customers->items()), 'total_count' => $customers->total()]]);
    }

    public function show(Request $request, Customer $customer): JsonResponse
    {
        $customer->load(['user', 'assignedAgent.user', 'bookings', 'wallet', 'loyaltyAccount']);
        return response()->json(['success' => true, 'data' => $customer]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'is_vip' => 'sometimes|boolean',
            'assigned_agent_id' => 'sometimes|nullable|integer|exists:agents,id',
            'nationality' => 'sometimes|nullable|string|max:2',
            'risk_flags' => 'sometimes|nullable|array',
        ]);

        $customer->update($validated);
        return response()->json(['success' => true, 'message' => 'Customer updated.', 'data' => $customer->fresh()]);
    }

    public function destroy(Request $request, Customer $customer): JsonResponse
    {
        abort_unless($customer->bookings()->doesntExist(), 422, 'Customer has bookings and cannot be deleted. Deactivate instead.');
        $customer->user->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Customer deactivated.']);
    }
}
