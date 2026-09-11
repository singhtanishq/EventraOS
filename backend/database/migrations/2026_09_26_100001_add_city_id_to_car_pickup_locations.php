<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('car_pickup_locations')) {
            return;
        }

        if (!Schema::hasColumn('car_pickup_locations', 'city_id')) {
            Schema::table('car_pickup_locations', function (Blueprint $table) {
                $table->foreignId('city_id')->nullable()->after('company_id')->constrained('cities')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('car_pickup_locations') && Schema::hasColumn('car_pickup_locations', 'city_id')) {
            Schema::table('car_pickup_locations', function (Blueprint $table) {
                $table->dropConstrainedForeignId('city_id');
            });
        }
    }
};
