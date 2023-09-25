<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('train_operators', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('country_code', 2);
            $table->string('logo')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('train_routes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('operator_id')->constrained('train_operators')->restrictOnDelete();
            $table->string('train_number'); // e.g., "12951", "12009"
            $table->string('train_name'); // e.g., "Rajdhani Express", "Shatabdi Express"
            $table->foreignId('origin_station_id')->constrained('stations')->restrictOnDelete();
            $table->foreignId('destination_station_id')->constrained('stations')->restrictOnDelete();
            $table->json('intermediate_stations')->nullable(); // Array of station stops
            $table->time('departure_time');
            $table->time('arrival_time');
            $table->unsignedInteger('duration_minutes');
            $table->json('running_days')->nullable(); // [1,2,3,4,5,6,7] for Mon-Sun
            $table->string('train_type'); // rajdhani, shatabdi, duronto, mail, express, passenger
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['origin_station_id', 'destination_station_id', 'is_active']);
            $table->index(['train_number', 'is_active']);
        });

        Schema::create('train_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('train_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_class_id')->nullable();
            $table->string('name'); // 1AC, 2AC, 3AC, SL, CC, EC, 2S
            $table->string('code'); // Class code
            $table->unsignedInteger('capacity');
            $table->json('amenities')->nullable();
            $table->boolean('has_berth')->default(true);
            $table->boolean('is_ac')->default(false);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['train_route_id', 'is_active']);
        });

        Schema::create('train_fares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('train_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('train_classes')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_fare_id')->nullable();
            $table->string('quota')->default('GN'); // GN, LD, HQ, DF, etc.
            $table->decimal('base_fare', 15, 4);
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('fee_amount', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->json('fare_rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['train_route_id', 'class_id', 'quota', 'is_active']);
        });

        Schema::create('train_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('train_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('train_classes')->cascadeOnDelete();
            $table->foreignId('fare_id')->constrained('train_fares')->cascadeOnDelete();
            $table->date('journey_date');
            $table->unsignedInteger('total_berths')->default(0);
            $table->unsignedInteger('available_berths')->default(0);
            $table->unsignedInteger('booked_berths')->default(0);
            $table->unsignedInteger('rac_count')->default(0); // Reservation Against Cancellation
            $table->unsignedInteger('wl_count')->default(0); // Waitlist
            $table->decimal('current_fare', 15, 4);
            $table->boolean('is_closed')->default(false);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['class_id', 'fare_id', 'journey_date']);
            $table->index(['train_route_id', 'journey_date']);
            $table->index(['journey_date', 'available_berths']);
        });

        Schema::create('train_availability_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('origin_station_id')->constrained('stations')->nullOnDelete();
            $table->foreignId('destination_station_id')->constrained('stations')->nullOnDelete();
            $table->date('journey_date');
            $table->string('quota')->default('GN');
            $table->json('result');
            $table->timestamp('expires_at');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['origin_station_id', 'destination_station_id', 'journey_date']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('train_availability_cache');
        Schema::dropIfExists('train_inventory');
        Schema::dropIfExists('train_fares');
        Schema::dropIfExists('train_classes');
        Schema::dropIfExists('train_routes');
        Schema::dropIfExists('train_operators');
    }
};