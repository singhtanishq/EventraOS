<?php

namespace App\Services\Search;

use App\Services\Providers\ProviderManager;
use App\Services\Providers\DTO\SearchResultCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SearchService
{
    protected ProviderManager $providerManager;

    public function __construct(ProviderManager $providerManager)
    {
        $this->providerManager = $providerManager;
    }

    public function searchHotels(array $criteria): SearchResultCollection
    {
        $cacheKey = $this->generateCacheKey('hotels', $criteria);
        
        return Cache::remember($cacheKey, config('search.cache_ttl', 300), function () use ($criteria) {
            return $this->providerManager->search('hotel', $criteria);
        });
    }

    public function searchFlights(array $criteria): SearchResultCollection
    {
        $cacheKey = $this->generateCacheKey('flights', $criteria);
        
        return Cache::remember($cacheKey, config('search.cache_ttl', 300), function () use ($criteria) {
            return $this->providerManager->search('flight', $criteria);
        });
    }

    public function searchTrains(array $criteria): SearchResultCollection
    {
        return $this->providerManager->search('train', $criteria);
    }

    public function searchBuses(array $criteria): SearchResultCollection
    {
        return $this->providerManager->search('bus', $criteria);
    }

    public function searchVenues(array $criteria): SearchResultCollection
    {
        return $this->providerManager->search('venue', $criteria);
    }

    public function searchCars(array $criteria): SearchResultCollection
    {
        return $this->providerManager->search('car', $criteria);
    }

    public function searchActivities(array $criteria): SearchResultCollection
    {
        return $this->providerManager->search('activity', $criteria);
    }

    public function searchTransfers(array $criteria): SearchResultCollection
    {
        return $this->providerManager->search('transfer', $criteria);
    }

    public function searchPackages(array $criteria): SearchResultCollection
    {
        return $this->providerManager->search('package', $criteria);
    }

    public function searchAll(array $criteria): array
    {
        $types = $criteria['types'] ?? ['hotels', 'flights', 'trains', 'buses', 'venues', 'cars', 'activities', 'transfers', 'packages'];
        $results = [];

        foreach ($types as $type) {
            try {
                $method = 'search' . ucfirst(strtolower($type));
                if (method_exists($this, $method)) {
                    $results[$type] = $this->$method($criteria);
                }
            } catch (\Throwable $e) {
                Log::error("Search {$type} failed", ['error' => $e->getMessage()]);
                $results[$type] = new SearchResultCollection([], 0, '', [$e->getMessage()]);
            }
        }

        return $results;
    }

    public function getHotelDetails(string $hotelId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        return $this->providerManager->getDetails('hotel', $hotelId, $options);
    }

    public function getFlightDetails(string $flightId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        return $this->providerManager->getDetails('flight', $flightId, $options);
    }

    public function getVenueDetails(string $venueId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        return $this->providerManager->getDetails('venue', $venueId, $options);
    }

    public function checkHotelAvailability(string $hotelId, array $criteria): \App\Services\Providers\DTO\AvailabilityResult
    {
        return $this->providerManager->checkAvailability('hotel', $hotelId, $criteria);
    }

    public function checkFlightAvailability(string $flightId, array $criteria): \App\Services\Providers\DTO\AvailabilityResult
    {
        return $this->providerManager->checkAvailability('flight', $flightId, $criteria);
    }

    protected function generateCacheKey(string $type, array $criteria): string
    {
        ksort($criteria);
        return "search:{$type}:" . md5(json_encode($criteria));
    }

    public function clearCache(string $type = null): void
    {
        if ($type) {
            Cache::flush(); // In production, use tag-based cache invalidation
        } else {
            Cache::flush();
        }
    }

    public function getSearchSuggestions(string $query, string $type = 'all'): array
    {
        $suggestions = [];
        
        if (in_array($type, ['all', 'cities'])) {
            $cities = \App\Models\City::where('name', 'LIKE', "%{$query}%")
                ->where('is_active', true)
                ->where('is_popular', true)
                ->limit(10)
                ->get(['id', 'name', 'country_id'])
                ->map(function ($city) {
                    return [
                        'type' => 'city',
                        'id' => $city->id,
                        'name' => $city->name,
                        'country' => $city->country->name ?? '',
                    ];
                });
            $suggestions = array_merge($suggestions, $cities->toArray());
        }

        if (in_array($type, ['all', 'airports'])) {
            $airports = \App\Models\Airport::where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('iata_code', 'LIKE', "%{$query}%")
                  ->orWhere('city_name', 'LIKE', "%{$query}%");
            })
            ->where('is_active', true)
            ->limit(10)
            ->get(['id', 'name', 'iata_code', 'city_name', 'country_code'])
            ->map(function ($airport) {
                return [
                    'type' => 'airport',
                    'id' => $airport->id,
                    'name' => $airport->name,
                    'code' => $airport->iata_code,
                    'city' => $airport->city_name,
                    'country' => $airport->country_code,
                ];
            });
            $suggestions = array_merge($suggestions, $airports->toArray());
        }

        if (in_array($type, ['all', 'hotels'])) {
            $hotels = \App\Models\Hotel::where('name', 'LIKE', "%{$query}%")
                ->where('is_active', true)
                ->where('is_demo', true)
                ->limit(5)
                ->get(['id', 'name', 'city_id'])
                ->map(function ($hotel) {
                    return [
                        'type' => 'hotel',
                        'id' => $hotel->id,
                        'name' => $hotel->name,
                        'city' => $hotel->city->name ?? '',
                    ];
                });
            $suggestions = array_merge($suggestions, $hotels->toArray());
        }

        return $suggestions;
    }

    public function getPopularDestinations(string $type = 'hotels', int $limit = 10): array
    {
        return match ($type) {
            'hotels' => \App\Models\City::whereHas('hotels', function ($q) {
                $q->where('is_active', true)->where('is_demo', true);
            })
            ->withCount(['hotels' => function ($q) {
                $q->where('is_active', true)->where('is_demo', true);
            }])
            ->orderByDesc('hotels_count')
            ->limit($limit)
            ->get(['id', 'name', 'country_id', 'hotels_count'])
            ->map(function ($city) {
                return [
                    'id' => $city->id,
                    'name' => $city->name,
                    'country' => $city->country->name ?? '',
                    'hotel_count' => $city->hotels_count,
                ];
            })->toArray(),
            
            'flights' => \App\Models\Airport::whereHas('departureFlights', function ($q) {
                $q->where('is_active', true)->where('is_demo', true);
            })
            ->withCount(['departureFlights' => function ($q) {
                $q->where('is_active', true)->where('is_demo', true);
            }])
            ->orderByDesc('departure_flights_count')
            ->limit($limit)
            ->get(['id', 'name', 'iata_code', 'city_name', 'country_code', 'departure_flights_count'])
            ->map(function ($airport) {
                return [
                    'id' => $airport->id,
                    'name' => $airport->city_name,
                    'code' => $airport->iata_code,
                    'country' => $airport->country_code,
                    'flight_count' => $airport->departure_flights_count,
                ];
            })->toArray(),
            
            default => [],
        };
    }
}