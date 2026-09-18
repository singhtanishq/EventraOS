<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PromotionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Promotion::query()->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            match ($status) {
                'active' => $query->where('is_active', true),
                'inactive' => $query->where('is_active', false),
                'featured' => $query->where('is_featured', true),
                default => null,
            };
        }

        if ($type = $request->query('type') && $request->query('type') !== 'all') {
            $query->where('type', $request->query('type'));
        }

        $promotions = $query->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => ['promotions' => collect($promotions->items()), 'total_count' => $promotions->total()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'type' => 'required|in:percentage_discount,fixed_discount,cashback,loyalty_bonus,free_addon,upgrade,early_bird,last_minute,group_discount',
            'value' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'applicable_to' => 'sometimes|string|max:50',
            'min_booking_value' => 'nullable|integer|min:0',
            'max_discount_amount' => 'nullable|integer|min:0',
            'usage_limit_total' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'sometimes|integer|min:1',
            'valid_from' => 'required|date',
            'valid_to' => 'required|date|after:valid_from',
            'requires_promo_code' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
        ]);

        $promotion = Promotion::create($validated + [
            'promo_code' => ($validated['requires_promo_code'] ?? false) ? strtoupper(Str::random(8)) : null,
            'usage_limit_per_customer' => $validated['usage_limit_per_customer'] ?? 1,
        ]);

        return response()->json(['success' => true, 'message' => 'Promotion created.', 'data' => $promotion], 201);
    }

    public function show(Request $request, Promotion $promotion): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $promotion]);
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:2000',
            'value' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
            'valid_from' => 'sometimes|date',
            'valid_to' => 'sometimes|date|after:valid_from',
        ]);

        $promotion->update($validated);
        return response()->json(['success' => true, 'message' => 'Promotion updated.', 'data' => $promotion->fresh()]);
    }

    public function destroy(Request $request, Promotion $promotion): JsonResponse
    {
        $promotion->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Promotion deactivated.']);
    }
}
