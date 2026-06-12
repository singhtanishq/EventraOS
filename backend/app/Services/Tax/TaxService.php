<?php

namespace App\Services\Tax;

use App\Models\SystemSetting;

class TaxService
{
    protected array $taxRules = [
        'hotel' => [
            'IN' => [
                'gst' => 0.18, // 18% GST for hotels > ₹7500/night
                'threshold' => 7500,
                'gst_below_threshold' => 0.12, // 12% for below threshold
            ],
            'default' => ['gst' => 0.18],
        ],
        'flight' => [
            'IN' => [
                'gst_economy' => 0.05, // 5% GST for economy
                'gst_business' => 0.12, // 12% GST for business/first
                'udf' => 0, // User Development Fee varies by airport
                'asf' => 0, // Aviation Security Fee
            ],
            'default' => ['gst' => 0.05],
        ],
        'train' => [
            'IN' => [
                'gst' => 0.05, // 5% GST on train tickets
            ],
            'default' => ['gst' => 0.05],
        ],
        'bus' => [
            'IN' => [
                'gst' => 0.18, // 18% GST on bus tickets
            ],
            'default' => ['gst' => 0.18],
        ],
        'venue' => [
            'IN' => [
                'gst' => 0.18, // 18% GST on venue booking
            ],
            'default' => ['gst' => 0.18],
        ],
        'car' => [
            'IN' => [
                'gst' => 0.18, // 18% GST on car rental
            ],
            'default' => ['gst' => 0.18],
        ],
        'activity' => [
            'IN' => [
                'gst' => 0.18, // 18% GST on activities
            ],
            'default' => ['gst' => 0.18],
        ],
        'transfer' => [
            'IN' => [
                'gst' => 0.05, // 5% GST on transport services
            ],
            'default' => ['gst' => 0.05],
        ],
        'package' => [
            'IN' => [
                'gst' => 0.18, // Composite supply - depends on primary component
            ],
            'default' => ['gst' => 0.18],
        ],
        'insurance' => [
            'IN' => [
                'gst' => 0.18, // 18% GST on insurance
            ],
            'default' => ['gst' => 0.18],
        ],
    ];

    protected array $countryTaxConfigs = [];

    public function calculate(float $amount, string $serviceType, string $currency = 'INR', array $options = []): float
    {
        $country = $options['country'] ?? 'IN';
        $serviceType = strtolower($serviceType);

        if (!isset($this->taxRules[$serviceType])) {
            return 0;
        }

        $rules = $this->taxRules[$serviceType][$country] ?? $this->taxRules[$serviceType]['default'] ?? [];
        $tax = 0;

        // Handle specific rules per service type
        switch ($serviceType) {
            case 'hotel':
                $tax = $this->calculateHotelTax($amount, $rules, $options);
                break;
            case 'flight':
                $tax = $this->calculateFlightTax($amount, $rules, $options);
                break;
            default:
                $rate = $rules['gst'] ?? 0.18;
                $tax = $amount * $rate;
        }

        return round($tax, 2);
    }

    protected function calculateHotelTax(float $amount, array $rules, array $options): float
    {
        $threshold = $rules['threshold'] ?? 7500;
        $rate = $amount >= $threshold ? ($rules['gst'] ?? 0.18) : ($rules['gst_below_threshold'] ?? 0.12);
        
        // For room rentals, tax applies on base tariff
        return round($amount * $rate, 2);
    }

    protected function calculateFlightTax(float $amount, array $rules, array $options): float
    {
        $cabinClass = $options['cabin_class'] ?? 'economy';
        $rate = ($cabinClass === 'economy') 
            ? ($rules['gst_economy'] ?? 0.05) 
            : ($rules['gst_business'] ?? 0.12);
        
        return round($amount * $rate, 2);
    }

    public function getTaxBreakdown(float $amount, string $serviceType, string $currency = 'INR', array $options = []): array
    {
        $country = $options['country'] ?? 'IN';
        $serviceType = strtolower($serviceType);

        if (!isset($this->taxRules[$serviceType])) {
            return [
                'total_tax' => 0,
                'components' => [],
            ];
        }

        $rules = $this->taxRules[$serviceType][$country] ?? $this->taxRules[$serviceType]['default'] ?? [];
        $components = [];
        $totalTax = 0;

        switch ($serviceType) {
            case 'hotel':
                $gst = $this->calculateHotelTax($amount, $rules, $options);
                $components[] = ['name' => 'GST', 'rate' => ($amount >= ($rules['threshold'] ?? 7500) ? 18 : 12) . '%', 'amount' => $gst];
                $totalTax = $gst;
                break;
            
            case 'flight':
                $cabinClass = $options['cabin_class'] ?? 'economy';
                $gst = $this->calculateFlightTax($amount, $rules, $options);
                $components[] = ['name' => 'GST', 'rate' => ($cabinClass === 'economy' ? 5 : 12) . '%', 'amount' => $gst];
                
                // Additional fees
                if (!empty($rules['udf'])) {
                    $components[] = ['name' => 'User Development Fee', 'rate' => 'fixed', 'amount' => $rules['udf']];
                    $totalTax += $rules['udf'];
                }
                if (!empty($rules['asf'])) {
                    $components[] = ['name' => 'Aviation Security Fee', 'rate' => 'fixed', 'amount' => $rules['asf']];
                    $totalTax += $rules['asf'];
                }
                $totalTax += $gst;
                break;
            
            default:
                $rate = ($rules['gst'] ?? 0.18) * 100;
                $tax = round($amount * ($rules['gst'] ?? 0.18), 2);
                $components[] = ['name' => 'GST', 'rate' => $rate . '%', 'amount' => $tax];
                $totalTax = $tax;
        }

        return [
            'total_tax' => round($totalTax, 2),
            'components' => $components,
        ];
    }

    public function getEffectiveRate(string $serviceType, string $country = 'IN', array $options = []): float
    {
        $serviceType = strtolower($serviceType);
        $rules = $this->taxRules[$serviceType][$country] ?? $this->taxRules[$serviceType]['default'] ?? [];

        switch ($serviceType) {
            case 'hotel':
                $amount = $options['amount'] ?? 0;
                $threshold = $rules['threshold'] ?? 7500;
                return $amount >= $threshold ? ($rules['gst'] ?? 0.18) : ($rules['gst_below_threshold'] ?? 0.12);
            case 'flight':
                $cabinClass = $options['cabin_class'] ?? 'economy';
                return ($cabinClass === 'economy') ? ($rules['gst_economy'] ?? 0.05) : ($rules['gst_business'] ?? 0.12);
            default:
                return $rules['gst'] ?? 0.18;
        }
    }

    // Get tax configuration for admin UI
    public function getTaxConfig(): array
    {
        return $this->taxRules;
    }

    // Update tax rules (admin)
    public function updateTaxRules(array $rules): void
    {
        $this->taxRules = array_merge_recursive($this->taxRules, $rules);
        
        // Save to database
        SystemSetting::updateOrCreate(
            ['key' => 'tax_rules'],
            ['value' => json_encode($this->taxRules), 'type' => 'json', 'group' => 'tax']
        );
    }
}