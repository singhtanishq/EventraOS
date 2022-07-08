<?php

namespace App\Services\Providers;

use App\Contracts\ProviderInterface;
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

abstract class BaseProvider implements ProviderInterface
{
    protected Provider $provider;
    protected array $config = [];
    protected int $requestCount = 0;
    protected int $errorCount = 0;

    public function __construct(Provider $provider)
    {
        $this->provider = $provider;
        $this->config = $provider->configuration ?? [];
    }

    public function getType(): string
    {
        return $this->provider->type;
    }

    public function getCode(): string
    {
        return $this->provider->code;
    }

    public function isAvailable(): bool
    {
        return $this->provider->isActive();
    }

    public function getCapabilities(): array
    {
        return $this->provider->capabilities ?? [];
    }

    abstract public function search(array $criteria): SearchResultCollection;

    abstract public function getDetails(string $itemId, array $options = []): ?ProviderItemDetails;

    abstract public function checkAvailability(string $itemId, array $criteria): AvailabilityResult;

    abstract public function createHold(array $bookingData): HoldResult;

    abstract public function confirmBooking(string $holdReference, array $bookingData): BookingConfirmation;

    abstract public function cancelBooking(string $bookingReference, array $options = []): CancellationResult;

    abstract public function getBookingStatus(string $bookingReference): BookingStatus;

    abstract public function processRefund(string $bookingReference, float $amount, string $reason): RefundResult;

    protected function makeRequest(string $endpoint, string $method = 'GET', array $data = [], array $headers = []): array
    {
        $startTime = microtime(true);
        $correlationId = 'req_' . uniqid('', true);
        
        try {
            $client = $this->getHttpClient();
            
            $response = $client->request($method, $this->provider->base_url . $endpoint, [
                'headers' => array_merge([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'X-Correlation-ID' => $correlationId,
                ], $headers),
                'json' => $data,
                'timeout' => $this->config['timeout'] ?? 30,
            ]);

            $duration = (microtime(true) - $startTime) * 1000;
            $this->recordSuccess($duration);
            
            return json_decode($response->getBody()->getContents(), true) ?? [];

        } catch (\Throwable $e) {
            $duration = (microtime(true) - $startTime) * 1000;
            $this->recordError($e->getMessage(), $duration);
            
            Log::error("Provider {$this->getCode()} request failed", [
                'endpoint' => $endpoint,
                'method' => $method,
                'error' => $e->getMessage(),
                'duration_ms' => $duration,
                'correlation_id' => $correlationId,
            ]);

            throw $e;
        }
    }

    protected function getHttpClient(): \GuzzleHttp\Client
    {
        return new \GuzzleHttp\Client([
            'base_uri' => $this->provider->base_url,
            'timeout' => $this->config['timeout'] ?? 30,
            'headers' => $this->getAuthHeaders(),
        ]);
    }

    protected function getAuthHeaders(): array
    {
        $credentials = $this->provider->credentials ?? [];
        
        if (isset($credentials['api_key'])) {
            return ['Authorization' => 'Bearer ' . $credentials['api_key']];
        }
        
        if (isset($credentials['username']) && isset($credentials['password'])) {
            return [
                'Authorization' => 'Basic ' . base64_encode($credentials['username'] . ':' . $credentials['password'])
            ];
        }
        
        return [];
    }

    protected function recordSuccess(int $durationMs): void
    {
        $this->requestCount++;
        $this->provider->recordSuccess($durationMs);
    }

    protected function recordError(string $message, int $durationMs = 0): void
    {
        $this->errorCount++;
        $this->provider->recordError($message, $durationMs);
    }

    protected function mapToSearchResult(array $data): SearchResult
    {
        return new SearchResult(
            id: $data['id'] ?? '',
            name: $data['name'] ?? '',
            type: $this->getType(),
            providerCode: $this->getCode(),
            providerItemId: $data['provider_id'] ?? $data['id'] ?? '',
            location: $data['location'] ?? [],
            pricing: $data['pricing'] ?? [],
            availability: $data['availability'] ?? [],
            images: $data['images'] ?? [],
            amenities: $data['amenities'] ?? [],
            metadata: $data['metadata'] ?? [],
            rating: (float)($data['rating'] ?? 0),
            reviewCount: (int)($data['review_count'] ?? 0),
        );
    }

    protected function handleError(\Throwable $e, string $operation): array
    {
        Log::error("Provider {$this->getCode()} {$operation} failed", [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return [
            'error' => $e->getMessage(),
            'provider' => $this->getCode(),
        ];
    }
}