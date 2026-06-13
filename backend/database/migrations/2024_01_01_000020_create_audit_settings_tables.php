<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('correlation_id')->nullable()->index();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_type')->nullable(); // customer, agent, admin, system
            $table->string('actor_role')->nullable();
            $table->string('actor_ip')->nullable();
            $table->text('actor_user_agent')->nullable();
            $table->string('action'); // created, updated, deleted, viewed, exported, etc.
            $table->string('entity_type'); // Model class or entity name
            $table->string('entity_id')->nullable();
            $table->string('entity_reference')->nullable(); // Human-readable reference
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('changed_attributes')->nullable();
            $table->text('description')->nullable(); // Human-readable description
            $table->json('metadata')->nullable(); // Additional context
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info');
            $table->timestamps();

            $table->index(['actor_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
            $table->index(['severity', 'created_at']);
        });

        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type'); // login_failed, password_changed, mfa_enabled, suspicious_activity, etc.
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('location')->nullable(); // GeoIP location
            $table->json('details')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->foreignId('resolved_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['event_type', 'severity', 'created_at']);
            $table->index(['is_resolved', 'created_at']);
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('group')->default('general'); // general, booking, payment, notification, email, security, etc.
            $table->text('value')->nullable();
            $table->enum('type', ['string', 'integer', 'float', 'boolean', 'json', 'array'])->default('string');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false); // Can be exposed to frontend
            $table->boolean('is_encrypted')->default(false); // Encrypt value at rest
            $table->json('validation_rules')->nullable(); // For admin UI validation
            $table->json('options')->nullable(); // For select/multi-select
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['group', 'sort_order']);
        });

        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('enabled')->default(false);
            $table->json('conditions')->nullable(); // Rollout conditions
            $table->json('variants')->nullable(); // A/B testing variants
            $table->boolean('is_permanent')->default(false); // Cannot be disabled
            $table->timestamps();

            $table->index(['enabled']);
        });

        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // booking_confirmed, payment_failed, etc.
            $table->string('name');
            $table->string('subject');
            $table->longText('html_content');
            $table->longText('text_content')->nullable();
            $table->json('variables')->nullable(); // Available variables
            $table->string('category')->default('transactional'); // transactional, marketing, notification
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('template_id')->nullable()->constrained('email_templates')->nullOnDelete();
            $table->string('template_key')->nullable();
            $table->string('to_email');
            $table->string('to_name')->nullable();
            $table->string('subject');
            $table->enum('status', ['queued', 'sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked'])->default('queued');
            $table->string('provider')->nullable(); // mailpit, smtp, sendgrid, etc.
            $table->string('provider_message_id')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamps();

            $table->index(['to_email', 'created_at']);
            $table->index(['template_key', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('security_events');
        Schema::dropIfExists('audit_logs');
    }
};