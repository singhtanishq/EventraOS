<?php

namespace App\Services\Commission;

use App\Models\Commission;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\Agent;
use App\Models\Customer;
use App\Models\Provider;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CommissionService
{
    protected array $defaultRates = [
        'hotel' => 0.10, // 10%
        'flight' => 0.05, // 5%
        'train' => 0.03, // 3%
        'bus' => 0.08, // 8%
        'venue' => 0.12, // 12%
        'car' => 0.08, // 8%
        'activity' => 0.15, // 15%
        'transfer' => 0.10, // 10%
        'package' => 0.10, // 10%
        'insurance' => 0.20, // 20%
    ];

    protected array $tieredRates = [
        'hotel' => [
            ['min' => 0, 'max' => 10000, 'rate' => 0.10],
            ['min' => 10000, 'max' => 50000, 'rate' => 0.12],
            ['min' => 50000, 'max' => null, 'rate' => 0.15],
        ],
        'flight' => [
            ['min' => 0, 'max' => 5000, 'rate' => 0.05],
            ['min' => 5000, 'max' => 20000, 'rate' => 0.07],
            ['min' => 20000, 'max' => null, 'rate' => 0.10],
        ],
    ];

    public function createCommission(Booking $booking): void
    {
        if (!$booking->agent_id) return;

        $agent = $booking->agent;
        if (!$agent || !$agent->isActive()) return;

        DB::transaction(function () use ($booking, $agent) {
            foreach ($booking->items as $item) {
                if ($item->item_status !== 'confirmed') continue;

                $rate = $this->getCommissionRate($agent, $item->item_type, $item->base_price);
                $commissionAmount = $item->base_price * $rate;
                $taxAmount = $commissionAmount * 0.18; // 18% GST on commission
                $netCommission = $commissionAmount - $taxAmount;

                // Eligible after service completion + 30 days
                $eligibleDate = $this->calculateEligibleDate($item);

                Commission::create([
                    'booking_id' => $booking->id,
                    'booking_item_id' => $item->id,
                    'agent_id' => $agent->id,
                    'customer_id' => $booking->customer_id,
                    'provider_id' => $item->provider_id,
                    'status' => 'pending',
                    'booking_amount' => $item->base_price,
                    'commission_rate' => $rate,
                    'commission_amount' => $commissionAmount,
                    'tax_amount' => $taxAmount,
                    'net_commission' => $netCommission,
                    'currency' => $booking->currency,
                    'commission_type' => $agent->commission_type,
                    'calculation_details' => [
                        'base_price' => $item->base_price,
                        'rate_applied' => $rate,
                        'agent_commission_type' => $agent->commission_type,
                        'tier' => $this->getTierForAmount($item->item_type, $item->base_price),
                    ],
                    'eligible_date' => $eligibleDate,
                ]);
            }
        });
    }

    protected function getCommissionRate(Agent $agent, string $serviceType, float $amount): float
    {
        // Check agent-specific rules first
        if ($agent->commission_rules && isset($agent->commission_rules[$serviceType])) {
            $rule = $agent->commission_rules[$serviceType];
            
            if ($rule['type'] === 'tiered') {
                return $this->calculateTieredRate($serviceType, $amount, $rule['tiers'] ?? []);
            }
            
            if ($rule['type'] === 'fixed') {
                return $rule['value'] / $amount; // Convert fixed amount to rate
            }
            
            return $rule['value'] ?? $agent->commission_rate / 100;
        }

        // Check tiered rates
        if (isset($this->tieredRates[$serviceType])) {
            return $this->calculateTieredRate($serviceType, $amount);
        }

        // Default rate
        return $this->defaultRates[$serviceType] ?? ($agent->commission_rate / 100);
    }

    protected function calculateTieredRate(string $serviceType, float $amount, array $customTiers = []): float
    {
        $tiers = $customTiers ?: ($this->tieredRates[$serviceType] ?? []);
        
        foreach ($tiers as $tier) {
            $min = $tier['min'] ?? 0;
            $max = $tier['max'] ?? PHP_FLOAT_MAX;
            
            if ($amount >= $min && $amount < $max) {
                return $tier['rate'];
            }
        }

        // Return highest tier rate if amount exceeds all tiers
        return end($tiers)['rate'] ?? ($this->defaultRates[$serviceType] ?? 0.10);
    }

    protected function getTierForAmount(string $serviceType, float $amount): string
    {
        $tiers = $this->tieredRates[$serviceType] ?? [];
        
        foreach ($tiers as $index => $tier) {
            $min = $tier['min'] ?? 0;
            $max = $tier['max'] ?? PHP_FLOAT_MAX;
            
            if ($amount >= $min && $amount < $max) {
                return "tier_" . ($index + 1);
            }
        }
        
        return "tier_" . count($tiers);
    }

    protected function calculateEligibleDate(BookingItem $item): Carbon
    {
        $serviceEndDate = $item->service_end_date ?? $item->service_date;
        
        if (!$serviceEndDate) {
            return Carbon::now()->addDays(45); // Default 45 days
        }

        $date = Carbon::parse($serviceEndDate);
        
        // Commission eligible after service completion + 30 days for refunds/cancellations
        return $date->addDays(30);
    }

    public function approveCommissions(array $commissionIds, int $adminId): int
    {
        return DB::transaction(function () use ($commissionIds, $adminId) {
            $updated = Commission::whereIn('id', $commissionIds)
                ->where('status', 'eligible')
                ->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => $adminId,
                ]);

            return $updated;
        });
    }

    public function payCommissions(array $commissionIds, int $adminId, string $payoutReference): int
    {
        return DB::transaction(function () use ($commissionIds, $adminId, $payoutReference) {
            $updated = Commission::whereIn('id', $commissionIds)
                ->where('status', 'approved')
                ->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'paid_by' => $adminId,
                    'payout_reference' => $payoutReference,
                ]);

            // Create wallet transactions for agents
            $commissions = Commission::whereIn('id', $commissionIds)->with('agent')->get();
            
            foreach ($commissions as $commission) {
                if ($commission->agent && $commission->agent->user) {
                    // Create wallet credit for agent
                    // This would integrate with an agent wallet system
                }
            }

            return $updated;
        });
    }

    public function reverseCommission(Booking $booking): void
    {
        $booking->commissions()
            ->whereIn('status', ['pending', 'eligible', 'approved'])
            ->update([
                'status' => 'reversed',
                'reversed_at' => now(),
                'reversal_reason' => 'Booking cancelled',
            ]);
    }

    public function getAgentCommissionSummary(Agent $agent, Carbon $startDate, Carbon $endDate): array
    {
        $commissions = $agent->commissions()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        return [
            'total_bookings' => $commissions->count(),
            'total_commission_amount' => $commissions->sum('commission_amount'),
            'total_net_commission' => $commissions->sum('net_commission'),
            'pending' => $commissions->where('status', 'pending')->sum('net_commission'),
            'eligible' => $commissions->where('status', 'eligible')->sum('net_commission'),
            'approved' => $commissions->where('status', 'approved')->sum('net_commission'),
            'paid' => $commissions->where('status', 'paid')->sum('net_commission'),
            'reversed' => $commissions->where('status', 'reversed')->sum('net_commission'),
            'by_service_type' => $commissions->groupBy(function ($c) {
                return $c->bookingItem->item_type ?? 'unknown';
            })->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'commission' => $group->sum('commission_amount'),
                    'net' => $group->sum('net_commission'),
                ];
            })->toArray(),
        ];
    }

    public function processEligibleCommissions(): int
    {
        $eligibleCommissions = Commission::where('status', 'pending')
            ->where('eligible_date', '<=', now())
            ->get();

        $count = 0;
        foreach ($eligibleCommissions as $commission) {
            $commission->update(['status' => 'eligible']);
            $count++;
        }

        return $count;
    }
}