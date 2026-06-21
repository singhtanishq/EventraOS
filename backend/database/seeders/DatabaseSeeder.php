<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            LocationSeeder::class,
            InventorySeeder::class,
            UserSeeder::class,
            PaymentMethodSeeder::class,
            PromotionSeeder::class,
        ]);
    }
}
