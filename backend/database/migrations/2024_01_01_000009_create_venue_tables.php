<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_venue_id')->nullable();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('city_id')->constrained()->restrictOnDelete();
            $table->string('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('landmark')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->unsignedInteger('total_capacity');
            $table->json('capacity_breakdown')->nullable(); // {theater: 500, banquet: 300, classroom: 200, etc.}
            $table->json('venue_types')->nullable(); // wedding, conference, party, concert, etc.
            $table->boolean('has_indoor')->default(true);
            $table->boolean('has_outdoor')->default(false);
            $table->boolean('has_parking')->default(false);
            $table->unsignedInteger('parking_capacity')->default(0);
            $table->boolean('has_catering')->default(false);
            $table->boolean('has_av')->default(false);
            $table->boolean('has_stage')->default(false);
            $table->boolean('has_green_room')->default(false);
            $table->boolean('has_bride_groom_room')->default(false);
            $table->json('amenities')->nullable();
            $table->json('facilities')->nullable(); // Detailed facilities
            $table->json('images')->nullable();
            $table->json('floor_plans')->nullable();
            $table->json('policies')->nullable(); // Decoration, vendor, noise, alcohol, etc.
            $table->string('timezone');
            $table->boolean('allows_external_catering')->default(false);
            $table->boolean('allows_external_decor')->default(false);
            $table->boolean('allows_alcohol')->default(false);
            $table->time('earliest_event_time')->nullable();
            $table->time('latest_event_time')->nullable();
            $table->decimal('rating', 3, 2)->nullable();
            $table->unsignedInteger('review_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['city_id', 'is_active']);
            $table->index(['is_active', 'is_featured']);
            $table->index('slug');
        });

        Schema::create('venue_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedInteger('capacity_theater')->default(0);
            $table->unsignedInteger('capacity_banquet')->default(0);
            $table->unsignedInteger('capacity_classroom')->default(0);
            $table->unsignedInteger('capacity_boardroom')->default(0);
            $table->unsignedInteger('capacity_u_shape')->default(0);
            $table->unsignedInteger('capacity_cocktail')->default(0);
            $table->unsignedInteger('area_sqm')->nullable();
            $table->decimal('ceiling_height', 5, 2)->nullable();
            $table->boolean('has_ac')->default(true);
            $table->boolean('has_stage')->default(false);
            $table->boolean('has_projector')->default(false);
            $table->boolean('has_sound_system')->default(false);
            $table->boolean('has_wifi')->default(true);
            $table->json('amenities')->nullable();
            $table->json('images')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['venue_id', 'is_active']);
        });

        Schema::create('venue_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->enum('type', ['basic', 'standard', 'premium', 'custom']);
            $table->text('description')->nullable();
            $table->json('includes')->nullable(); // What's included
            $table->json('excludes')->nullable(); // What's not included
            $table->unsignedInteger('min_guests')->default(0);
            $table->unsignedInteger('max_guests')->nullable();
            $table->decimal('price_per_guest', 15, 4)->nullable();
            $table->decimal('fixed_price', 15, 4)->nullable();
            $table->decimal('price_per_hour', 15, 4)->nullable();
            $table->string('currency', 3)->default('INR');
            $table->json('menu_options')->nullable(); // Catering menus
            $table->json('decor_options')->nullable();
            $table->json('av_options')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['venue_id', 'type', 'is_active']);
        });

        Schema::create('venue_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->enum('category', ['catering', 'decor', 'photography', 'videography', 'entertainment', 'av', 'lighting', 'security', 'transport', 'staff', 'other']);
            $table->text('description')->nullable();
            $table->enum('pricing_type', ['per_guest', 'per_hour', 'fixed', 'per_unit']);
            $table->decimal('price', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->unsignedInteger('min_quantity')->default(1);
            $table->unsignedInteger('max_quantity')->nullable();
            $table->json('options')->nullable(); // Variants
            $table->json('images')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['venue_id', 'category', 'is_active']);
        });

        Schema::create('venue_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained()->cascadeOnDelete();
            $table->foreignId('venue_room_id')->nullable()->constrained()->nullOnDelete();
            $table->date('date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->enum('status', ['available', 'booked', 'blocked', 'maintenance'])->default('available');
            $table->unsignedBigInteger('booking_id')->nullable()->index();
            $table->json('event_details')->nullable(); // Event type, guest count, etc.
            $table->decimal('price_override', 15, 4)->nullable();
            $table->timestamps();

            $table->index(['venue_id', 'date', 'status']);
            $table->index(['venue_room_id', 'date', 'status']);
            $table->unique(['venue_room_id', 'date', 'start_time', 'end_time'])->whereNull('venue_room_id');
        });

        Schema::create('venue_blackout_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('reason')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->json('recurrence_rule')->nullable(); // For recurring blackout dates
            $table->timestamps();

            $table->index(['venue_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venue_blackout_dates');
        Schema::dropIfExists('venue_availability');
        Schema::dropIfExists('venue_addons');
        Schema::dropIfExists('venue_packages');
        Schema::dropIfExists('venue_rooms');
        Schema::dropIfExists('venues');
    }
};