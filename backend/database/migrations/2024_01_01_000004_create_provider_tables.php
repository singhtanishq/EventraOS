<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('providers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // e.g., 'amadeus', 'booking_com', 'demo_hotel'
            $table->string('type'); // hotel, flight, train, bus, venue, car, activity, transfer, payment
            $table->enum('mode', ['demo', 'live'])->default('demo');
            $table->string('base_url')->nullable();
            $table->json('credentials')->nullable(); // Encrypted API keys
            $table->json('configuration')->nullable(); // Provider-specific config
            $table->enum('status', ['active', 'inactive', 'maintenance', 'error'])->default('active');
            $table->integer('priority')->default(0); // Higher = preferred
            $table->json('supported_countries')->nullable(); // ISO codes
            $table->json('supported_currencies')->nullable(); // ISO 4217 codes
            $table->json('capabilities')->nullable(); // What this provider supports
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamp('last_error_at')->nullable();
            $table->text('last_error_message')->nullable();
            $table->integer('error_count')->default(0);
            $table->integer('success_count')->default(0);
            $table->decimal('avg_latency_ms', 10, 2)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['type', 'mode', 'status']);
            $table->index(['status', 'priority']);
        });

        Schema::create('provider_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained()->cascadeOnDelete();
            $table->string('endpoint');
            $table->string('method');
            $table->json('request')->nullable();
            $table->json('response')->nullable();
            $table->integer('status_code')->nullable();
            $table->integer('duration_ms');
            $table->string('correlation_id')->nullable();
            $table->enum('result', ['success', 'error', 'timeout', 'partial']);
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['provider_id', 'created_at']);
            $table->index(['correlation_id']);
            $table->index(['result', 'created_at']);
        });

        Schema::create('provider_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained()->cascadeOnDelete();
            $table->string('environment'); // production, sandbox, test
            $table->string('key_name');
            $table->text('encrypted_value');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['provider_id', 'environment', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_credentials');
        Schema::dropIfExists('provider_logs');
        Schema::dropIfExists('providers');
    }
};