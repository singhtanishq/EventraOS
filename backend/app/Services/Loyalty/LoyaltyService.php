<?php

namespace App\Services\Loyalty;

use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\Customer;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LoyaltyService
{
    protected float $earnRate = 0.01; // 1% of booking value = 1 point per 100 currency
    protected int $pointsPerCurrencyUnit = 1; // 1 point per 1 INR (or equivalent)
    protected array $tierThresholds = [
        'bronze' => 0,
        'silver' => 5000,
        'gold' => 20000,
        'platinum' => 50000,
    ];
    protected array $tierMultipliers = [
        'bronze' => 1.0,
        'silver' => 1.25,
        'gold' => 1.5,
        'platinum' => 2.0,
    ];
    protected array $tierBenefits = [
        'bronze' => ['welcome_bonus' => 100],
        'silver' => ['priority_support' => true, 'bonus_multiplier' => 1.25],
        'gold' => ['free_cancellation' => true, 'bonus_multiplier' => 1.5, 'lounge_access' => 2],
        'platinum' => ['dedicated_agent' => true, 'bonus_multiplier' => 2.0, 'lounge_access' => 'unlimited', 'upgrade_priority' => true],
    ];

    public function awardPoints(Booking $booking): void
    {
        if ($booking->status !== 'confirmed') return;

        $customer = $booking->customer;
        $account = $customer->loyaltyAccount;

        if (!$account) {
            $account = $customer->loyaltyAccount()->create([]);
        }

        $bookingAmount = $booking->grand_total - $booking->loyalty_discount - $booking->wallet_discount;
        $basePoints = floor($bookingAmount * $this->earnRate);
        
        // Apply tier multiplier
        $multiplier = $this->tierMultipliers[$account->tier] ?? 1.0;
        $points = floor($basePoints * $multiplier);

        // Minimum points per booking
        $points = max($points, 10);

        // Check for pending points (held until completion)
        $pendingPoints = $points;

        $transaction = LoyaltyTransaction::create([
            'loyalty_account_id' => $account->id,
            'type' => 'earned',
            'status' => 'pending',
            'points' => $pendingPoints,
            'balance_before' => $account->points_balance + $account->points_pending,
            'balance_after' => $account->points_balance + $account->points_pending + $pendingPoints,
            'description' => "Booking {$booking->booking_reference}",
            'related_booking_id' => $booking->id,
            'related_payment_id' => $booking->payments()->where('status', 'captured')->first()?->id,
            'booking_amount' => $bookingAmount,
            'earn_rate' => $this->earnRate * 100, // Store as percentage
            'expires_at' => Carbon::now()->addYears(2), // Points expire in 2 years
        ]);

        // Update account pending points
        $account->increment('points_pending', $pendingPoints);
        $account->increment('points_lifetime_earned', $pendingPoints);

        // Check for tier upgrade
        $this->checkTierUpgrade($account);
    }

    public function confirmPoints(Booking $booking): void
    {
        $customer = $booking->customer;
        $account = $customer->loyaltyAccount;

        if (!$account) return;

        $pendingTransaction = LoyaltyTransaction::where('related_booking_id', $booking->id)
            ->where('type', 'earned')
            ->where('status', 'pending')
            ->first();

        if ($pendingTransaction) {
            $pendingTransaction->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $account->decrement('points_pending', $pendingTransaction->points);
            $account->increment('points_balance', $pendingTransaction->points);

            $pendingTransaction->update([
                'balance_before' => $account->points_balance,
                'balance_after' => $account->points_balance,
            ]);
        }
    }

    public function redeemPoints(Customer $customer, int $points, Booking $booking = null): bool
    {
        $account = $customer->loyaltyAccount;

        if (!$account || $account->points_balance < $points) {
            return false;
        }

        DB::transaction(function () use ($account, $points, $booking) {
            LoyaltyTransaction::create([
                'loyalty_account_id' => $account->id,
                'type' => 'redeemed',
                'status' => 'completed',
                'points' => -$points,
                'balance_before' => $account->points_balance,
                'balance_after' => $account->points_balance - $points,
                'description' => $booking ? "Booking {$booking->booking_reference}" : 'Loyalty redemption',
                'related_booking_id' => $booking?->id,
                'completed_at' => now(),
            ]);

            $account->decrement('points_balance', $points);
            $account->increment('points_lifetime_redeemed', $points);
        });

        return true;
    }

    public function reversePoints(Customer $customer, int $points, Booking $booking = null): void
    {
        $account = $customer->loyaltyAccount;

        if (!$account) return;

        DB::transaction(function () use ($account, $points, $booking) {
            // Reverse pending points
            $pendingTransaction = LoyaltyTransaction::where('related_booking_id', $booking?->id)
                ->where('type', 'earned')
                ->where('status', 'pending')
                ->first();

            if ($pendingTransaction) {
                $pendingTransaction->update([
                    'status' => 'reversed',
                    'points' => 0,
                ]);

                $account->decrement('points_pending', $pendingTransaction->getOriginal('points'));
            }

            // Reverse completed points
            $completedTransaction = LoyaltyTransaction::where('related_booking_id', $booking?->id)
                ->where('type', 'earned')
                ->where('status', 'completed')
                ->first();

            if ($completedTransaction && $account->points_balance >= $points) {
                LoyaltyTransaction::create([
                    'loyalty_account_id' => $account->id,
                    'type' => 'reversed',
                    'status' => 'completed',
                    'points' => -$points,
                    'balance_before' => $account->points_balance,
                    'balance_after' => $account->points_balance - $points,
                    'description' => "Reversal for booking {$booking->booking_reference}",
                    'related_booking_id' => $booking?->id,
                    'completed_at' => now(),
                ]);

                $account->decrement('points_balance', $points);
                $account->increment('points_lifetime_redeemed', $points); // Track as redeemed for reversal
            }
        });
    }

    public function expirePoints(): int
    {
        $expiredTransactions = LoyaltyTransaction::where('type', 'earned')
            ->where('status', 'completed')
            ->where('expires_at', '<=', now())
            ->get();

        $totalExpired = 0;

        foreach ($expiredTransactions as $transaction) {
            $account = $transaction->loyaltyAccount;
            
            if ($account->points_balance >= $transaction->points) {
                LoyaltyTransaction::create([
                    'loyalty_account_id' => $account->id,
                    'type' => 'expired',
                    'status' => 'completed',
                    'points' => -$transaction->points,
                    'balance_before' => $account->points_balance,
                    'balance_after' => $account->points_balance - $transaction->points,
                    'description' => 'Points expired',
                    'completed_at' => now(),
                ]);

                $account->decrement('points_balance', $transaction->points);
                $account->increment('points_expired', $transaction->points);
                $totalExpired += $transaction->points;
            }

            $transaction->update(['status' => 'expired']);
        }

        return $totalExpired;
    }

    protected function checkTierUpgrade(LoyaltyAccount $account): void
    {
        $currentTier = $account->tier;
        $lifetimePoints = $account->points_lifetime_earned;
        $newTier = $currentTier;

        foreach (array_reverse($this->tierThresholds) as $tier => $threshold) {
            if ($lifetimePoints >= $threshold) {
                $newTier = $tier;
                break;
            }
        }

        if ($newTier !== $currentTier) {
            $account->update([
                'tier' => $newTier,
                'tier_achieved_at' => now(),
                'tier_expires_at' => $newTier !== 'bronze' ? now()->addYear() : null,
            ]);

            // Award tier upgrade bonus
            if (isset($this->tierBenefits[$newTier]['welcome_bonus'])) {
                $bonus = $this->tierBenefits[$newTier]['welcome_bonus'];
                
                LoyaltyTransaction::create([
                    'loyalty_account_id' => $account->id,
                    'type' => 'bonus',
                    'status' => 'completed',
                    'points' => $bonus,
                    'balance_before' => $account->points_balance,
                    'balance_after' => $account->points_balance + $bonus,
                    'description' => "Tier upgrade to " . ucfirst($newTier),
                    'completed_at' => now(),
                ]);

                $account->increment('points_balance', $bonus);
            }
        }
    }

    public function getAccountSummary(Customer $customer): array
    {
        $account = $customer->loyaltyAccount;

        if (!$account) {
            return [
                'tier' => 'bronze',
                'points_balance' => 0,
                'points_pending' => 0,
                'lifetime_earned' => 0,
                'lifetime_redeemed' => 0,
                'next_tier' => 'silver',
                'points_to_next_tier' => 5000,
                'tier_benefits' => $this->tierBenefits['bronze'],
            ];
        }

        $nextTier = $this->getNextTier($account->tier);
        $nextThreshold = $this->tierThresholds[$nextTier] ?? 0;

        return [
            'tier' => $account->tier,
            'points_balance' => $account->points_balance,
            'points_pending' => $account->points_pending,
            'lifetime_earned' => $account->points_lifetime_earned,
            'lifetime_redeemed' => $account->points_lifetime_redeemed,
            'points_expired' => $account->points_expired,
            'next_tier' => $nextTier,
            'points_to_next_tier' => max(0, $nextThreshold - $account->points_lifetime_earned),
            'tier_progress' => $nextThreshold > 0 
                ? min(100, ($account->points_lifetime_earned / $nextThreshold) * 100)
                : 100,
            'tier_benefits' => $this->tierBenefits[$account->tier] ?? [],
            'tier_expires_at' => $account->tier_expires_at,
        ];
    }

    protected function getNextTier(string $currentTier): string
    {
        $tiers = array_keys($this->tierThresholds);
        $currentIndex = array_search($currentTier, $tiers);
        
        if ($currentIndex !== false && $currentIndex < count($tiers) - 1) {
            return $tiers[$currentIndex + 1];
        }
        
        return $currentTier;
    }

    public function getRedemptionValue(int $points): float
    {
        // 1 point = 0.01 INR (100 points = 1 INR)
        return $points * 0.01;
    }

    public function getPointsForAmount(float $amount): int
    {
        return floor($amount * $this->earnRate);
    }
}