<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('invoice_number')->unique(); // INV-XXXXXX
            $table->string('invoice_type')->default('standard'); // standard, proforma, credit_note
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->json('billing_details'); // Customer billing info at time of invoice
            $table->json('line_items'); // Array of items with prices, taxes
            $table->decimal('subtotal', 15, 4);
            $table->decimal('tax_total', 15, 4);
            $table->decimal('discount_total', 15, 4)->default(0);
            $table->decimal('grand_total', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->enum('status', ['draft', 'issued', 'paid', 'cancelled', 'refunded'])->default('draft');
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index('invoice_number');
        });

        Schema::create('credit_notes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('credit_note_number')->unique(); // CN-XXXXXX
            $table->foreignId('invoice_id')->constrained('invoices')->restrictOnDelete();
            $table->foreignId('refund_id')->nullable()->constrained('refunds')->nullOnDelete();
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->json('line_items');
            $table->decimal('amount', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->text('reason');
            $table->enum('status', ['draft', 'issued', 'applied', 'cancelled'])->default('draft');
            $table->timestamp('issued_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['invoice_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index('credit_note_number');
        });

        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->enum('favoritable_type', ['hotel', 'venue', 'activity', 'package']);
            $table->unsignedBigInteger('favoritable_id');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'favoritable_type', 'favoritable_id']);
            $table->index(['favoritable_type', 'favoritable_id']);
        });

        Schema::create('search_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('session_id')->nullable();
            $table->enum('search_type', ['hotels', 'flights', 'trains', 'buses', 'venues', 'cars', 'activities', 'transfers', 'packages']);
            $table->json('search_parameters');
            $table->unsignedInteger('results_count')->default(0);
            $table->string('selected_result_id')->nullable();
            $table->string('selected_result_type')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });

        Schema::create('recently_viewed', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('session_id')->nullable();
            $table->enum('viewable_type', ['hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer', 'package']);
            $table->unsignedBigInteger('viewable_id');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('document_type'); // passport, visa, invoice, voucher, ticket, insurance, receipt, id_proof
            $table->morphs('documentable'); // Booking, Customer, Agent, etc.
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->string('checksum')->nullable(); // SHA256
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_confidential')->default(true);
            $table->timestamp('expires_at')->nullable(); // For passports, visas
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['documentable_type', 'documentable_id']);
            $table->index(['document_type', 'created_at']);
        });

        Schema::create('calendar_exports', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('export_type'); // ics, google, outlook
            $table->string('token')->unique(); // Secure token for public calendar URL
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_accessed_at')->nullable();
            $table->unsignedInteger('access_count')->default(0);
            $table->timestamps();

            $table->index(['booking_id']);
            $table->index(['token']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_exports');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('recently_viewed');
        Schema::dropIfExists('search_history');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('credit_notes');
        Schema::dropIfExists('invoices');
    }
};