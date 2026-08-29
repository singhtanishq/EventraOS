<?php

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\BookingGuest;
use App\Models\BookingHold;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Provider;
use App\Services\Providers\ProviderManager;
use App\Services\Payment\PaymentService;
use App\Services\Currency\CurrencyService;
use App\Services\Tax\TaxService;
use App\Services\Commission\CommissionService;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class BookingService
{
    protected ProviderManager $providerManager;
    protected PaymentService $paymentService;
    protected CurrencyService $currencyService;
    protected TaxService $taxService;
    protected CommissionService $commissionService;
    protected LoyaltyService $loyaltyService;
    protected NotificationService $notificationService;

    public function __construct(
        ProviderManager $providerManager,
        PaymentService $paymentService,
        CurrencyService $currencyService,
        TaxService $taxService,
        CommissionService $commissionService,
        LoyaltyService $loyaltyService,
        NotificationService $notificationService
    ) {
        $this->providerManager = $providerManager;
        $this->paymentService = $paymentService;
        $this->currencyService = $currencyService;
        $this->taxService = $taxService;
        $this->commissionService = $commissionService;
        $this->loyaltyService = $loyaltyService;
        $this->notificationService = $notificationService;
    }

    public function createBooking(Customer $customer, array $data): Booking
    {
        $itemsData = $data['items'];
        $currency = $data['currency'] ?? config('booking.default_currency', 'INR');
        $promoCode = $data['promo_code'] ?? null;

        // Validate and calculate pricing for each item
        $validatedItems = [];
        $subtotal = 0;
        $taxTotal = 0;
        $feeTotal = 0;
        $serviceFeeTotal = 0;
        $addonTotal = 0;

        foreach ($itemsData as $index => $itemData) {
            $validated = $this->validateAndPriceItem($itemData, $currency);
            $validated['sort_order'] = $index;
            $validatedItems[] = $validated;

            $subtotal += $validated['base_price'];
            $taxTotal += $validated['tax_amount'];
            $feeTotal += $validated['fee_amount'];
            $serviceFeeTotal += $validated['service_fee'];
            $addonTotal += $validated['addon_total'];
        }

        // Apply promotions
        $discountTotal = 0;
        $loyaltyDiscount = 0;
        $walletDiscount = 0;
        $promotion = null;

        if ($promoCode) {
            $promotion = \App\Models\Promotion::where('promo_code', $promoCode)
                ->where('is_active', true)
                ->where('valid_from', '<=', now())
                ->where('valid_to', '>=', now())
                ->first();

            if ($promotion && $this->isPromotionApplicable($promotion, $validatedItems, $customer)) {
                $discountTotal = $this->calculatePromotionDiscount($promotion, $subtotal + $addonTotal);
            }
        }

        // Apply loyalty points if customer has enough
        if ($customer->loyaltyAccount && $customer->loyaltyAccount->points_balance > 0) {
            $loyaltyDiscount = min(
                $customer->loyaltyAccount->points_balance * 0.01, // 1 point = 0.01 currency
                ($subtotal + $addonTotal - $discountTotal) * 0.5 // Max 50% via loyalty
            );
        }

        $grandTotal = $subtotal + $taxTotal + $feeTotal + $serviceFeeTotal + $addonTotal - $discountTotal - $loyaltyDiscount - $walletDiscount;
        $grandTotal = max(0, $grandTotal);

        // Create booking
        $booking = Booking::create([
            'customer_id' => $customer->id,
            'agent_id' => $customer->assigned_agent_id,
            'booking_source' => 'customer',
            'status' => 'draft',
            'payment_status' => 'unpaid',
            'subtotal' => $subtotal,
            'tax_total' => $taxTotal,
            'fee_total' => $feeTotal,
            'service_fee_total' => $serviceFeeTotal,
            'discount_total' => $discountTotal,
            'loyalty_discount' => $loyaltyDiscount,
            'wallet_discount' => $walletDiscount,
            'grand_total' => $grandTotal,
            'currency' => $currency,
            'base_currency' => $currency,
            'promo_code' => $promoCode,
            'promotion_id' => $promotion?->id,
            'special_requests' => $data['special_requests'] ?? null,
            'price_snapshot' => [
                'items' => $validatedItems,
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'fee_total' => $feeTotal,
                'service_fee_total' => $serviceFeeTotal,
                'addon_total' => $addonTotal,
                'discount_total' => $discountTotal,
                'loyalty_discount' => $loyaltyDiscount,
                'wallet_discount' => $walletDiscount,
                'grand_total' => $grandTotal,
                'currency' => $currency,
                'calculated_at' => now()->toISOString(),
            ],
        ]);

        // Create booking items
        foreach ($validatedItems as $itemData) {
            $bookingItem = $booking->items()->create($itemData);

            // Create guests for this item
            if (!empty($itemData['travelers'])) {
                foreach ($itemData['travelers'] as $tIndex => $traveler) {
                    $bookingItem->guests()->create([
                        'first_name' => $traveler['first_name'],
                        'middle_name' => $traveler['middle_name'] ?? null,
                        'last_name' => $traveler['last_name'],
                        'email' => $traveler['email'],
                        'phone' => $traveler['phone'] ?? null,
                        'date_of_birth' => $traveler['date_of_birth'] ?? null,
                        'gender' => $traveler['gender'] ?? null,
                        'nationality' => $traveler['nationality'] ?? null,
                        'passport_number' => $traveler['passport_number'] ?? null,
                        'passport_expiry' => $traveler['passport_expiry'] ?? null,
                        'passport_issuing_country' => $traveler['passport_issuing_country'] ?? null,
                        'is_primary' => $tIndex === 0,
                        'is_lead_guest' => $tIndex === 0 && $index === 0,
                    ]);
                }
            }
        }

        // Update booking status
        $booking->update(['status' => 'payment_pending']);

        // Log booking creation
        activity()
            ->performedOn($booking)
            ->causedBy($customer->user)
            ->withProperties(['booking_reference' => $booking->booking_reference])
            ->log('Booking created');

        return $booking;
    }

    protected function validateAndPriceItem(array $itemData, string $currency): array
    {
        $provider = $this->providerManager->getProvider($itemData['item_type']);
        
        if (!$provider) {
            throw new \Exception("No provider available for {$itemData['item_type']}");
        }

        // Get service details and pricing
        $details = $provider->getDetails(
            $itemData['item_type'] . '_' . $itemData['service_id'],
            $itemData['configuration'] ?? []
        );

        if (!$details) {
            throw new \Exception("Service not found: {$itemData['item_type']} {$itemData['service_id']}");
        }

        // Check availability
        $availability = $provider->checkAvailability(
            $itemData['item_type'] . '_' . $itemData['service_id'],
            $itemData['configuration'] ?? []
        );

        if (!$availability->isAvailable()) {
            throw new \Exception("Service no longer available: {$itemData['item_type']} {$itemData['service_id']}");
        }

        // Calculate pricing based on configuration
        $basePrice = $this->calculateItemPrice($details, $itemData['configuration'] ?? []);
        $taxAmount = $this->taxService->calculate($basePrice, $itemData['item_type'], $currency);
        $feeAmount = $this->calculateProviderFee($basePrice, $provider);
        $serviceFee = $this->calculateServiceFee($basePrice);
        $addonTotal = $this->calculateAddons($details, $itemData['configuration'] ?? []);

        return array_merge($itemData, [
            'service_name' => $itemData['service_name'] ?? $details->getName(),
            'provider_code' => $provider->getCode(),
            'provider_item_id' => $itemData['item_type'] . '_' . $itemData['service_id'],
            'base_price' => $basePrice,
            'tax_amount' => $taxAmount,
            'fee_amount' => $feeAmount,
            'service_fee' => $serviceFee,
            'addon_total' => $addonTotal,
            'total_price' => $basePrice + $taxAmount + $feeAmount + $serviceFee + $addonTotal,
            'currency' => $currency,
            'service_details' => $details->toArray(),
            'cancellation_policy' => $details->getPolicies()['cancellation'] ?? [],
            'change_policy' => $details->getPolicies()['change'] ?? [],
        ]);
    }

    protected function calculateItemPrice(\App\Services\Providers\DTO\ProviderItemDetails $details, array $configuration): float
    {
        // Base price from provider
        $pricing = $details->getPricing();
        
        if (isset($pricing['room_types'])) {
            // Hotel - find selected room type
            $roomTypeId = $configuration['room_type_id'] ?? null;
            $roomType = $roomTypeId 
                ? collect($pricing['room_types'])->firstWhere('id', $roomTypeId)
                : collect($pricing['room_types'])->first();
            return $roomType['pricing']['total'] ?? $roomType['pricing']['per_night'] ?? 0;
        }

        if (isset($pricing['fare_options'])) {
            // Flight - find selected fare
            $fareId = $configuration['fare_id'] ?? null;
            $fare = $fareId 
                ? collect($pricing['fare_options'])->firstWhere('fare_id', $fareId)
                : collect($pricing['fare_options'])->first();
            return $fare['pricing']['total'] ?? $fare['pricing']['per_passenger'] ?? 0;
        }

        // Default
        return $pricing['base_price'] ?? $pricing['total'] ?? $pricing['per_night'] ?? 0;
    }

    protected function calculateProviderFee(float $basePrice, $provider): float
    {
        // Provider-specific fee
        return 0;
    }

    protected function calculateServiceFee(float $basePrice): float
    {
        return $basePrice * (config('booking.service_fee_percentage', 2) / 100);
    }

    protected function calculateAddons(\App\Services\Providers\DTO\ProviderItemDetails $details, array $configuration): float
    {
        $addons = $configuration['addons'] ?? [];
        $total = 0;

        foreach ($addons as $addon) {
            // Look up addon price from provider details
            // This would need provider-specific logic
        }

        return $total;
    }

    protected function isPromotionApplicable($promotion, array $items, Customer $customer): bool
    {
        // Check service type restriction
        if ($promotion->applicable_to !== 'all') {
            $allowedTypes = is_array($promotion->applicable_to) ? $promotion->applicable_to : [$promotion->applicable_to];
            $itemTypes = array_column($items, 'item_type');
            if (!array_intersect($allowedTypes, $itemTypes)) return false;
        }

        // Check minimum booking value
        if ($promotion->min_booking_value) {
            $total = array_sum(array_column($items, 'total_price'));
            if ($total < $promotion->min_booking_value) return false;
        }

        // Check customer restrictions
        if ($promotion->customer_restrictions) {
            // Implement customer type checks
        }

        // Check usage limits
        if ($promotion->usage_limit_total && $promotion->used_count >= $promotion->usage_limit_total) return false;
        if ($promotion->usage_limit_per_customer) {
            $usageCount = \App\Models\PromotionUsage::where('promotion_id', $promotion->id)
                ->where('customer_id', $customer->id)
                ->count();
            if ($usageCount >= $promotion->usage_limit_per_customer) return false;
        }

        return true;
    }

    protected function calculatePromotionDiscount($promotion, float $amount): float
    {
        $discount = 0;
        
        switch ($promotion->type) {
            case 'percentage_discount':
                $discount = $amount * ($promotion->value / 100);
                break;
            case 'fixed_discount':
                $discount = $promotion->value;
                break;
            case 'cashback':
                // Handled separately via wallet
                $discount = 0;
                break;
        }

        if ($promotion->max_discount_amount) {
            $discount = min($discount, $promotion->max_discount_amount);
        }

        return $discount;
    }

    public function confirmBooking(Booking $booking, array $options = []): Booking
    {
        return DB::transaction(function () use ($booking, $options) {
            // Verify all holds are still valid
            foreach ($booking->holds as $hold) {
                if ($hold->isExpired()) {
                    throw new \Exception("Hold expired for {$hold->bookingItem->service_name}");
                }
            }

            // Confirm with providers
            foreach ($booking->items as $item) {
                if ($item->item_status !== 'confirmed') {
                    $provider = $item->provider ?? $this->providerManager->getProvider($item->item_type);
                    
                    if ($provider) {
                        $hold = $item->holds()->where('status', 'active')->first();
                        
                        if ($hold) {
                            $confirmation = $provider->confirmBooking(
                                $hold->provider_hold_reference,
                                [
                                    'booking_reference' => $booking->booking_reference,
                                    'travelers' => $item->guests->toArray(),
                                ]
                            );

                            if ($confirmation->isSuccessful()) {
                                $item->update([
                                    'item_status' => 'confirmed',
                                    'provider_booking_reference' => $confirmation->getProviderReference(),
                                    'provider_confirmation_number' => $confirmation->getConfirmationDetails()['confirmation_number'] ?? null,
                                ]);

                                $hold->confirm($confirmation->getProviderReference());
                            } else {
                                throw new \Exception("Provider confirmation failed: {$confirmation->getError()}");
                            }
                        }
                    }

                    $item->update(['item_status' => 'confirmed']);
                }
            }

            $booking->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'payment_status' => 'paid',
            ]);

            // Create commission for agent
            if ($booking->agent_id) {
                $this->commissionService->createCommission($booking);
            }

            // Award loyalty points
            $this->loyaltyService->awardPoints($booking);

            // Send confirmation notifications
            $this->notificationService->sendBookingConfirmation($booking);

            // Generate invoice
            $this->generateInvoice($booking);

            // Release loyalty points if used
            if ($booking->loyalty_discount > 0) {
                $this->loyaltyService->redeemPoints($booking->customer, $booking->loyalty_discount * 100, $booking);
            }

            // Update customer stats
            $booking->customer->increment('booking_count');
            $booking->customer->increment('completed_booking_count');
            $booking->customer->increment('lifetime_spending', $booking->grand_total);
            $booking->customer->update(['last_booking_at' => now()]);

            if (!$booking->customer->first_booking_at) {
                $booking->customer->update(['first_booking_at' => now()]);
            }

            return $booking->fresh();
        });
    }

    public function cancelBooking(Booking $booking, array $options = []): Booking
    {
        return DB::transaction(function () use ($booking, $options) {
            $itemIds = $options['item_ids'] ?? $booking->items->pluck('id')->toArray();
            $itemsToCancel = $booking->items()->whereIn('id', $itemIds)->get();
            $isPartial = $itemsToCancel->count() < $booking->items->count();

            $totalRefund = 0;

            foreach ($itemsToCancel as $item) {
                $cancellation = $this->processItemCancellation($item, $options['reason'] ?? 'Customer requested');
                $totalRefund += $cancellation['refund_amount'];

                // Update item status
                $item->update([
                    'item_status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => $options['reason'] ?? 'Customer requested',
                    'refund_amount' => $cancellation['refund_amount'],
                ]);
            }

            // Update booking status
            $newStatus = $isPartial ? 'partially_cancelled' : 'cancelled';
            $booking->update([
                'status' => $newStatus,
                'cancelled_at' => now(),
                'cancellation_reason' => $options['reason'] ?? 'Customer requested',
                'amount_refunded' => $booking->amount_refunded + $totalRefund,
            ]);

            // Create refund if needed
            if ($totalRefund > 0) {
                $payment = $booking->payments()->where('status', 'captured')->first();
                if ($payment) {
                    $this->paymentService->refundPayment($payment, $totalRefund, 'cancellation');
                }
            }

            // Reverse commission if fully cancelled
            if (!$isPartial && $booking->agent_id) {
                $this->commissionService->reverseCommission($booking);
            }

            // Reverse loyalty points
            if ($booking->loyalty_discount > 0) {
                $this->loyaltyService->reversePoints($booking->customer, $booking->loyalty_discount * 100, $booking);
            }

            // Send cancellation notification
            $this->notificationService->sendBookingCancellation($booking);

            return $booking->fresh();
        });
    }

    protected function processItemCancellation(BookingItem $item, string $reason): array
    {
        $provider = $item->provider ?? $this->providerManager->getProvider($item->item_type);
        $cancellationPolicy = $item->cancellation_policy ?? [];
        
        $refundAmount = 0;
        $cancellationFee = 0;

        if ($provider) {
            $result = $provider->cancelBooking(
                $item->provider_booking_reference ?? '',
                ['reason' => $reason, 'refund_amount' => $item->total_price]
            );

            if ($result->isSuccessful()) {
                $refundAmount = $result->getRefundAmount();
                $cancellationFee = $result->getCancellationFee();
            }
        } else {
            // Calculate based on policy
            $calculation = $this->calculateCancellationRefund($item, $cancellationPolicy);
            $refundAmount = $calculation['refund'];
            $cancellationFee = $calculation['fee'];
        }

        return [
            'refund_amount' => $refundAmount,
            'cancellation_fee' => $cancellationFee,
        ];
    }

    protected function calculateCancellationRefund(BookingItem $item, array $policy): array
    {
        $serviceDate = $item->service_date ? Carbon::parse($item->service_date) : now()->addDays(7);
        $hoursUntilService = now()->diffInHours($serviceDate, false);
        
        $refundPercent = 100;
        $feePercent = 0;

        if (isset($policy['rules'])) {
            foreach ($policy['rules'] as $rule) {
                if ($hoursUntilService <= ($rule['hours_before'] ?? 0)) {
                    $refundPercent = $rule['refund_percent'] ?? 0;
                    $feePercent = $rule['fee_percent'] ?? 0;
                    break;
                }
            }
        }

        $refund = $item->total_price * ($refundPercent / 100);
        $fee = $item->total_price * ($feePercent / 100);

        return ['refund' => $refund, 'fee' => $fee];
    }

    public function rescheduleBooking(Booking $booking, array $options): Booking
    {
        return DB::transaction(function () use ($booking, $options) {
            $item = $booking->items()->find($options['item_id']);
            
            if (!$item) {
                throw new \Exception('Booking item not found');
            }

            $provider = $item->provider ?? $this->providerManager->getProvider($item->item_type);
            
            // Check availability for new date
            $availability = $provider->checkAvailability(
                $item->item_type . '_' . $item->service_id,
                array_merge($options, ['service_date' => $options['new_service_date']])
            );

            if (!$availability->isAvailable()) {
                throw new \Exception('No availability for requested date');
            }

            $originalSchedule = [
                'service_date' => $item->service_date,
                'service_time' => $item->service_time,
                'service_end_date' => $item->service_end_date,
            ];

            $requestedSchedule = [
                'service_date' => $options['new_service_date'],
                'service_time' => $options['new_service_time'] ?? $item->service_time,
                'service_end_date' => $options['new_service_end_date'] ?? $item->service_end_date,
            ];

            $reschedule = \App\Models\Reschedule::create([
                'booking_id' => $booking->id,
                'booking_item_id' => $item->id,
                'customer_id' => $booking->customer_id,
                'requested_by' => auth()->id(),
                'status' => 'requested',
                'original_schedule' => $originalSchedule,
                'requested_schedule' => $requestedSchedule,
                'reason' => $options['reason'],
            ]);

            // For demo, auto-approve
            $reschedule->update([
                'status' => 'approved',
                'confirmed_schedule' => $requestedSchedule,
                'reviewed_at' => now(),
                'reviewed_by' => auth()->id(),
            ]);

            $item->update([
                'service_date' => $options['new_service_date'],
                'service_time' => $options['new_service_time'] ?? $item->service_time,
                'service_end_date' => $options['new_service_end_date'] ?? $item->service_end_date,
            ]);

            $booking->update([
                'status' => 'rescheduled',
            ]);

            $this->notificationService->sendBookingReschedule($booking, $item, $originalSchedule, $requestedSchedule);

            return $booking->fresh();
        });
    }

    public function generateVoucher(Booking $booking): \Barvdh\DomPDF\PDF
    {
        $html = view('pdf.voucher', compact('booking'))->render();
        $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        return $pdf;
    }

    public function generateInvoice(Booking $booking): \App\Models\Invoice
    {
        $invoice = \App\Models\Invoice::create([
            'booking_id' => $booking->id,
            'customer_id' => $booking->customer_id,
            'payment_id' => $booking->payments()->where('status', 'captured')->first()?->id,
            'invoice_number' => 'INV-' . Str::upper(Str::random(8)),
            'invoice_type' => 'standard',
            'billing_details' => [
                'name' => $booking->customer->user->name,
                'email' => $booking->customer->user->email,
                'address' => $booking->customer->address,
            ],
            'line_items' => $booking->items->map(function ($item) {
                return [
                    'description' => $item->service_name,
                    'quantity' => 1,
                    'unit_price' => $item->base_price,
                    'tax_amount' => $item->tax_amount,
                    'total' => $item->total_price,
                ];
            })->toArray(),
            'subtotal' => $booking->subtotal,
            'tax_total' => $booking->tax_total,
            'discount_total' => $booking->discount_total + $booking->loyalty_discount + $booking->wallet_discount,
            'grand_total' => $booking->grand_total,
            'currency' => $booking->currency,
            'status' => 'issued',
            'issued_at' => now(),
        ]);

        // Generate PDF
        $pdf = Pdf::loadHTML(view('pdf.invoice', compact('invoice', 'booking'))->render())
            ->setPaper('a4', 'portrait');
        
        $path = "invoices/{$invoice->invoice_number}.pdf";
        \Storage::disk('public')->put($path, $pdf->output());
        
        $invoice->update(['pdf_path' => $path]);

        return $invoice;
    }

    public function handleProviderWebhook(Provider $provider, string $eventType, array $payload): void
    {
        Log::info("Provider webhook received", [
            'provider' => $provider->code,
            'event' => $eventType,
        ]);

        // Handle different event types
        match ($eventType) {
            'booking.confirmed' => $this->handleBookingConfirmed($provider, $payload),
            'booking.cancelled' => $this->handleBookingCancelled($provider, $payload),
            'schedule.changed' => $this->handleScheduleChanged($provider, $payload),
            default => null,
        };
    }

    protected function handleBookingConfirmed(Provider $provider, array $payload): void
    {
        $providerRef = $payload['booking_reference'] ?? $payload['confirmation_number'] ?? null;
        
        $item = BookingItem::where('provider_booking_reference', $providerRef)->first();
        
        if ($item) {
            $item->update([
                'item_status' => 'confirmed',
                'provider_confirmation_number' => $payload['confirmation_number'] ?? null,
            ]);

            $booking = $item->booking;
            if ($booking->items()->where('item_status', '!=', 'confirmed')->count() === 0) {
                $booking->update(['status' => 'confirmed']);
            }
        }
    }

    protected function handleBookingCancelled(Provider $provider, array $payload): void
    {
        $providerRef = $payload['booking_reference'] ?? null;
        
        $item = BookingItem::where('provider_booking_reference', $providerRef)->first();
        
        if ($item) {
            $item->update(['item_status' => 'cancelled']);
        }
    }

    protected function handleScheduleChanged(Provider $provider, array $payload): void
    {
        $providerRef = $payload['booking_reference'] ?? null;
        
        $item = BookingItem::where('provider_booking_reference', $providerRef)->first();
        
        if ($item) {
            $this->notificationService->sendScheduleChange($item->booking, $item, $payload);
        }
    }
}