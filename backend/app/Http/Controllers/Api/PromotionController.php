<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use App\Services\Currency\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'cart_total' => 'required|numeric|min:0',
        ]);

        $promotion = Promotion::where('is_active', true)
            ->where(function ($q) use ($validated) {
                $q->where('promo_code', $validated['code'])
                  ->orWhere('slug', $validated['code']);
            })
            ->where('valid_from', '<=', now()->toDateString())
            ->where('valid_to', '>=', now()->toDateString())
            ->first();

        if (! $promotion) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired promo code.'], 422);
        }

        if ($promotion->usage_limit_total && $promotion->used_count >= $promotion->usage_limit_total) {
            return response()->json(['success' => false, 'message' => 'This promo code has reached its usage limit.'], 422);
        }

        $cartTotal = (float) $validated['cart_total'];

        if ($promotion->min_booking_value && $cartTotal < $promotion->min_booking_value) {
            $formatted = (new CurrencyService())->format($promotion->min_booking_value, $promotion->currency);
            return response()->json(['success' => false, "message" => "Minimum booking value of {$formatted} required."], 422);
        }

        $discount = $this->calculateDiscount($promotion, $cartTotal);

        if ($promotion->max_discount_amount && $discount > $promotion->max_discount_amount) {
            $discount = (float) $promotion->max_discount_amount;
        }

        return response()->json([
            'success' => true,
            'message' => 'Promo code applied.',
            'data' => [
                'promotion_id' => $promotion->id,
                'code' => $validated['code'],
                'name' => $promotion->name,
                'type' => $promotion->type,
                'discount' => $discount,
                'currency' => $promotion->currency,
            ],
        ]);
    }

    private function calculateDiscount(Promotion $promotion, float $amount): float
    {
        $discount = match ($promotion->type) {
            'percentage_discount' => $amount * ($promotion->value / 100),
            'fixed_discount' => (float) $promotion->value,
            'cashback' => $amount * ($promotion->value / 100),
            default => 0.0,
        };

        if ($promotion->max_discount_amount) {
            $discount = min($discount, (float) $promotion->max_discount_amount);
        }

        return round(min($discount, $amount), 2);
    }
}
