<?php

namespace App\Services\Payment;

use App\Models\Payment;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\CustomerPaymentMethod;
use App\Models\Provider;
use App\Services\Providers\ProviderManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PaymentService
{
    protected ProviderManager $providerManager;

    public function __construct(ProviderManager $providerManager)
    {
        $this->providerManager = $providerManager;
    }

    protected function bookingService(): BookingService
    {
        return app(\App\Services\Booking\BookingService::class);
    }

    public function initiatePayment(
        Booking $booking,
        Customer $customer,
        PaymentMethod $paymentMethod,
        CustomerPaymentMethod $customerPaymentMethod = null,
        array $options = []
    ): Payment {
        return DB::transaction(function () use ($booking, $customer, $paymentMethod, $customerPaymentMethod, $options) {
            $amount = $booking->getOutstandingAmount();
            
            if ($amount <= 0) {
                throw new \Exception('No outstanding amount to pay');
            }

            $payment = Payment::create([
                'booking_id' => $booking->id,
                'customer_id' => $customer->id,
                'payment_method_id' => $paymentMethod->id,
                'customer_payment_method_id' => $customerPaymentMethod?->id,
                'status' => 'initiated',
                'amount' => $amount,
                'fee_amount' => $this->calculateFee($amount, $paymentMethod),
                'net_amount' => $amount,
                'currency' => $booking->currency,
                'base_currency' => $booking->base_currency,
                'exchange_rate' => $booking->exchange_rate,
                'idempotency_key' => $options['idempotency_key'] ?? 'pay_' . Str::uuid(),
                'initiated_at' => now(),
                'expires_at' => now()->addMinutes(config('booking.payment_timeout_minutes', 10)),
                'metadata' => $options['metadata'] ?? [],
            ]);

            // Update booking status
            $booking->update([
                'status' => 'payment_pending',
                'payment_due_at' => $payment->expires_at,
            ]);

            // Create payment attempt record
            $payment->attempts()->create([
                'attempt_number' => 1,
                'status' => 'initiated',
                'started_at' => now(),
            ]);

            return $payment;
        });
    }

    public function processPayment(Payment $payment): Payment
    {
        return DB::transaction(function () use ($payment) {
            $payment->markProcessing();
            
            $attempt = $payment->attempts()->latest()->first();
            $attempt->update(['status' => 'processing']);

            try {
                $provider = $this->getPaymentProvider($payment);
                
                if ($provider) {
                    // Process via external provider
                    $result = $this->processWithProvider($payment, $provider);
                } else {
                    // Process via demo/internal provider
                    $result = $this->processDemoPayment($payment);
                }

                if ($result['success']) {
                    $payment->markAuthorized($result['provider_payment_id'] ?? null, $result['gateway_response'] ?? []);

                    // For demo, auto-capture
                    if (config('app.env') === 'local' || $payment->paymentMethod->gateway === 'demo') {
                        $payment->markCaptured($result['gateway_response'] ?? []);
                    }

                    $attempt->update([
                        'status' => 'success',
                        'completed_at' => now(),
                        'response' => $result['gateway_response'] ?? [],
                    ]);

                    // Confirm the booking once payment is captured
                    if (in_array($payment->fresh()->status, ['captured', 'authorized']) && $payment->booking) {
                        try {
                            $this->bookingService->confirmBooking($payment->booking);
                        } catch (\Throwable $confirmError) {
                            // Confirmation issues (e.g. expired hold) shouldn't fail the payment itself
                            Log::warning('Booking confirmation after payment failed', [
                                'payment_id' => $payment->id,
                                'booking_id' => $payment->booking->id,
                                'error' => $confirmError->getMessage(),
                            ]);
                        }
                    }
                } else {
                    throw new \Exception($result['error'] ?? 'Payment failed');
                }

            } catch (\Throwable $e) {
                $payment->markFailed($e->getMessage(), $result['gateway_response'] ?? []);
                
                $attempt->update([
                    'status' => 'failed',
                    'completed_at' => now(),
                    'error_code' => $result['error_code'] ?? 'PROCESSING_ERROR',
                    'error_message' => $e->getMessage(),
                ]);

                // Release any holds
                $this->releaseBookingHolds($payment->booking);
            }

            return $payment->fresh();
        });
    }

    protected function processWithProvider(Payment $payment, Provider $provider): array
    {
        // Implement provider-specific payment processing
        // This would integrate with Stripe, Razorpay, etc.
        return [
            'success' => false,
            'error' => 'Provider payment processing not implemented',
        ];
    }

    protected function processDemoPayment(Payment $payment): array
    {
        // Simulate payment processing
        $successRate = config('demo_payment_success_rate', 100);
        $isSuccess = random_int(1, 100) <= $successRate;

        if ($isSuccess) {
            return [
                'success' => true,
                'provider_payment_id' => 'demo_pay_' . Str::random(12),
                'gateway_response' => [
                    'status' => 'success',
                    'message' => 'Demo payment successful',
                    'timestamp' => now()->toISOString(),
                ],
            ];
        }

        return [
            'success' => false,
            'error' => 'Demo payment declined',
            'error_code' => 'CARD_DECLINED',
            'gateway_response' => [
                'status' => 'failed',
                'message' => 'Demo payment declined',
            ],
        ];
    }

    public function retryPayment(Payment $payment): Payment
    {
        if (!$payment->isFailed()) {
            throw new \Exception('Only failed payments can be retried');
        }

        $attemptNumber = $payment->attempts()->count() + 1;
        
        if ($attemptNumber > 3) {
            throw new \Exception('Maximum retry attempts exceeded');
        }

        $payment->update([
            'status' => 'initiated',
            'failure_reason' => null,
            'failure_details' => null,
            'expires_at' => now()->addMinutes(config('booking.payment_timeout_minutes', 10)),
        ]);

        $payment->attempts()->create([
            'attempt_number' => $attemptNumber,
            'status' => 'initiated',
            'started_at' => now(),
        ]);

        return $this->processPayment($payment);
    }

    public function capturePayment(Payment $payment): Payment
    {
        if ($payment->status !== 'authorized') {
            throw new \Exception('Only authorized payments can be captured');
        }

        $payment->markCaptured([]);
        return $payment->fresh();
    }

    public function refundPayment(Payment $payment, float $amount = null, string $reason = 'customer_request'): \App\Models\Refund
    {
        $refundAmount = $amount ?? $payment->getRemainingRefundableAmount();
        
        if ($refundAmount <= 0) {
            throw new \Exception('No refundable amount available');
        }

        return DB::transaction(function () use ($payment, $refundAmount, $reason) {
            $refund = \App\Models\Refund::create([
                'booking_id' => $payment->booking_id,
                'payment_id' => $payment->id,
                'customer_id' => $payment->customer_id,
                'status' => 'requested',
                'refund_type' => $refundAmount >= $payment->amount ? 'full' : 'partial',
                'reason' => $reason,
                'requested_amount' => $refundAmount,
                'currency' => $payment->currency,
                'requested_by' => auth()->id(),
            ]);

            // Process refund with provider
            $provider = $this->getPaymentProvider($payment);
            
            if ($provider) {
                $result = $provider->processRefund(
                    $payment->provider_payment_id,
                    $refundAmount,
                    $reason
                );

                if ($result->isSuccessful()) {
                    $refund->update([
                        'status' => 'processing',
                        'provider_refund_id' => $result->getRefundReference(),
                        'gateway_response' => $result->toArray(),
                    ]);
                } else {
                    $refund->update([
                        'status' => 'failed',
                        'rejection_reason' => $result->getError(),
                    ]);
                }
            } else {
                // Demo refund
                $refund->update([
                    'status' => 'completed',
                    'approved_amount' => $refundAmount,
                    'processed_amount' => $refundAmount,
                    'net_refund' => $refundAmount,
                    'processed_at' => now(),
                    'gateway_response' => ['status' => 'success', 'demo' => true],
                ]);

                // Update payment status
                $paidAmount = $payment->amount - $refundAmount;
                $payment->update([
                    'status' => $paidAmount > 0 ? 'partially_refunded' : 'refunded',
                    'refunded_at' => now(),
                ]);

                // Update booking
                $payment->booking->update([
                    'amount_refunded' => $payment->booking->amount_refunded + $refundAmount,
                    'payment_status' => $paidAmount > 0 ? 'partially_refunded' : 'refunded',
                ]);
            }

            return $refund;
        });
    }

    protected function getPaymentProvider(Payment $payment): ?Provider
    {
        return $payment->provider ?? Provider::where('type', 'payment')
            ->where('is_default', true)
            ->where('status', 'active')
            ->first();
    }

    protected function calculateFee(float $amount, PaymentMethod $paymentMethod): float
    {
        $fee = 0;
        
        if ($paymentMethod->fee_percentage > 0) {
            $fee += $amount * ($paymentMethod->fee_percentage / 100);
        }
        
        if ($paymentMethod->fee_fixed > 0) {
            $fee += $paymentMethod->fee_fixed;
        }

        return round($fee, 4);
    }

    protected function releaseBookingHolds(Booking $booking): void
    {
        $booking->holds()->where('status', 'active')->each(function ($hold) {
            $hold->release('Payment failed');
        });
    }

    public function handleWebhook(string $providerCode, array $payload): array
    {
        $provider = Provider::where('code', $providerCode)->first();
        
        if (!$provider) {
            return ['success' => false, 'error' => 'Unknown provider'];
        }

        // Verify webhook signature
        if (!$this->verifyWebhookSignature($provider, $payload)) {
            return ['success' => false, 'error' => 'Invalid signature'];
        }

        // Process webhook based on provider
        return match ($providerCode) {
            'stripe' => $this->handleStripeWebhook($payload),
            'razorpay' => $this->handleRazorpayWebhook($payload),
            default => ['success' => false, 'error' => 'Unsupported provider'],
        };
    }

    protected function verifyWebhookSignature(Provider $provider, array $payload): bool
    {
        // Implement webhook signature verification
        return true; // Placeholder
    }

    protected function handleStripeWebhook(array $payload): array
    {
        // Handle Stripe webhook events
        return ['success' => true];
    }

    protected function handleRazorpayWebhook(array $payload): array
    {
        // Handle Razorpay webhook events
        return ['success' => true];
    }

    public function getPaymentMethodsForCustomer(Customer $customer): \Illuminate\Database\Eloquent\Collection
    {
        return $customer->paymentMethods()->where('is_active', true)->get();
    }

    public function getAvailablePaymentMethods(string $currency = 'INR', string $country = 'IN'): \Illuminate\Database\Eloquent\Collection
    {
        return PaymentMethod::where('is_active', true)
            ->where(function ($q) use ($currency, $country) {
                $q->whereJsonContains('supported_currencies', $currency)
                  ->orWhereNull('supported_currencies');
                $q->whereJsonContains('supported_countries', $country)
                  ->orWhereNull('supported_countries');
            })
            ->orderBy('sort_order')
            ->get();
    }
}