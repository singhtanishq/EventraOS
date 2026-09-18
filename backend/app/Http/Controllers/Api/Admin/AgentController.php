<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Agent::with('user')->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        if ($status = $request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        $agents = $query->paginate($request->integer('per_page', 20))->through(fn ($a) => [
            'id' => $a->id,
            'uuid' => $a->uuid,
            'agent_number' => $a->agent_number,
            'user' => $a->user?->only(['name', 'email', 'phone', 'is_active']),
            'employee_id' => $a->employee_id,
            'agency_name' => $a->agency_name,
            'agency_license' => $a->agency_license,
            'commission_rate' => (float) $a->commission_rate,
            'commission_type' => $a->commission_type,
            'monthly_target' => (float) $a->monthly_target,
            'status' => $a->status,
            'total_customers' => CustomerCount($a),
            'total_bookings' => $a->bookings()->count(),
            'total_commission' => (float) $a->commissions()->sum('commission_amount'),
            'created_at' => $a->created_at->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => ['agents' => collect($agents->items()), 'total_count' => $agents->total()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8',
            'employee_id' => 'nullable|string|max:50|unique:agents,employee_id',
            'agency_name' => 'nullable|string|max:255',
            'agency_license' => 'nullable|string|max:100',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'commission_type' => 'required|in:percentage,fixed,tiered',
            'monthly_target' => 'nullable|numeric|min:0',
        ]);

        $agent = DB::transaction(function () use ($validated) {
            $user = User::create([
                'uuid' => Str::uuid(),
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'agent',
            ]);

            $agent = Agent::create([
                'uuid' => Str::uuid(),
                'user_id' => $user->id,
                'agent_number' => 'AGT-' . strtoupper(Str::random(8)),
                'employee_id' => $validated['employee_id'] ?? null,
                'agency_name' => $validated['agency_name'] ?? null,
                'agency_license' => $validated['agency_license'] ?? null,
                'commission_rate' => $validated['commission_rate'],
                'commission_type' => $validated['commission_type'],
                'monthly_target' => $validated['monthly_target'] ?? 0,
                'status' => 'active',
            ]);

            $user->assignRole('agent');
            return $agent;
        });

        return response()->json(['success' => true, 'message' => 'Agent created.', 'data' => $agent->load('user')], 201);
    }

    public function show(Request $request, Agent $agent): JsonResponse
    {
        $agent->load('user');
        return response()->json(['success' => true, 'data' => $agent]);
    }

    public function update(Request $request, Agent $agent): JsonResponse
    {
        $validated = $request->validate([
            'commission_rate' => 'sometimes|numeric|min:0|max:100',
            'commission_type' => 'sometimes|in:percentage,fixed,tiered',
            'monthly_target' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:active,inactive,suspended,terminated',
            'agency_name' => 'sometimes|nullable|string|max:255',
        ]);

        $agent->update($validated);
        return response()->json(['success' => true, 'message' => 'Agent updated.', 'data' => $agent->fresh()]);
    }

    public function destroy(Request $request, Agent $agent): JsonResponse
    {
        $agent->update(['status' => 'terminated']);
        $agent->user->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Agent terminated.']);
    }
}
