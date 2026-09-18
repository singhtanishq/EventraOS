<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Credit/Debit Card', 'code' => 'card', 'type' => 'online', 'gateway' => 'demo', 'icon' => 'credit-card', 'fee_percentage' => 0, 'sort_order' => 1],
            ['name' => 'UPI', 'code' => 'upi', 'type' => 'online', 'gateway' => 'demo', 'icon' => 'smartphone', 'fee_percentage' => 0, 'sort_order' => 2],
            ['name' => 'Net Banking', 'code' => 'netbanking', 'type' => 'online', 'gateway' => 'demo', 'icon' => 'building', 'fee_percentage' => 0, 'sort_order' => 3],
            ['name' => 'EventraOS Wallet', 'code' => 'wallet', 'type' => 'wallet', 'gateway' => 'internal', 'icon' => 'wallet', 'fee_percentage' => 0, 'sort_order' => 4],
        ];

        foreach ($methods as $method) {
            PaymentMethod::create($method + ['is_active' => true, 'supports_refund' => true, 'supports_partial_refund' => true]);
        }
    }
}
