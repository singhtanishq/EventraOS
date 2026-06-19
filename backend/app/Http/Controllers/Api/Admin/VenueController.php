<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VenueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Venue::with('city.country')->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            match ($status) {
                'active' => $query->where('is_active', true),
                'inactive' => $query->where('is_active', false),
                'featured' => $query->where('is_featured', true),
                'demo' => $query->where('is_demo', true),
                default => null,
            };
        }

        $venues = $query->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => ['venues' => collect($venues->items()), 'total_count' => $venues->total()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city_id' => 'required|integer|exists:cities,id',
            'address' => 'required|string|max:500',
            'description' => 'nullable|string|max:5000',
            'total_capacity' => 'required|integer|min:1',
            'venue_types' => 'nullable|array',
        ]);

        $venue = Venue::create($validated + ['is_active' => true, 'is_demo' => true]);
        return response()->json(['success' => true, 'message' => 'Venue created.', 'data' => $venue], 201);
    }

    public function show(Request $request, Venue $venue): JsonResponse
    {
        $venue->load(['city.country', 'rooms', 'packages', 'addons']);
        return response()->json(['success' => true, 'data' => $venue]);
    }

    public function update(Request $request, Venue $venue): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:5000',
            'total_capacity' => 'sometimes|integer|min:1',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
        ]);

        $venue->update($validated);
        return response()->json(['success' => true, 'message' => 'Venue updated.', 'data' => $venue->fresh()]);
    }

    public function destroy(Request $request, Venue $venue): JsonResponse
    {
        $venue->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Venue deactivated.']);
    }
}
