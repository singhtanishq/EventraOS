<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Hotel::with('city.country')->orderBy('created_at', 'desc');

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

        if ($star = $request->query('star') && $request->query('star') !== 'all') {
            $query->where('star_rating', $request->integer('star'));
        }

        $hotels = $query->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => ['hotels' => collect($hotels->items()), 'total_count' => $hotels->total()]]);
    }

    public function show(Request $request, Hotel $hotel): JsonResponse
    {
        $hotel->load(['city.country', 'roomTypes']);
        return response()->json(['success' => true, 'data' => $hotel]);
    }

    public function update(Request $request, Hotel $hotel): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
        ]);

        $hotel->update($validated);
        return response()->json(['success' => true, 'message' => 'Hotel updated.', 'data' => $hotel->fresh()]);
    }

    public function destroy(Request $request, Hotel $hotel): JsonResponse
    {
        $hotel->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Hotel deactivated.']);
    }
}
