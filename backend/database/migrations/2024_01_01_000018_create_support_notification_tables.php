<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('ticket_number')->unique(); // TKT-XXXXXX
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->foreignId('booking_item_id')->nullable()->constrained('booking_items')->nullOnDelete();
            $table->string('subject');
            $table->text('description');
            $table->enum('category', [
                'booking', 'payment', 'refund', 'cancellation', 'reschedule',
                'service_quality', 'technical', 'account', 'general', 'complaint', 'feedback'
            ]);
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', [
                'open', 'assigned', 'in_progress', 'waiting_for_customer',
                'waiting_for_provider', 'resolved', 'closed', 'reopened'
            ])->default('open');
            $table->foreignId('assigned_agent_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->foreignId('assigned_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->unsignedInteger('response_count')->default(0);
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'status']);
            $table->index(['booking_id', 'status']);
            $table->index(['assigned_agent_id', 'status']);
            $table->index(['status', 'priority', 'created_at']);
            $table->index('ticket_number');
        });

        Schema::create('support_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->restrictOnDelete();
            $table->enum('sender_type', ['customer', 'agent', 'admin', 'system']);
            $table->text('message');
            $table->boolean('is_internal')->default(false); // Internal notes
            $table->json('attachments')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->morphs('notifiable'); // Customer, Agent, Admin
            $table->string('type'); // booking_confirmed, payment_failed, etc.
            $table->string('title');
            $table->text('message');
            $table->enum('channel', ['in_app', 'email', 'sms', 'whatsapp', 'push'])->default('in_app');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->json('data')->nullable(); // Additional data for rendering
            $table->json('action_url')->nullable(); // Deep link
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->boolean('is_sent')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->string('sent_via')->nullable(); // email, sms, push
            $table->json('delivery_status')->nullable();
            $table->timestamps();

            $table->index(['notifiable_type', 'notifiable_id', 'is_read']);
            $table->index(['type', 'created_at']);
        });

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->morphs('notifiable');
            $table->json('channels')->nullable(); // {email: true, sms: false, push: true}
            $table->json('types')->nullable(); // {booking_confirmed: {email: true, sms: false}, ...}
            $table->json('quiet_hours')->nullable(); // {start: "22:00", end: "08:00", timezone: "Asia/Kolkata"}
            $table->timestamps();

            $table->unique(['notifiable_type', 'notifiable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('support_messages');
        Schema::dropIfExists('support_tickets');
    }
};