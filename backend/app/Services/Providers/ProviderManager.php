<?php

namespace App\Services\Providers;

use App\Models\Provider;
use App\Services\Providers\DTO\{
    SearchResultCollection,
    SearchResult,
    ProviderItemDetails,
    AvailabilityResult,
    HoldResult,
    BookingConfirmation,
    CancellationResult,
    BookingStatus,
    RefundResult
};
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class ProviderManager
{
    protected array $providers = [];
    protected array $providerInstances = [];

    public function __construct()
    {
        $this->loadProviders();
    }

    protected function loadProviders(): void
    {
        $providers = Provider::where('status', 'active')
            ->orderBy('priority', 'desc')
            ->get()
            ->groupBy('type');

        foreach ($providers as $type => $typeProviders) {
            foreach ($typeProviders as $provider) {
                $this->providers[$type][] = $provider;
            }
        }
    }

    public function getProvider(string $type, ?string $code = null): ?BaseProvider
    {
        $key = $type . '_' . ($code ?? 'default');

        if (isset($this->providerInstances[$key])) {
            return $this->providerInstances[$key];
        }

        $providers = $this->providers[$type] ?? [];

        if (empty($providers)) {
            return null;
        }

        if ($code) {
            $provider = collect($providers)->firstWhere('code', $code);
        } else {
            $provider = collect($providers)->firstWhere('is_default', true) ?? $providers[0];
        }

        if (!$provider) {
            return null;
        }

        $instance = $this->createProviderInstance($provider);
        $this->providerInstances[$key] = $instance;

        return $instance;
    }

    public function getProviders(string $type): array
    {
        return array_map(
            fn ($provider) => $this->createProviderInstance($provider),
            $this->providers[$type] ?? []
        );
    }

    protected function createProviderInstance(Provider $provider): BaseProvider
    {
        $className = $this->getProviderClassName($provider);
        
        if (class_exists($className)) {
            return new $className($provider);
        }

        // Fallback to base class if specific implementation doesn't exist
        Log::warning("Provider class {$className} not found, using base provider");
        return new BaseProvider($provider);
    }

    protected function getProviderClassName(Provider $provider): string
    {
        $typeClass = ucfirst($provider->type);
        $modeClass = ucfirst($provider->mode);
        $nameClass = str_replace(' ', '', ucwords(str_replace(['_', '-'], ' ', $provider->code)));

        return "App\\Services\\Providers\\{$modeClass}{$typeClass}Provider";
    }

    public function search(string $type, array $criteria): SearchResultCollection
    {
        $providers = $this->getProviders($type);
        
        if (empty($providers)) {
            return new SearchResultCollection([], 0, '', ['No active providers for type: ' . $type]);
        }

        $results = new SearchResultCollection();
        $errors = [];

        foreach ($providers as $provider) {
            try {
                $providerResults = $provider->search($criteria);
                $results->merge($providerResults);
                
                if ($providerResults->hasErrors()) {
                    $errors = array_merge($errors, $providerResults->getErrors());
                }
            } catch (\Throwable $e) {
                Log::error("Provider {$provider->getCode()} search failed", [
                    'type' => $type,
                    'criteria' => $criteria,
                    'error' => $e->getMessage(),
                ]);
                $errors[] = "Provider {$provider->getCode()}: " . $e->getMessage();
            }
        }

        if (!empty($errors)) {
            $results = new SearchResultCollection(
                $results->getResults(),
                $results->getTotalCount(),
                $results->getProviderCode(),
                $errors
            );
        }

        return $results;
    }

    public function getDetails(string $type, string $itemId, array $options = []): ?ProviderItemDetails
    {
        // Extract provider code from itemId if present (e.g., "flight_123" -> provider could be determined)
        $provider = $this->getProvider($type);
        
        if (!$provider) {
            return null;
        }

        try {
            return $provider->getDetails($itemId, $options);
        } catch (\Throwable $e) {
            Log::error("Provider {$provider->getCode()} getDetails failed", [
                'item_id' => $itemId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function checkAvailability(string $type, string $itemId, array $criteria): AvailabilityResult
    {
        $provider = $this->getProvider($type);
        
        if (!$provider) {
            return new AvailabilityResult(false, 0, 0, 'INR');
        }

        try {
            return $provider->checkAvailability($itemId, $criteria);
        } catch (\Throwable $e) {
            Log::error("Provider {$provider->getCode()} checkAvailability failed", [
                'item_id' => $itemId,
                'error' => $e->getMessage(),
            ]);
            return new AvailabilityResult(false, 0, 0, 'INR', [], null);
        }
    }

    public function createHold(string $type, array $bookingData): HoldResult
    {
        $provider = $this->getProvider($type);
        
        if (!$provider) {
            return new HoldResult('', now(), [], false, 'No active provider for type: ' . $type);
        }

        try {
            return $provider->createHold($bookingData);
        } catch (\Throwable $e) {
            Log::error("Provider {$provider->getCode()} createHold failed", [
                'error' => $e->getMessage(),
            ]);
            return new HoldResult('', now(), [], false, $e->getMessage());
        }
    }

    public function confirmBooking(string $type, string $holdReference, array $bookingData): BookingConfirmation
    {
        $provider = $this->getProvider($type);
        
        if (!$provider) {
            return new BookingConfirmation('', '', [], false, 'No active provider for type: ' . $type);
        }

        try {
            return $provider->confirmBooking($holdReference, $bookingData);
        } catch (\Throwable $e) {
            Log::error("Provider {$provider->getCode()} confirmBooking failed", [
                'error' => $e->getMessage(),
            ]);
            return new BookingConfirmation('', '', [], false, $e->getMessage());
        }
    }

    public function cancelBooking(string $type, string $bookingReference, array $options = []): CancellationResult
    {
        $provider = $this->getProvider($type);
        
        if (!$provider) {
            return new CancellationResult(false, 0, 0, null, 'No active provider for type: ' . $type);
        }

        try {
            return $provider->cancelBooking($bookingReference, $options);
        } catch (\Throwable $e) {
            Log::error("Provider {$provider->getCode()} cancelBooking failed", [
                'error' => $e->getMessage(),
            ]);
            return new CancellationResult(false, 0, 0, null, $e->getMessage());
        }
    }

    public function getBookingStatus(string $type, string $bookingReference): BookingStatus
    {
        $provider = $this->getProvider($type);
        
        if (!$provider) {
            return new BookingStatus('unknown', 'unknown', []);
        }

        try {
            return $provider->getBookingStatus($bookingReference);
        } catch (\Throwable $e) {
            Log::error("Provider {$provider->getCode()} getBookingStatus failed", [
                'error' => $e->getMessage(),
            ]);
            return new BookingStatus('unknown', 'unknown', ['error' => $e->getMessage()]);
        }
    }

    public function processRefund(string $type, string $bookingReference, float $amount, string $reason): RefundResult
    {
        $provider = $this->getProvider($type);
        
        if (!$provider) {
            return new RefundResult(false, '', 0, null, 'No active provider for type: ' . $type);
        }

        try {
            return $provider->processRefund($bookingReference, $amount, $reason);
        } catch (\Throwable $e) {
            Log::error("Provider {$provider->getCode()} processRefund failed", [
                'error' => $e->getMessage(),
            ]);
            return new RefundResult(false, '', 0, null, $e->getMessage());
        }
    }

    public function getAvailableTypes(): array
    {
        return array_keys($this->providers);
    }

    public function getProviderStatus(string $type): array
    {
        $providers = $this->getProviders($type);
        
        return array_map(function ($provider) {
            return [
                'code' => $provider->getCode(),
                'name' => $provider->provider->name,
                'mode' => $provider->provider->mode,
                'status' => $provider->provider->status,
                'last_sync' => $provider->provider->last_sync_at?->toISOString(),
                'last_error' => $provider->provider->last_error_message,
                'success_count' => $provider->provider->success_count,
                'error_count' => $provider->provider->error_count,
                'avg_latency_ms' => $provider->provider->avg_latency_ms,
            ];
        }, $providers);
    }
}