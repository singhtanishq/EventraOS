<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Search\SearchService;
use App\Services\Providers\ProviderManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class SearchController extends Controller
{
    protected SearchService $searchService;
    protected ProviderManager $providerManager;

    public function __construct(SearchService $searchService, ProviderManager $providerManager)
    {
        $this->searchService = $searchService;
        $this->providerManager = $providerManager;
    }

    public function searchHotels(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination' => 'sometimes|string',
            'city_id' => 'sometimes|integer|exists:cities,id',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'rooms' => 'sometimes|integer|min:1|max:10',
            'adults' => 'sometimes|integer|min:1|max:20',
            'children' => 'sometimes|integer|min:0|max:10',
            'star_rating' => 'sometimes|integer|min:1|max:5',
            'price_min' => 'sometimes|numeric|min:0',
            'price_max' => 'sometimes|numeric|min:0',
            'amenities' => 'sometimes|array',
            'amenities.*' => 'string',
            'sort' => 'sometimes|in:recommended,price_low,price_high,rating,distance',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $criteria = $validator->validated();
        $criteria['guests'] = [
            'adults' => $criteria['adults'] ?? 2,
            'children' => $criteria['children'] ?? 0,
        ];

        $results = $this->searchService->searchHotels($criteria);

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchFlights(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'origin_airport_id' => 'sometimes|integer|exists:airports,id',
            'destination_airport_id' => 'sometimes|integer|exists:airports,id',
            'origin' => 'sometimes|string',
            'destination' => 'sometimes|string',
            'departure_date' => 'required|date|after_or_equal:today',
            'return_date' => 'sometimes|date|after:departure_date',
            'adults' => 'sometimes|integer|min:1|max:9',
            'children' => 'sometimes|integer|min:0|max:8',
            'infants' => 'sometimes|integer|min:0|max:8',
            'cabin_class' => 'sometimes|in:economy,premium_economy,business,first',
            'stops' => 'sometimes|integer|min:0|max:3',
            'airline_ids' => 'sometimes|array',
            'airline_ids.*' => 'integer|exists:airlines,id',
            'price_min' => 'sometimes|numeric|min:0',
            'price_max' => 'sometimes|numeric|min:0',
            'sort' => 'sometimes|in:recommended,cheapest,fastest,earliest,latest',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $criteria = $validator->validated();
        
        // Resolve airport IDs from codes if provided
        if (!empty($criteria['origin']) && empty($criteria['origin_airport_id'])) {
            $airport = \App\Models\Airport::where('iata_code', $criteria['origin'])
                ->orWhere('name', 'LIKE', "%{$criteria['origin']}%")
                ->first();
            if ($airport) $criteria['origin_airport_id'] = $airport->id;
        }
        
        if (!empty($criteria['destination']) && empty($criteria['destination_airport_id'])) {
            $airport = \App\Models\Airport::where('iata_code', $criteria['destination'])
                ->orWhere('name', 'LIKE', "%{$criteria['destination']}%")
                ->first();
            if ($airport) $criteria['destination_airport_id'] = $airport->id;
        }

        $results = $this->searchService->searchFlights($criteria);

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchTrains(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'origin_station_id' => 'sometimes|integer|exists:stations,id',
            'destination_station_id' => 'sometimes|integer|exists:stations,id',
            'journey_date' => 'required|date|after_or_equal:today',
            'passengers' => 'sometimes|integer|min:1|max:10',
            'class' => 'sometimes|string',
            'quota' => 'sometimes|string',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $results = $this->searchService->searchTrains($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchBuses(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'origin_terminal_id' => 'sometimes|integer|exists:bus_terminals,id',
            'destination_terminal_id' => 'sometimes|integer|exists:bus_terminals,id',
            'journey_date' => 'required|date|after_or_equal:today',
            'passengers' => 'sometimes|integer|min:1|max:10',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $results = $this->searchService->searchBuses($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchVenues(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'city_id' => 'sometimes|integer|exists:cities,id',
            'city' => 'sometimes|string',
            'event_type' => 'sometimes|string',
            'event_date' => 'required|date|after_or_equal:today',
            'guest_count' => 'sometimes|integer|min:1|max:5000',
            'duration_hours' => 'sometimes|integer|min:1|max:24',
            'venue_type' => 'sometimes|string',
            'price_min' => 'sometimes|numeric|min:0',
            'price_max' => 'sometimes|numeric|min:0',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $results = $this->searchService->searchVenues($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchCars(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'city_id' => 'sometimes|integer|exists:cities,id',
            'pickup_date' => 'required|date|after_or_equal:today',
            'pickup_time' => 'sometimes|date_format:H:i',
            'return_date' => 'required|date|after:pickup_date',
            'return_time' => 'sometimes|date_format:H:i',
            'category_id' => 'sometimes|integer|exists:car_categories,id',
            'passengers' => 'sometimes|integer|min:1|max:20',
            'transmission' => 'sometimes|in:manual,automatic',
            'fuel_type' => 'sometimes|in:petrol,diesel,electric,hybrid',
            'with_driver' => 'sometimes|boolean',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $results = $this->searchService->searchCars($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchActivities(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'city_id' => 'sometimes|integer|exists:cities,id',
            'category_id' => 'sometimes|integer|exists:activity_categories,id',
            'date' => 'sometimes|date|after_or_equal:today',
            'participants' => 'sometimes|integer|min:1|max:50',
            'duration_min' => 'sometimes|integer|min:0',
            'duration_max' => 'sometimes|integer|min:0',
            'price_min' => 'sometimes|numeric|min:0',
            'price_max' => 'sometimes|numeric|min:0',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $results = $this->searchService->searchActivities($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchTransfers(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pickup_location_id' => 'sometimes|integer|exists:airports,id',
            'dropoff_location_id' => 'sometimes|integer|exists:airports,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'sometimes|date_format:H:i',
            'passengers' => 'sometimes|integer|min:1|max:50',
            'luggage' => 'sometimes|integer|min:0|max:20',
            'vehicle_type_id' => 'sometimes|integer|exists:transfer_vehicle_types,id',
            'transfer_type' => 'sometimes|in:airport_to_hotel,hotel_to_airport,point_to_point,hourly,city_tour',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $results = $this->searchService->searchTransfers($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function searchPackages(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination_ids' => 'sometimes|array',
            'destination_ids.*' => 'integer|exists:cities,id',
            'start_date' => 'sometimes|date|after_or_equal:today',
            'end_date' => 'sometimes|date|after:start_date',
            'duration_min' => 'sometimes|integer|min:1',
            'duration_max' => 'sometimes|integer|min:1',
            'participants' => 'sometimes|integer|min:1|max:20',
            'price_min' => 'sometimes|numeric|min:0',
            'price_max' => 'sometimes|numeric|min:0',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $results = $this->searchService->searchPackages($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $results->toArray(),
        ]);
    }

    public function getSuggestions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:2|max:100',
            'type' => 'sometimes|in:all,cities,airports,hotels',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $suggestions = $this->searchService->getSearchSuggestions(
            $request->q,
            $request->type ?? 'all'
        );

        return response()->json([
            'success' => true,
            'data' => $suggestions,
        ]);
    }

    public function getPopularDestinations(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:hotels,flights',
            'limit' => 'sometimes|integer|min:1|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $destinations = $this->searchService->getPopularDestinations(
            $request->type ?? 'hotels',
            $request->limit ?? 10
        );

        return response()->json([
            'success' => true,
            'data' => $destinations,
        ]);
    }

    public function getHotelDetails(Request $request, $hotelId)
    {
        $details = $this->searchService->getHotelDetails($hotelId, $request->all());

        if (!$details) {
            return response()->json([
                'success' => false,
                'message' => 'Hotel not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $details->toArray(),
        ]);
    }

    public function getFlightDetails(Request $request, $flightId)
    {
        $details = $this->searchService->getFlightDetails($flightId, $request->all());

        if (!$details) {
            return response()->json([
                'success' => false,
                'message' => 'Flight not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $details->toArray(),
        ]);
    }

    public function getVenueDetails(Request $request, $venueId)
    {
        $details = $this->searchService->getVenueDetails($venueId, $request->all());

        if (!$details) {
            return response()->json([
                'success' => false,
                'message' => 'Venue not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $details->toArray(),
        ]);
    }

    public function checkHotelAvailability(Request $request, $hotelId)
    {
        $validator = Validator::make(array_merge($request->all(), ['hotel_id' => $hotelId]), [
            'hotel_id' => 'required|string',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'room_type_id' => 'sometimes|string',
            'rooms' => 'sometimes|integer|min:1|max:10',
            'adults' => 'sometimes|integer|min:1|max:20',
            'children' => 'sometimes|integer|min:0|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $availability = $this->searchService->checkHotelAvailability($hotelId, $validator->validated());

        return response()->json([
            'success' => true,
            'data' => $availability->toArray(),
        ]);
    }

    public function checkFlightAvailability(Request $request, $flightId)
    {
        $validator = Validator::make(array_merge($request->all(), ['flight_id' => $flightId]), [
            'flight_id' => 'required|string',
            'fare_id' => 'sometimes|string',
            'adults' => 'sometimes|integer|min:1|max:9',
            'children' => 'sometimes|integer|min:0|max:8',
            'infants' => 'sometimes|integer|min:0|max:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $availability = $this->searchService->checkFlightAvailability($flightId, $validator->validated());

        return response()->json([
            'success' => true,
            'data' => $availability->toArray(),
        ]);
    }

    public function clearCache(Request $request)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $this->searchService->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Search cache cleared successfully',
        ]);
    }
}