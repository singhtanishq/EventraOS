<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedTraveler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedTravelerController extends Controller
{
    private function customer(Request $request)
    {
        $customer = $request->user()->customer;
        abort_unless($customer, 404, 'Customer profile not found.');
        return $customer;
    }

    public function index(Request $request): JsonResponse
    {
        $travelers = $this->customer($request)->savedTravelers()
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => ['travelers' => $travelers]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:10',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other',
            'nationality' => 'nullable|string|max:2',
            'passport_number' => 'nullable|string|max:50',
            'passport_expiry' => 'nullable|date|after:today',
            'passport_issuing_country' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'relationship' => 'nullable|in:self,spouse,child,parent,sibling,friend,colleague,other',
            'is_default' => 'boolean',
        ]);

        $traveler = $this->customer($request)->savedTravelers()->create($validated);

        return response()->json(['success' => true, 'message' => 'Traveler saved.', 'data' => $traveler], 201);
    }

    public function show(Request $request, SavedTraveler $traveler): JsonResponse
    {
        abort_unless($traveler->customer_id === $this->customer($request)->id, 403);
        return response()->json(['success' => true, 'data' => $traveler]);
    }

    public function update(Request $request, SavedTraveler $traveler): JsonResponse
    {
        abort_unless($traveler->customer_id === $this->customer($request)->id, 403);

        $validated = $request->validate([
            'title' => 'nullable|string|max:10',
            'first_name' => 'sometimes|required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other',
            'nationality' => 'nullable|string|max:2',
            'passport_number' => 'nullable|string|max:50',
            'passport_expiry' => 'nullable|date|after:today',
            'passport_issuing_country' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'relationship' => 'nullable|in:self,spouse,child,parent,sibling,friend,colleague,other',
            'is_default' => 'boolean',
        ]);

        $traveler->update($validated);

        return response()->json(['success' => true, 'message' => 'Traveler updated.', 'data' => $traveler->fresh()]);
    }

    public function destroy(Request $request, SavedTraveler $traveler): JsonResponse
    {
        abort_unless($traveler->customer_id === $this->customer($request)->id, 403);
        $traveler->delete();
        return response()->json(['success' => true, 'message' => 'Traveler deleted.']);
    }
}
