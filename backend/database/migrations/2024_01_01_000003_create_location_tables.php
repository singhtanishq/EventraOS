<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('iso_code_2', 2)->unique(); // ISO 3166-1 alpha-2
            $table->string('iso_code_3', 3)->unique(); // ISO 3166-1 alpha-3
            $table->string('iso_numeric', 3)->unique(); // ISO 3166-1 numeric
            $table->string('phone_code', 10); // e.g., +91, +1, +971
            $table->string('currency_code', 3); // ISO 4217
            $table->string('currency_symbol')->nullable();
            $table->string('currency_name')->nullable();
            $table->string('capital')->nullable();
            $table->string('region')->nullable(); // e.g., Asia, Europe
            $table->string('subregion')->nullable(); // e.g., Southern Asia
            $table->json('languages')->nullable(); // ISO 639-1 codes
            $table->json('timezones')->nullable(); // IANA timezone identifiers
            $table->string('flag_emoji')->nullable();
            $table->string('flag_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable(); // ISO 3166-2
            $table->string('type')->nullable(); // state, province, region, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['country_id', 'is_active']);
        });

        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->foreignId('region_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->nullable();
            $table->string('name_local')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('timezone')->nullable();
            $table->integer('population')->nullable();
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable(); // airport codes, etc.
            $table->timestamps();

            $table->index(['country_id', 'is_active']);
            $table->index(['region_id', 'is_active']);
            $table->index(['is_popular', 'is_active']);
        });

        Schema::create('airports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('iata_code', 3)->unique(); // IATA code
            $table->string('icao_code', 4)->nullable()->unique(); // ICAO code
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('timezone');
            $table->string('terminal_info')->nullable();
            $table->boolean('is_international')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['city_id', 'is_active']);
            $table->index('iata_code');
        });

        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique(); // Station code
            $table->string('type')->default('train'); // train, bus, metro
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('timezone');
            $table->json('platforms')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['city_id', 'type', 'is_active']);
            $table->index('code');
        });

        Schema::create('bus_terminals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->json('amenities')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['city_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bus_terminals');
        Schema::dropIfExists('stations');
        Schema::dropIfExists('airports');
        Schema::dropIfExists('cities');
        Schema::dropIfExists('regions');
        Schema::dropIfExists('countries');
    }
};