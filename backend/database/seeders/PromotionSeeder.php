<?php

namespace Database\Seeders;

use App\Models\Promotion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PromotionSeeder extends Seeder
{
    public function run(): void
    {
        $promotions = [
            ['name' => 'Welcome Offer — 10% Off', 'type' => 'percentage_discount', 'value' => 10, 'description' => 'Get 10% off your first booking with EventraOS.', 'promo_code' => 'WELCOME10', 'min_booking_value' => 5000, 'max_discount_amount' => 5000],
            ['name' => 'Hotel Weekend Sale — ₹2000 Off', 'type' => 'fixed_discount', 'value' => 2000, 'description' => 'Flat ₹2000 off on hotel bookings above ₹10,000.', 'promo_code' => 'HOTEL2000', 'applicable_to' => 'hotels', 'min_booking_value' => 10000, 'max_discount_amount' => 2000],
            ['name' => 'Flight Bonanza — 5% Off', 'type' => 'percentage_discount', 'value' => 5, 'description' => 'Save 5% on flight bookings this month.', 'promo_code' => 'FLY5', 'applicable_to' => 'flights', 'min_booking_value' => 8000, 'max_discount_amount' => 3000],
            ['name' => 'Event Extravaganza — 15% Off Venues', 'type' => 'percentage_discount', 'value' => 15, 'description' => 'Book your dream venue at 15% off.', 'promo_code' => 'EVENT15', 'applicable_to' => 'venues', 'min_booking_value' => 50000, 'max_discount_amount' => 25000],
            ['name' => 'Activity Adventure — ₹500 Off', 'type' => 'fixed_discount', 'value' => 500, 'description' => 'Save ₹500 on activity bookings above ₹3000.', 'promo_code' => 'FUN500', 'applicable_to' => 'activities', 'min_booking_value' => 3000, 'max_discount_amount' => 500],
        ];

        foreach ($promotions as $data) {
            Promotion::create(collect($data)->put('applicable_to', $data['applicable_to'] ?? 'all')->all() + [
                'currency' => 'INR',
                'valid_from' => now()->subDays(7),
                'valid_to' => now()->addMonths(6),
                'usage_limit_per_customer' => 1,
                'can_stack' => false,
                'requires_promo_code' => true,
                'is_active' => true,
                'is_featured' => true,
            ]);
        }
    }
}
