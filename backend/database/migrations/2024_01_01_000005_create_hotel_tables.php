<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_hotel_id')->nullable(); // External provider ID
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('name_local')->nullable();
            $table->text('description')->nullable();
            $table->text('description_local')->nullable();
            $table->foreignId('city_id')->constrained()->restrictOnDelete();
            $table->string('address');
            $table->string('address_local')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('postal_code')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->unsignedTinyInteger('star_rating')->nullable(); // 1-5
            $table->string('property_type')->nullable(); // hotel, resort, hostel, apartment, villa
            $table->json('amenities')->nullable(); // wifi, pool, spa, gym, parking, etc.
            $table->json('room_amenities')->nullable(); // Standard room amenities
            $table->json('property_amenities')->nullable(); // Property-level amenities
            $table->json('policies')->nullable(); // check-in/out, children, pets, etc.
            $table->json('check_in_out')->nullable(); // { check_in: "14:00", check_out: "11:00" }
            $table->json('images')->nullable(); // Array of image URLs
            $table->json('location_highlights')->nullable(); // Nearby attractions
            $table->decimal('rating', 3, 2)->nullable(); // Average guest rating
            $table->unsignedInteger('review_count')->default(0);
            $table->json('rating_breakdown')->nullable(); // cleanliness, location, service, value
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable(); // Flexible extra data
            $table->softDeletes();
            $table->timestamps();

            $table->index(['city_id', 'is_active']);
            $table->index(['provider_id', 'provider_hotel_id']);
            $table->index(['is_active', 'is_featured']);
            $table->index('slug');
        });

        Schema::create('hotel_room_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_room_type_id')->nullable();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedInteger('max_occupancy')->default(2);
            $table->unsignedInteger('adult_capacity')->default(2);
            $table->unsignedInteger('child_capacity')->default(0);
            $table->unsignedInteger('infant_capacity')->default(0);
            $table->json('bed_configuration')->nullable(); // e.g., [{type: "king", count: 1}, {type: "sofa_bed", count: 1}]
            $table->json('amenities')->nullable(); // Room-specific amenities
            $table->json('images')->nullable();
            $table->unsignedInteger('quantity')->default(1); // Total rooms of this type
            $table->unsignedInteger('size_sqm')->nullable();
            $table->string('view_type')->nullable(); // sea, city, garden, mountain
            $table->boolean('is_smoking')->default(false);
            $table->boolean('is_accessible')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['hotel_id', 'is_active']);
            $table->index(['provider_id', 'provider_room_type_id']);
        });

        Schema::create('hotel_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->foreignId('room_type_id')->constrained('hotel_room_types')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_rate_id')->nullable();
            $table->string('name'); // e.g., "Standard Rate", "Non-refundable", "Breakfast Included"
            $table->string('code')->nullable(); // Rate code
            $table->enum('meal_plan', ['room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive'])->default('room_only');
            $table->json('cancellation_policy')->nullable(); // Structured policy
            $table->string('cancellation_policy_text')->nullable(); // Human-readable
            $table->json('conditions')->nullable(); // Advance purchase, min stay, etc.
            $table->boolean('is_refundable')->default(true);
            $table->boolean('is_prepaid')->default(false);
            $table->boolean('requires_guarantee')->default(true);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['hotel_id', 'room_type_id', 'is_active']);
        });

        Schema::create('hotel_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->foreignId('room_type_id')->constrained('hotel_room_types')->cascadeOnDelete();
            $table->foreignId('rate_id')->constrained('hotel_rates')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('total_rooms')->default(0);
            $table->unsignedInteger('available_rooms')->default(0);
            $table->unsignedInteger('sold_rooms')->default(0);
            $table->unsignedInteger('blocked_rooms')->default(0);
            $table->decimal('base_price', 15, 4); // In base currency (minor units)
            $table->decimal('sell_price', 15, 4); // Price to sell at
            $table->string('currency', 3)->default('INR');
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('fee_amount', 15, 4)->default(0);
            $table->boolean('is_closed')->default(false); // Hotel closed on this date
            $table->json('restrictions')->nullable(); // Min stay, max stay, closed to arrival/departure
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['room_type_id', 'rate_id', 'date']);
            $table->index(['hotel_id', 'date']);
            $table->index(['date', 'available_rooms']);
        });

        Schema::create('hotel_availability_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedInteger('adults')->default(2);
            $table->unsignedInteger('children')->default(0);
            $table->unsignedInteger('rooms')->default(1);
            $table->json('result'); // Cached availability result
            $table->timestamp('expires_at');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['hotel_id', 'check_in', 'check_out']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_availability_cache');
        Schema::dropIfExists('hotel_inventory');
        Schema::dropIfExists('hotel_rates');
        Schema::dropIfExists('hotel_room_types');
        Schema::dropIfExists('hotels');
    }
};