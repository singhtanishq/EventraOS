<?php

namespace App\Services\Currency;

use Illuminate\Support\Facades\Cache;

class CurrencyService
{
    protected array $currencies = [
        'INR' => ['symbol' => '₹', 'name' => 'Indian Rupee', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'USD' => ['symbol' => '$', 'name' => 'US Dollar', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'EUR' => ['symbol' => '€', 'name' => 'Euro', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'GBP' => ['symbol' => '£', 'name' => 'British Pound', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'AED' => ['symbol' => 'د.إ', 'name' => 'UAE Dirham', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'SGD' => ['symbol' => 'S$', 'name' => 'Singapore Dollar', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'THB' => ['symbol' => '฿', 'name' => 'Thai Baht', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'JPY' => ['symbol' => '¥', 'name' => 'Japanese Yen', 'decimal_places' => 0, 'symbol_position' => 'before'],
        'CNY' => ['symbol' => '¥', 'name' => 'Chinese Yuan', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'AUD' => ['symbol' => 'A$', 'name' => 'Australian Dollar', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'CAD' => ['symbol' => 'C$', 'name' => 'Canadian Dollar', 'decimal_places' => 2, 'symbol_position' => 'before'],
        'CHF' => ['symbol' => 'CHF', 'name' => 'Swiss Franc', 'decimal_places' => 2, 'symbol_position' => 'before'],
    ];

    protected array $exchangeRates = [
        'INR' => 1,
        'USD' => 0.012,
        'EUR' => 0.011,
        'GBP' => 0.0095,
        'AED' => 0.044,
        'SGD' => 0.016,
        'THB' => 0.42,
        'JPY' => 1.8,
        'CNY' => 0.087,
        'AUD' => 0.018,
        'CAD' => 0.016,
        'CHF' => 0.011,
    ];

    public function format(float $amount, string $currency = 'INR', int $decimals = null): string
    {
        $currency = strtoupper($currency);
        $info = $this->currencies[$currency] ?? $this->currencies['INR'];
        
        $decimals = $decimals ?? $info['decimal_places'];
        $symbol = $info['symbol'];
        $position = $info['symbol_position'];

        $formatted = number_format($amount, $decimals, '.', ',');

        if ($position === 'before') {
            return $symbol . $formatted;
        }

        return $formatted . ' ' . $symbol;
    }

    public function formatCompact(float $amount, string $currency = 'INR'): string
    {
        $currency = strtoupper($currency);
        $info = $this->currencies[$currency] ?? $this->currencies['INR'];
        $symbol = $info['symbol'];

        if ($amount >= 10000000) { // 1 crore
            return $symbol . number_format($amount / 10000000, 1) . ' Cr';
        } elseif ($amount >= 100000) { // 1 lakh
            return $symbol . number_format($amount / 100000, 1) . ' L';
        } elseif ($amount >= 1000) {
            return $symbol . number_format($amount / 1000, 1) . 'K';
        }

        return $this->format($amount, $currency);
    }

    public function convert(float $amount, string $fromCurrency, string $toCurrency): float
    {
        $fromCurrency = strtoupper($fromCurrency);
        $toCurrency = strtoupper($toCurrency);

        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        $fromRate = $this->exchangeRates[$fromCurrency] ?? 1;
        $toRate = $this->exchangeRates[$toCurrency] ?? 1;

        // Convert to INR first, then to target
        $inrAmount = $amount / $fromRate;
        return $inrAmount * $toRate;
    }

    public function getExchangeRate(string $fromCurrency, string $toCurrency): float
    {
        $fromCurrency = strtoupper($fromCurrency);
        $toCurrency = strtoupper($toCurrency);

        if ($fromCurrency === $toCurrency) {
            return 1.0;
        }

        $fromRate = $this->exchangeRates[$fromCurrency] ?? 1;
        $toRate = $this->exchangeRates[$toCurrency] ?? 1;

        return $toRate / $fromRate;
    }

    public function getSupportedCurrencies(): array
    {
        return array_keys($this->currencies);
    }

    public function getCurrencyInfo(string $currency): array
    {
        $currency = strtoupper($currency);
        return $this->currencies[$currency] ?? $this->currencies['INR'];
    }

    public function getCurrencySymbol(string $currency): string
    {
        $currency = strtoupper($currency);
        return $this->currencies[$currency]['symbol'] ?? '₹';
    }

    // Fetch live rates from API (placeholder)
    public function fetchLiveRates(): void
    {
        // In production, fetch from exchangerate-api.com, fixer.io, etc.
        // Cache for 1 hour
        Cache::remember('exchange_rates', 3600, function () {
            return $this->exchangeRates;
        });
    }
}