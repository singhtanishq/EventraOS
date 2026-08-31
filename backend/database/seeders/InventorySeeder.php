<?php

namespace Database\Seeders;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\BusOperator;
use App\Models\BusRoute;
use App\Models\BusTerminal;
use App\Models\BusType;
use App\Models\BusFare;
use App\Models\BusInventory;
use App\Models\CarCategory;
use App\Models\CarRentalCompany;
use App\Models\Car;
use App\Models\CarRate;
use App\Models\CarInventory;
use App\Models\Activity;
use App\Models\ActivityCategory;
use App\Models\ActivityPricing;
use App\Models\Flight;
use App\Models\FlightFare;
use App\Models\FlightInventory;
use App\Models\Hotel;
use App\Models\HotelRoomType;
use App\Models\HotelRate;
use App\Models\HotelInventory;
use App\Models\Station;
use App\Models\TrainOperator;
use App\Models\TrainRoute;
use App\Models\TrainClass;
use App\Models\TrainFare;
use App\Models\TrainInventory;
use App\Models\Transfer;
use App\Models\TransferOperator;
use App\Models\TransferPricing;
use App\Models\TransferVehicleType;
use App\Models\Venue;
use App\Models\VenuePackage;
use App\Models\VenueAddon;
use App\Models\VenueAvailability;
use App\Models\TransferInventory;
use App\Models\Provider;
use App\Models\TravelPackage;
use App\Models\PackagePricing;
use App\Models\PackageInventory;
use App\Models\PackageItem;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InventorySeeder extends Seeder
{
    private Provider $demoProvider;
    private array $cityIds = [];

    public function run(): void
    {
        $types = ['hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer', 'package'];
        foreach ($types as $type) {
            Provider::create([
                'name' => "EventraOS Demo {$type}",
                'code' => "demo_{$type}",
                'type' => $type,
                'mode' => 'demo',
                'status' => 'active',
                'is_default' => true,
                'priority' => 100,
            ]);
        }
        $this->demoProvider = Provider::where('type', 'hotel')->where('mode', 'demo')->first();

        $this->cityIds = \App\Models\City::pluck('id', 'name')->toArray();

        $this->seedHotels();
        $this->seedAirlinesAndFlights();
        $this->seedTrains();
        $this->seedBuses();
        $this->seedVenues();
        $this->seedCars();
        $this->seedActivities();
        $this->seedTransfers();
        $this->seedPackages();
    }

    private function seedHotels(): void
    {
        $hotels = [
            ['name' => 'Burj Al Arabia Grand', 'city' => 'Dubai', 'stars' => 5, 'price' => 45000, 'rating' => 4.9, 'amenities' => ['Private Beach', 'Infinity Pool', 'Spa', 'Michelin Restaurant', 'Helipad', 'Butler Service'], 'description' => 'The world\'s most iconic luxury hotel, offering unparalleled views of the Arabian Gulf with world-class dining and amenities.'],
            ['name' => 'Atlantis The Palm', 'city' => 'Dubai', 'stars' => 5, 'price' => 28000, 'rating' => 4.7, 'amenities' => ['Aquaventure Waterpark', 'Dolphin Bay', 'Beach Access', 'Fine Dining', 'Kids Club'], 'description' => 'Ocean-themed resort on Palm Jumeirah with underwater suites and award-winning waterpark.'],
            ['name' => 'Marina Bay Sands View Hotel', 'city' => 'Singapore', 'stars' => 5, 'price' => 32000, 'rating' => 4.8, 'amenities' => ['Rooftop Infinity Pool', 'SkyPark', 'Casino', 'Celebrity Chef Restaurants'], 'description' => 'Iconic integrated resort with infinity pool overlooking the Singapore skyline.'],
            ['name' => 'The Leela Palace', 'city' => 'Delhi', 'stars' => 5, 'price' => 18000, 'rating' => 4.6, 'amenities' => ['Royal Spa', 'Fine Dining', 'Outdoor Pool', 'Fitness Center', 'Business Center'], 'description' => 'Epitome of luxury in the heart of Delhi, blending Indian heritage with modern opulence.'],
            ['name' => 'Taj Lake Palace', 'city' => 'Mumbai', 'stars' => 5, 'price' => 22000, 'rating' => 4.7, 'amenities' => ['Lake View', 'Royal Spa', 'Heritage Dining', 'Private Boat'], 'description' => 'Floating palace hotel offering majestic lake views and royal hospitality.'],
            ['name' => 'Rambagh Palace Heritage', 'city' => 'Jaipur', 'stars' => 5, 'price' => 25000, 'rating' => 4.8, 'amenities' => ['Heritage Suites', 'Polo Bar', 'Royal Gardens', 'Spa by ESPA'], 'description' => 'Former royal residence turned luxury hotel, showcasing Rajasthani grandeur.'],
            ['name' => 'Taj Exotica Resort & Spa', 'city' => 'Goa', 'stars' => 5, 'price' => 15000, 'rating' => 4.5, 'amenities' => ['Beachfront', 'Ayurvedic Spa', 'Water Sports', 'Multiple Restaurants'], 'description' => 'Beachfront paradise in South Goa with lush gardens and pristine beaches.'],
            ['name' => 'The Sarojin Boutique', 'city' => 'Bangkok', 'stars' => 4, 'price' => 8500, 'rating' => 4.4, 'amenities' => ['Boutique Style', 'Rooftop Bar', 'Thai Cooking Classes', 'Spa'], 'description' => 'Intimate boutique hotel in the heart of Bangkok with Thai-inspired design.'],
            ['name' => 'The Savoy London', 'city' => 'London', 'stars' => 5, 'price' => 42000, 'rating' => 4.7, 'amenities' => ['River Views', 'Afternoon Tea', 'Theatre District', 'Fine Dining'], 'description' => 'Legendary London hotel on the Strand, home to British elegance since 1889.'],
            ['name' => 'The Plaza New York', 'city' => 'New York', 'stars' => 5, 'price' => 48000, 'rating' => 4.6, 'amenities' => ['Central Park View', 'Champagne Bar', 'The Plaza Spa', 'Afternoon Tea'], 'description' => 'Iconic Fifth Avenue hotel offering timeless luxury opposite Central Park.'],
            ['name' => 'Comfort Inn Delhi Airport', 'city' => 'Delhi', 'stars' => 3, 'price' => 3500, 'rating' => 4.0, 'amenities' => ['Airport Shuttle', 'Free WiFi', 'Breakfast Included', '24h Reception'], 'description' => 'Convenient and comfortable budget hotel near the airport.'],
            ['name' => 'Goa Beach Backpackers', 'city' => 'Goa', 'stars' => 2, 'price' => 1200, 'rating' => 3.8, 'amenities' => ['Shared Kitchen', 'Free WiFi', 'Beach Access', 'Common Area'], 'description' => 'Budget-friendly backpacker hostel steps from the beach.'],
        ];

        $roomTypes = [
            ['name' => 'Deluxe Room', 'adult_capacity' => 2, 'max_occupancy' => 3, 'multiplier' => 1.0, 'size_sqm' => 35],
            ['name' => 'Executive Suite', 'adult_capacity' => 2, 'max_occupancy' => 4, 'multiplier' => 1.8, 'size_sqm' => 60],
            ['name' => 'Presidential Suite', 'adult_capacity' => 4, 'max_occupancy' => 6, 'multiplier' => 4.0, 'size_sqm' => 120],
        ];

        foreach ($hotels as $hotelData) {
            $hotel = Hotel::create([
                'provider_id' => $this->demoProvider->id,
                'name' => $hotelData['name'],
                'slug' => Str::slug($hotelData['name']) . '-' . Str::random(4),
                'description' => $hotelData['description'],
                'city_id' => $this->cityIds[$hotelData['city']],
                'address' => Str::random(10) . ' Street, ' . $hotelData['city'],
                'latitude' => rand(1000000, 55000000) / 1000000,
                'longitude' => rand(1000000, 55000000) / 1000000,
                'star_rating' => $hotelData['stars'],
                'property_type' => $hotelData['stars'] >= 5 ? 'hotel' : ($hotelData['stars'] >= 3 ? 'hotel' : 'hostel'),
                'amenities' => $hotelData['amenities'],
                'check_in_out' => ['check_in' => '14:00', 'check_out' => '11:00'],
                'images' => ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
                'policies' => ['children' => 'Children under 12 stay free', 'pets' => 'Not allowed'],
                'rating' => $hotelData['rating'],
                'review_count' => rand(50, 500),
                'is_active' => true,
                'is_featured' => $hotelData['stars'] === 5,
                'is_demo' => true,
            ]);

            foreach ($roomTypes as $rtData) {
                $roomType = HotelRoomType::create([
                    'hotel_id' => $hotel->id,
                    'provider_id' => $this->demoProvider->id,
                    'name' => $rtData['name'],
                    'slug' => Str::slug($rtData['name']),
                    'description' => "Elegant {$rtData['name']} with premium amenities.",
                    'max_occupancy' => $rtData['max_occupancy'],
                    'adult_capacity' => $rtData['adult_capacity'],
                    'bed_configuration' => [['type' => 'king_bed', 'count' => 1]],
                    'amenities' => ['Air Conditioning', 'Free WiFi', 'Minibar', 'LED TV', 'Room Service'],
                    'size_sqm' => $rtData['size_sqm'],
                    'is_active' => true,
                ]);

                $rate = HotelRate::create([
                    'hotel_id' => $hotel->id,
                    'room_type_id' => $roomType->id,
                    'provider_id' => $this->demoProvider->id,
                    'name' => 'Standard Rate',
                    'meal_plan' => $hotelData['stars'] >= 4 ? 'bed_breakfast' : 'room_only',
                    'cancellation_policy' => ['free_cancellation' => true, 'free_cancellation_hours' => 48, 'rules' => [['hours_before' => 48, 'refund_percent' => 100], ['hours_before' => 24, 'refund_percent' => 50], ['hours_before' => 0, 'refund_percent' => 0]]],
                    'cancellation_policy_text' => 'Free cancellation until 48 hours before check-in',
                    'is_refundable' => true,
                    'is_active' => true,
                ]);

                // Create inventory for next 90 days
                $basePrice = $hotelData['price'] * $rtData['multiplier'];
                $dates = collect(range(0, 90))->map(fn ($i) => Carbon::today()->addDays($i));
                $inventoryData = $dates->map(fn ($date) => [
                    'hotel_id' => $hotel->id,
                    'room_type_id' => $roomType->id,
                    'rate_id' => $rate->id,
                    'date' => $date->toDateString(),
                    'total_rooms' => 5,
                    'available_rooms' => rand(2, 5),
                    'base_price' => $basePrice,
                    'sell_price' => $basePrice,
                    'currency' => 'INR',
                    'tax_amount' => round($basePrice * 0.18, 2),
                ])->toArray();

                foreach (array_chunk($inventoryData, 100) as $chunk) {
                    foreach ($chunk as $inv) {
                        HotelInventory::create($inv);
                    }
                }
            }
        }
    }

    private function seedAirlinesAndFlights(): void
    {
        $airlines = [
            ['name' => 'Air India', 'code' => 'AI', 'icao' => 'AIC', 'low_cost' => false],
            ['name' => 'Emirates', 'code' => 'EK', 'icao' => 'UAE', 'low_cost' => false],
            ['name' => 'Singapore Airlines', 'code' => 'SQ', 'icao' => 'SIA', 'low_cost' => false],
            ['name' => 'IndiGo', 'code' => '6E', 'icao' => 'IGO', 'low_cost' => true],
            ['name' => 'Thai Airways', 'code' => 'TG', 'icao' => 'THA', 'low_cost' => false],
        ];

        $airlineMap = [];
        foreach ($airlines as $data) {
            $airlineMap[$data['code']] = Airline::create([
                'name' => $data['name'],
                'code' => $data['code'],
                'icao_code' => $data['icao'],
                'is_active' => true,
                'is_low_cost' => $data['low_cost'],
                'is_demo' => true,
            ]);
        }

        $routes = [
            ['from' => 'DEL', 'to' => 'DXB', 'duration' => 225, 'airline' => 'EK', 'base_price' => 18500],
            ['from' => 'BOM', 'to' => 'DXB', 'duration' => 195, 'airline' => 'EK', 'base_price' => 16500],
            ['from' => 'DEL', 'to' => 'SIN', 'duration' => 330, 'airline' => 'SQ', 'base_price' => 22000],
            ['from' => 'BOM', 'to' => 'BKK', 'duration' => 270, 'airline' => 'TG', 'base_price' => 15000],
            ['from' => 'DEL', 'to' => 'BOM', 'duration' => 140, 'airline' => '6E', 'base_price' => 4500],
            ['from' => 'DEL', 'to' => 'GOI', 'duration' => 130, 'airline' => '6E', 'base_price' => 3800],
            ['from' => 'BOM', 'to' => 'DEL', 'duration' => 140, 'airline' => 'AI', 'base_price' => 5200],
            ['from' => 'DEL', 'to' => 'LHR', 'duration' => 510, 'airline' => 'AI', 'base_price' => 45000],
            ['from' => 'BOM', 'to' => 'JFK', 'duration' => 900, 'airline' => 'AI', 'base_price' => 68000],
        ];

        $airports = Airport::pluck('id', 'iata_code')->toArray();
        $cabinClasses = ['economy', 'premium_economy', 'business'];

        foreach ($routes as $route) {
            for ($dayOffset = 0; $dayOffset <= 30; $dayOffset++) {
                $departureDate = Carbon::today()->addDays($dayOffset);
                $airline = $airlineMap[$route['airline']];

                $flight = Flight::create([
                    'provider_id' => $this->demoProvider->id,
                    'airline_id' => $airline->id,
                    'flight_number' => $route['airline'] . rand(100, 999),
                    'departure_airport_id' => $airports[$route['from']],
                    'arrival_airport_id' => $airports[$route['to']],
                    'departure_date' => $departureDate->toDateString(),
                    'departure_time' => sprintf('%02d:%02d', rand(6, 22), rand(0, 5) * 10),
                    'arrival_date' => $departureDate->toDateString(),
                    'arrival_time' => sprintf('%02d:%02d', rand(6, 23), rand(0, 5) * 10),
                    'departure_timezone' => 'Asia/Kolkata',
                    'arrival_timezone' => 'Asia/Dubai',
                    'duration_minutes' => $route['duration'],
                    'aircraft_name' => 'Boeing 777-300ER',
                    'aircraft_code' => 'B77W',
                    'stops' => 0,
                    'is_active' => true,
                    'is_demo' => true,
                ]);

                foreach ($cabinClasses as $cabin) {
                    $multiplier = $cabin === 'economy' ? 1 : ($cabin === 'premium_economy' ? 1.6 : 3.2);
                    $price = $route['base_price'] * $multiplier;

                    $fare = FlightFare::create([
                        'flight_id' => $flight->id,
                        'provider_id' => $this->demoProvider->id,
                        'name' => ucfirst(str_replace('_', ' ', $cabin)) . ' Saver',
                        'code' => strtoupper(substr($cabin, 0, 2)) . 'SAVER',
                        'cabin_class' => $cabin,
                        'baggage_allowance' => ['cabin' => '1x7kg', 'checked' => $cabin === 'economy' ? '1x23kg' : '2x23kg'],
                        'is_refundable' => $cabin !== 'economy',
                        'is_changeable' => $cabin !== 'economy',
                        'change_fee' => $cabin === 'economy' ? 3000 : 1500,
                        'cancel_fee' => $cabin === 'economy' ? 4000 : 2000,
                        'is_active' => true,
                    ]);

                    FlightInventory::create([
                        'flight_id' => $flight->id,
                        'fare_id' => $fare->id,
                        'date' => $departureDate->toDateString(),
                        'total_seats' => 40,
                        'available_seats' => rand(5, 40),
                        'base_price' => $price,
                        'sell_price' => $price,
                        'currency' => 'INR',
                        'tax_amount' => round($price * 0.05, 2),
                        'is_closed' => false,
                    ]);
                }
            }
        }
    }

    private function seedTrains(): void
    {
        $operator = TrainOperator::create(['name' => 'Indian Railways (Demo)', 'code' => 'IR-DEMO', 'country_code' => 'IN', 'is_active' => true, 'is_demo' => true]);
        $stations = Station::pluck('id', 'code')->toArray();

        $routes = [
            ['number' => '12951', 'name' => 'Mumbai Rajdhani Express', 'from' => 'NDLS', 'to' => 'BCT', 'duration' => 960, 'type' => 'rajdhani'],
            ['number' => '12958', 'name' => 'Swarna Jayanti Rajdhani', 'from' => 'BCT', 'to' => 'NDLS', 'duration' => 960, 'type' => 'rajdhani'],
            ['number' => '12015', 'name' => 'Ajmer Shatabdi Express', 'from' => 'NDLS', 'to' => 'JP', 'duration' => 270, 'type' => 'shatabdi'],
        ];

        $classes = [
            ['name' => '1AC', 'code' => '1A', 'capacity' => 24, 'is_ac' => true, 'multiplier' => 3.5],
            ['name' => '2AC', 'code' => '2A', 'capacity' => 46, 'is_ac' => true, 'multiplier' => 2.0],
            ['name' => '3AC', 'code' => '3A', 'capacity' => 64, 'is_ac' => true, 'multiplier' => 1.3],
            ['name' => 'Sleeper', 'code' => 'SL', 'capacity' => 72, 'is_ac' => false, 'multiplier' => 1.0],
        ];

        foreach ($routes as $routeData) {
            $trainRoute = TrainRoute::create([
                'provider_id' => $this->demoProvider->id,
                'operator_id' => $operator->id,
                'train_number' => $routeData['number'],
                'train_name' => $routeData['name'],
                'origin_station_id' => $stations[$routeData['from']],
                'destination_station_id' => $stations[$routeData['to']],
                'departure_time' => '16:30',
                'arrival_time' => Carbon::today()->addMinutes($routeData['duration'])->format('H:i'),
                'duration_minutes' => $routeData['duration'],
                'running_days' => [1, 2, 3, 4, 5, 6, 7],
                'train_type' => $routeData['type'],
                'is_active' => true,
                'is_demo' => true,
            ]);

            foreach ($classes as $classData) {
                $class = TrainClass::create([
                    'train_route_id' => $trainRoute->id,
                    'provider_id' => $this->demoProvider->id,
                    'name' => $classData['name'],
                    'code' => $classData['code'],
                    'capacity' => $classData['capacity'],
                    'has_berth' => true,
                    'is_ac' => $classData['is_ac'],
                    'is_active' => true,
                ]);

                $baseFare = 800 * $classData['multiplier'];
                $fare = TrainFare::create([
                    'train_route_id' => $trainRoute->id,
                    'class_id' => $class->id,
                    'provider_id' => $this->demoProvider->id,
                    'quota' => 'GN',
                    'base_fare' => $baseFare,
                    'tax_amount' => round($baseFare * 0.05, 2),
                    'currency' => 'INR',
                    'is_active' => true,
                ]);

                for ($i = 0; $i <= 30; $i++) {
                    TrainInventory::create([
                        'train_route_id' => $trainRoute->id,
                        'class_id' => $class->id,
                        'fare_id' => $fare->id,
                        'journey_date' => Carbon::today()->addDays($i)->toDateString(),
                        'total_berths' => $classData['capacity'],
                        'available_berths' => rand(3, $classData['capacity']),
                        'current_fare' => $baseFare,
                        'is_closed' => false,
                    ]);
                }
            }
        }
    }

    private function seedBuses(): void
    {
        $operator = BusOperator::create(['name' => 'Demo Travels', 'code' => 'DEMO-BUS', 'is_active' => true, 'is_demo' => true]);
        $terminals = BusTerminal::pluck('id')->toArray();

        if (count($terminals) < 2) return;

        $busTypes = [
            ['name' => 'Volvo Multi-Axle AC Sleeper', 'layout' => '2x1', 'berth_type' => 'sleeper', 'is_ac' => true, 'total_seats' => 36, 'multiplier' => 1.5],
            ['name' => 'Mercedes-Benz AC Seater', 'layout' => '2x2', 'berth_type' => 'seater', 'is_ac' => true, 'total_seats' => 44, 'multiplier' => 1.2],
            ['name' => 'Non-AC Sleeper', 'layout' => '2x1', 'berth_type' => 'sleeper', 'is_ac' => false, 'total_seats' => 36, 'multiplier' => 0.8],
        ];

        for ($i = 0; $i < min(3, count($terminals)); $i++) {
            $from = $terminals[$i];
            $to = $terminals[($i + 1) % count($terminals)];

            $route = BusRoute::create([
                'provider_id' => $this->demoProvider->id,
                'operator_id' => $operator->id,
                'origin_terminal_id' => $from,
                'destination_terminal_id' => $to,
                'route_name' => 'Express Route ' . ($i + 1),
                'departure_time' => sprintf('%02d:00', 21 + $i),
                'arrival_time' => '06:30',
                'duration_minutes' => 570,
                'boarding_points' => [['name' => 'Main Terminal', 'time' => '20:45', 'address' => 'Main Terminal, Gate 1']],
                'dropping_points' => [['name' => 'City Center', 'time' => '06:30', 'address' => 'City Center Bus Stop']],
                'running_days' => [1, 2, 3, 4, 5, 6, 7],
                'is_active' => true,
                'is_demo' => true,
            ]);

            foreach ($busTypes as $typeData) {
                $busType = BusType::create([
                    'bus_route_id' => $route->id,
                    'provider_id' => $this->demoProvider->id,
                    'name' => $typeData['name'],
                    'code' => strtoupper(Str::random(6)),
                    'layout' => $typeData['layout'],
                    'berth_type' => $typeData['berth_type'],
                    'is_ac' => $typeData['is_ac'],
                    'total_seats' => $typeData['total_seats'],
                    'amenities' => ['Charging Point', 'Blanket', 'Water Bottle', 'WiFi'],
                    'is_active' => true,
                ]);

                $baseFare = 450 * $typeData['multiplier'];
                $fare = BusFare::create([
                    'bus_route_id' => $route->id,
                    'bus_type_id' => $busType->id,
                    'provider_id' => $this->demoProvider->id,
                    'base_fare' => $baseFare,
                    'currency' => 'INR',
                    'is_active' => true,
                ]);

                for ($d = 0; $d <= 30; $d++) {
                    BusInventory::create([
                        'bus_route_id' => $route->id,
                        'bus_type_id' => $busType->id,
                        'fare_id' => $fare->id,
                        'journey_date' => Carbon::today()->addDays($d)->toDateString(),
                        'total_seats' => $typeData['total_seats'],
                        'available_seats' => rand(5, $typeData['total_seats']),
                        'current_fare' => $baseFare,
                        'is_cancelled' => false,
                    ]);
                }
            }
        }
    }

    private function seedVenues(): void
    {
        $venues = [
            ['name' => 'The Grand Wedding Palace', 'city' => 'Lucknow', 'capacity' => 800, 'types' => ['wedding', 'reception', 'party'], 'price_per_guest' => 2500, 'description' => 'Majestic wedding venue with royal architecture, expansive lawns, and luxurious banquet halls. Perfect for grand celebrations.'],
            ['name' => 'Dubai International Convention Centre', 'city' => 'Dubai', 'capacity' => 1500, 'types' => ['conference', 'corporate_event', 'exhibition'], 'price_per_guest' => 1500, 'description' => 'State-of-the-art convention facility with modular halls, AV systems, and professional event support.'],
            ['name' => 'Taj Falaknuma Heritage Hall', 'city' => 'Jaipur', 'capacity' => 500, 'types' => ['wedding', 'conference', 'corporate_event'], 'price_per_guest' => 3500, 'description' => 'Heritage palace venue offering regal ambiance for weddings and corporate gatherings.'],
            ['name' => 'Skyline Rooftop Events', 'city' => 'Mumbai', 'capacity' => 200, 'types' => ['party', 'birthday', 'corporate_event'], 'price_per_guest' => 1800, 'description' => 'Chic rooftop venue with panoramic city views, perfect for intimate celebrations.'],
            ['name' => 'Goa Beachfront Event Lawn', 'city' => 'Goa', 'capacity' => 400, 'types' => ['wedding', 'party', 'concert'], 'price_per_guest' => 2000, 'description' => 'Beachfront event space with sunset views, ideal for destination weddings and beach parties.'],
            ['name' => 'Corporate Hub Singapore', 'city' => 'Singapore', 'capacity' => 300, 'types' => ['conference', 'seminar', 'workshop', 'meeting'], 'price_per_guest' => 1200, 'description' => 'Modern business venue equipped with latest AV technology and flexible room configurations.'],
        ];

        $packages = [
            ['name' => 'Basic', 'type' => 'basic', 'multiplier' => 0.6, 'includes' => ['Venue Access', 'Basic Seating', 'Lighting', 'Security']],
            ['name' => 'Standard', 'type' => 'standard', 'multiplier' => 1.0, 'includes' => ['Venue Access', 'Premium Seating', 'Basic Decoration', 'Lighting & Sound', 'Parking', 'Security']],
            ['name' => 'Premium', 'type' => 'premium', 'multiplier' => 1.8, 'includes' => ['Venue Access', 'Premium Seating', 'Floral Decoration', 'AV Equipment', 'Stage Setup', 'Buffet Catering', 'Welcome Drinks', 'Valet Parking', 'Dedicated Event Manager']],
        ];

        $addons = [
            ['name' => 'Professional Photographer', 'category' => 'photography', 'pricing_type' => 'fixed', 'price' => 25000],
            ['name' => 'Videography Team', 'category' => 'videography', 'pricing_type' => 'fixed', 'price' => 35000],
            ['name' => 'DJ & Sound System', 'category' => 'entertainment', 'pricing_type' => 'per_hour', 'price' => 15000],
            ['name' => 'Floral Decoration Upgrade', 'category' => 'decor', 'pricing_type' => 'fixed', 'price' => 50000],
            ['name' => 'Buffet Catering (Multi-Cuisine)', 'category' => 'catering', 'pricing_type' => 'per_guest', 'price' => 1200],
            ['name' => 'Live Band', 'category' => 'entertainment', 'pricing_type' => 'per_hour', 'price' => 25000],
            ['name' => 'Valet Parking', 'category' => 'other', 'pricing_type' => 'per_guest', 'price' => 100],
            ['name' => 'Security Enhancement', 'category' => 'security', 'pricing_type' => 'fixed', 'price' => 8000],
        ];

        foreach ($venues as $venueData) {
            $venue = Venue::create([
                'provider_id' => $this->demoProvider->id,
                'name' => $venueData['name'],
                'slug' => Str::slug($venueData['name']) . '-' . Str::random(4),
                'description' => $venueData['description'],
                'city_id' => $this->cityIds[$venueData['city']],
                'address' => 'Event Street, ' . $venueData['city'],
                'latitude' => rand(1000000, 55000000) / 1000000,
                'longitude' => rand(1000000, 55000000) / 1000000,
                'total_capacity' => $venueData['capacity'],
                'capacity_breakdown' => ['theater' => $venueData['capacity'], 'banquet' => intval($venueData['capacity'] * 0.7), 'cocktail' => intval($venueData['capacity'] * 1.2)],
                'venue_types' => $venueData['types'],
                'has_indoor' => true,
                'has_outdoor' => true,
                'has_parking' => true,
                'parking_capacity' => intval($venueData['capacity'] / 3),
                'has_catering' => true,
                'has_av' => true,
                'has_stage' => true,
                'amenities' => ['Air Conditioning', 'WiFi', 'Stage', 'Green Room', 'Parking', 'Catering', 'AV Equipment'],
                'policies' => ['decoration' => 'External decoration allowed', 'vendor' => 'Approved vendors only', 'noise' => 'Music until 11 PM', 'alcohol' => 'Allowed with permit', 'catering' => 'In-house or approved caterers'],
                'allows_external_catering' => true,
                'allows_external_decor' => true,
                'allows_alcohol' => true,
                'images' => ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80'],
                'rating' => rand(40, 50) / 10,
                'review_count' => rand(10, 100),
                'is_active' => true,
                'is_featured' => true,
                'is_demo' => true,
            ]);

            foreach ($packages as $pkgData) {
                VenuePackage::create([
                    'venue_id' => $venue->id,
                    'provider_id' => $this->demoProvider->id,
                    'name' => $pkgData['name'],
                    'slug' => Str::slug($venueData['name'] . ' ' . $pkgData['name']),
                    'type' => $pkgData['type'],
                    'description' => "{$pkgData['name']} package for {$venueData['name']}.",
                    'includes' => $pkgData['includes'],
                    'price_per_guest' => intval($venueData['price_per_guest'] * $pkgData['multiplier']),
                    'min_guests' => 50,
                    'currency' => 'INR',
                    'is_active' => true,
                ]);
            }

            foreach ($addons as $addonData) {
                VenueAddon::create([
                    'venue_id' => $venue->id,
                    'provider_id' => $this->demoProvider->id,
                    'name' => $addonData['name'],
                    'slug' => Str::slug($venueData['name'] . ' ' . $addonData['name']),
                    'category' => $addonData['category'],
                    'description' => "{$addonData['name']} service for your event.",
                    'pricing_type' => $addonData['pricing_type'],
                    'price' => $addonData['price'],
                    'currency' => 'INR',
                    'is_active' => true,
                ]);
            }

            // Create VenueAvailability for this venue (next 180 days)
            $dates = collect(range(0, 180))->map(fn ($i) => Carbon::today()->addDays($i));
            foreach ($dates as $date) {
                // 80% chance of availability
                if (rand(1, 10) <= 8) {
                    VenueAvailability::create([
                        'venue_id' => $venue->id,
                        'date' => $date->toDateString(),
                        'status' => 'available',
                        'price_override' => null,
                    ]);
                }
            }
        }
    }

    private function seedCars(): void
    {
        $company = CarRentalCompany::create(['name' => 'EventraDrive Rentals', 'code' => 'EDR', 'is_active' => true, 'is_demo' => true]);

        $categories = [
            ['name' => 'Economy', 'code' => 'ECO', 'seats' => 5, 'doors' => 4, 'bags' => 2],
            ['name' => 'Compact', 'code' => 'CPT', 'seats' => 5, 'doors' => 4, 'bags' => 2],
            ['name' => 'Sedan', 'code' => 'SED', 'seats' => 5, 'doors' => 4, 'bags' => 3],
            ['name' => 'SUV', 'code' => 'SUV', 'seats' => 7, 'doors' => 5, 'bags' => 4],
            ['name' => 'Luxury', 'code' => 'LUX', 'seats' => 4, 'doors' => 4, 'bags' => 2],
        ];

        $categoryMap = [];
        foreach ($categories as $data) {
            $categoryMap[$data['code']] = CarCategory::create($data + ['is_ac' => true, 'transmission' => 'automatic', 'fuel_type' => 'petrol', 'is_active' => true]);
        }

        $cars = [
            ['name' => 'Maruti Swift', 'model' => 'Swift VXi', 'year' => '2024', 'category' => 'ECO', 'price' => 1800, 'transmission' => 'manual'],
            ['name' => 'Hyundai i20', 'model' => 'i20 Asta', 'year' => '2024', 'category' => 'CPT', 'price' => 2200, 'transmission' => 'automatic'],
            ['name' => 'Honda City', 'model' => 'City VX', 'year' => '2024', 'category' => 'SED', 'price' => 3200, 'transmission' => 'automatic'],
            ['name' => 'Toyota Innova Crysta', 'model' => 'Crysta ZX', 'year' => '2024', 'category' => 'SUV', 'price' => 4500, 'transmission' => 'automatic'],
            ['name' => 'Mercedes-Benz E-Class', 'model' => 'E200', 'year' => '2024', 'category' => 'LUX', 'price' => 12000, 'transmission' => 'automatic'],
        ];

        foreach ($cars as $carData) {
            $car = Car::create([
                'provider_id' => $this->demoProvider->id,
                'company_id' => $company->id,
                'category_id' => $categoryMap[$carData['category']]->id,
                'name' => $carData['name'],
                'model' => $carData['model'],
                'year' => $carData['year'],
                'seats' => $categoryMap[$carData['category']]->seats,
                'doors' => $categoryMap[$carData['category']]->doors,
                'transmission' => $carData['transmission'],
                'fuel_type' => 'petrol',
                'is_ac' => true,
                'features' => ['GPS Navigation', 'Bluetooth', 'USB Charging', 'Reverse Camera'],
                'images' => ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'],
                'is_active' => true,
                'is_demo' => true,
            ]);

            CarRate::create([
                'car_id' => $car->id,
                'provider_id' => $this->demoProvider->id,
                'name' => 'Daily Rate (Self Drive)',
                'rate_type' => 'daily',
                'base_rate' => $carData['price'],
                'km_included' => 200,
                'extra_km_rate' => 12,
                'deposit_amount' => 5000,
                'currency' => 'INR',
                'is_active' => true,
            ]);

            CarRate::create([
                'car_id' => $car->id,
                'provider_id' => $this->demoProvider->id,
                'name' => 'Daily Rate (With Driver)',
                'rate_type' => 'daily',
                'base_rate' => $carData['price'] + 1500,
                'km_included' => 150,
                'extra_km_rate' => 15,
                'driver_allowance' => 1500,
                'currency' => 'INR',
                'is_active' => true,
            ]);

            $dailyRateId = CarRate::where('car_id', $car->id)->where('rate_type', 'daily')->first()?->id;

            // Seed 45 days of availability per car
            foreach (range(0, 44) as $dayOffset) {
                CarInventory::create([
                    'car_id' => $car->id,
                    'rate_id' => $dailyRateId,
                    'date' => Carbon::today()->addDays($dayOffset)->toDateString(),
                    'status' => 'available',
                ]);
            }
        }
    }

    private function seedActivities(): void
    {
        $categories = [
            ['name' => 'Sightseeing', 'slug' => 'sightseeing'],
            ['name' => 'Adventure', 'slug' => 'adventure'],
            ['name' => 'Cultural', 'slug' => 'cultural'],
            ['name' => 'Food & Drink', 'slug' => 'food-drink'],
            ['name' => 'Water Sports', 'slug' => 'water-sports'],
        ];

        $categoryMap = [];
        foreach ($categories as $data) {
            $categoryMap[$data['slug']] = ActivityCategory::create($data + ['is_active' => true]);
        }

        $activities = [
            ['name' => 'Dubai Desert Safari with BBQ Dinner', 'city' => 'Dubai', 'category' => 'adventure', 'duration' => 360, 'price' => 3500, 'rating' => 4.7],
            ['name' => 'Burj Khalifa At The Top Experience', 'city' => 'Dubai', 'category' => 'sightseeing', 'duration' => 120, 'price' => 2800, 'rating' => 4.8],
            ['name' => 'Singapore Gardens by the Bay Tour', 'city' => 'Singapore', 'category' => 'sightseeing', 'duration' => 180, 'price' => 2200, 'rating' => 4.6],
            ['name' => 'Old Delhi Street Food Walking Tour', 'city' => 'Delhi', 'category' => 'food-drink', 'duration' => 240, 'price' => 1800, 'rating' => 4.5],
            ['name' => 'Jaipur Pink City Heritage Walk', 'city' => 'Jaipur', 'category' => 'cultural', 'duration' => 300, 'price' => 2000, 'rating' => 4.6],
            ['name' => 'Goa Water Sports Package', 'city' => 'Goa', 'category' => 'water-sports', 'duration' => 180, 'price' => 3200, 'rating' => 4.4],
            ['name' => 'Bangkok Grand Palace & Temple Tour', 'city' => 'Bangkok', 'category' => 'cultural', 'duration' => 240, 'price' => 2500, 'rating' => 4.7],
            ['name' => 'Mumbai Bollywood Studio Tour', 'city' => 'Mumbai', 'category' => 'cultural', 'duration' => 300, 'price' => 3800, 'rating' => 4.3],
            ['name' => 'London Eye & Thames River Cruise', 'city' => 'London', 'category' => 'sightseeing', 'duration' => 150, 'price' => 4200, 'rating' => 4.6],
            ['name' => 'New York Statue of Liberty & Ellis Island', 'city' => 'New York', 'category' => 'sightseeing', 'duration' => 300, 'price' => 5500, 'rating' => 4.8],
        ];

        foreach ($activities as $data) {
            Activity::create([
                'provider_id' => $this->demoProvider->id,
                'category_id' => $categoryMap[$data['category']]->id,
                'city_id' => $this->cityIds[$data['city']],
                'name' => $data['name'],
                'slug' => Str::slug($data['name']) . '-' . Str::random(4),
                'description' => "Experience the best of {$data['city']} with our expertly curated {$data['name']} tour. Led by knowledgeable local guides.",
                'short_description' => "Unforgettable {$data['category']} experience in {$data['city']}.",
                'duration_minutes' => $data['duration'],
                'min_participants' => 1,
                'max_participants' => 20,
                'inclusions' => ['Professional Guide', 'Hotel Pickup/Drop', 'Bottled Water', 'Entrance Tickets'],
                'exclusions' => ['Personal Expenses', 'Gratuities', 'Meals (unless specified)'],
                'images' => ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80'],
                'highlights' => ['Expert local guide', 'Small group experience', 'Hotel pickup included'],
                'cancellation_policy' => ['free_cancellation' => true, 'free_cancellation_hours' => 24],
                'rating' => $data['rating'],
                'review_count' => rand(20, 200),
                'has_guide' => true,
                'is_active' => true,
                'is_featured' => $data['rating'] >= 4.6,
                'is_demo' => true,
            ]);

            ActivityPricing::create([
                'activity_id' => \App\Models\Activity::latest()->first()->id,
                'provider_id' => $this->demoProvider->id,
                'name' => 'Adult',
                'participant_type' => 'adult',
                'price' => $data['price'],
                'currency' => 'INR',
                'is_active' => true,
            ]);
        }
    }

    private function seedTransfers(): void
    {
        $operator = TransferOperator::create(['name' => 'EventraTransfers', 'code' => 'ETRANS', 'is_active' => true, 'is_demo' => true]);

        $vehicleTypes = [
            ['name' => 'Sedan', 'code' => 'SED', 'max_passengers' => 3, 'max_luggage' => 3],
            ['name' => 'SUV', 'code' => 'SUV', 'max_passengers' => 6, 'max_luggage' => 6],
            ['name' => 'Van', 'code' => 'VAN', 'max_passengers' => 10, 'max_luggage' => 10],
            ['name' => 'Luxury Sedan', 'code' => 'LUX', 'max_passengers' => 3, 'max_luggage' => 3],
        ];

        $vtMap = [];
        foreach ($vehicleTypes as $data) {
            $vtMap[$data['code']] = TransferVehicleType::create($data + ['features' => ['Air Conditioning', 'Bottled Water', 'Meet & Greet'], 'has_driver' => true, 'is_active' => true]);
        }

        $airports = Airport::with('city')->get();

        foreach ($airports as $airport) {
            foreach ($vtMap as $code => $vt) {
                $multiplier = $code === 'SED' ? 1 : ($code === 'SUV' ? 1.4 : ($code === 'VAN' ? 1.8 : 2.5));
                $basePrice = 1500 * $multiplier;

                $transfer = Transfer::create([
                    'provider_id' => $this->demoProvider->id,
                    'operator_id' => $operator->id,
                    'vehicle_type_id' => $vt->id,
                    'name' => "{$vt->name} Airport Transfer — {$airport->city->name}",
                    'slug' => Str::slug("{$vt->name} transfer {$airport->city->name}") . '-' . Str::random(4),
                    'description' => "Private {$vt->name} transfer between {$airport->name} and your hotel in {$airport->city->name}.",
                    'transfer_type' => 'airport_to_hotel',
                    'pickup_location_id' => $airport->id,
                    'pickup_address' => $airport->name,
                    'distance_km' => rand(10, 50),
                    'estimated_duration_minutes' => rand(20, 60),
                    'inclusions' => ['Meet & Greet', '60 min free waiting', 'Bottled Water', 'Flight Tracking'],
                    'is_shared' => false,
                    'is_active' => true,
                    'is_demo' => true,
                ]);

                TransferPricing::create([
                    'transfer_id' => $transfer->id,
                    'provider_id' => $this->demoProvider->id,
                    'name' => 'Standard',
                    'pricing_model' => 'fixed',
                    'base_price' => $basePrice,
                    'currency' => 'INR',
                    'is_active' => true,
                ]);

                // Create TransferInventory for this transfer (next 180 days)
                $dates = collect(range(0, 180))->map(fn ($i) => Carbon::today()->addDays($i));
                $pricing = \App\Models\TransferPricing::latest()->first();
                foreach ($dates as $date) {
                    // 80% chance of availability
                    if (rand(1, 10) <= 8) {
                        TransferInventory::create([
                            'transfer_id' => $transfer->id,
                            'pricing_id' => $pricing->id,
                            'date' => $date->toDateString(),
                            'total_vehicles' => 10,
                            'available_vehicles' => rand(1, 10),
                            'booked_vehicles' => 0,
                            'price_override' => null,
                            'is_closed' => false,
                        ]);
                    }
                }
            }
        }
    }

    private function seedPackages(): void
    {
        $packages = [
            [
                'name' => 'Dubai Explorer 5D/4N',
                'city' => 'Dubai',
                'nights' => 4,
                'days' => 5,
                'price' => 65000,
                'description' => 'Experience the best of Dubai with desert safari, Burj Khalifa, dhow cruise, and luxury hotel stay.',
                'highlights' => ['4* Hotel Stay', 'Desert Safari with BBQ', 'Burj Khalifa Level 124', 'Marina Dhow Cruise', 'City Tour', 'Airport Transfers'],
                'itinerary' => [
                    ['day' => 1, 'title' => 'Arrival & Marina Cruise', 'description' => 'Airport pickup, hotel check-in, evening dhow cruise with dinner.'],
                    ['day' => 2, 'title' => 'City Tour & Burj Khalifa', 'description' => 'Half-day city tour, Burj Khalifa 124th floor, Dubai Mall.'],
                    ['day' => 3, 'title' => 'Desert Safari', 'description' => 'Dune bashing, camel ride, BBQ dinner with belly dancing.'],
                    ['day' => 4, 'title' => 'Leisure Day', 'description' => 'Free day for shopping or optional water park visit.'],
                    ['day' => 5, 'title' => 'Departure', 'description' => 'Hotel check-out and airport transfer.'],
                ],
            ],
            [
                'name' => 'Singapore Delights 4D/3N',
                'city' => 'Singapore',
                'nights' => 3,
                'days' => 4,
                'price' => 55000,
                'description' => 'Discover Singapore\'s iconic attractions including Gardens by the Bay, Sentosa Island, and Universal Studios.',
                'highlights' => ['3* Hotel Stay', 'Gardens by the Bay', 'Sentosa Island Pass', 'Universal Studios', 'Night Safari', 'Airport Transfers'],
                'itinerary' => [
                    ['day' => 1, 'title' => 'Arrival & Gardens by the Bay', 'description' => 'Airport pickup, hotel check-in, evening Gardens by the Bay.'],
                    ['day' => 2, 'title' => 'Universal Studios', 'description' => 'Full day at Universal Studios Sentosa.'],
                    ['day' => 3, 'title' => 'City & Night Safari', 'description' => 'Half-day city tour, evening Night Safari.'],
                    ['day' => 4, 'title' => 'Departure', 'description' => 'Check-out and airport transfer.'],
                ],
            ],
            [
                'name' => 'Golden Triangle India 6D/5N',
                'city' => 'Delhi',
                'nights' => 5,
                'days' => 6,
                'price' => 45000,
                'description' => 'Classic India tour covering Delhi, Agra (Taj Mahal), and Jaipur with heritage hotels.',
                'highlights' => ['Taj Mahal Sunrise', 'Amber Fort Elephant Ride', 'Heritage Hotels', 'Guided Tours', 'AC Vehicle with Driver'],
                'itinerary' => [
                    ['day' => 1, 'title' => 'Delhi Arrival', 'description' => 'Arrival, hotel check-in, evening free.'],
                    ['day' => 2, 'title' => 'Delhi Sightseeing', 'description' => 'Old & New Delhi tour: Red Fort, Jama Masjid, India Gate, Qutub Minar.'],
                    ['day' => 3, 'title' => 'Agra — Taj Mahal', 'description' => 'Drive to Agra, visit Taj Mahal and Agra Fort.'],
                    ['day' => 4, 'title' => 'Jaipur via Fatehpur Sikri', 'description' => 'Drive to Jaipur visiting Fatehpur Sikri en route.'],
                    ['day' => 5, 'title' => 'Jaipur Sightseeing', 'description' => 'Amber Fort, City Palace, Hawa Mahal, Jal Mahal.'],
                    ['day' => 6, 'title' => 'Departure', 'description' => 'Drive back to Delhi for departure.'],
                ],
            ],
        ];

        foreach ($packages as $data) {
            $package = TravelPackage::create([
                'provider_id' => $this->demoProvider->id,
                'name' => $data['name'],
                'slug' => Str::slug($data['name']) . '-' . Str::random(4),
                'description' => $data['description'],
                'short_description' => "{$data['nights']}N/{$data['days']}D curated {$data['city']} experience.",
                'destinations' => [['city' => $data['city'], 'country' => '—']],
                'includes' => $data['highlights'],
                'excludes' => ['Visa Fees', 'Travel Insurance', 'Personal Expenses', 'Optional Tours', 'Meals not mentioned'],
                'itinerary' => $data['itinerary'],
                'duration_nights' => $data['nights'],
                'duration_days' => $data['days'],
                'min_participants' => 1,
                'max_participants' => 16,
                'images' => ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80'],
                'highlights' => $data['highlights'],
                'cancellation_policy' => ['free_cancellation' => true, 'free_cancellation_hours' => 72],
                'rating' => rand(42, 49) / 10,
                'review_count' => rand(10, 80),
                'is_active' => true,
                'is_featured' => true,
                'is_demo' => true,
            ]);

            // Create PackagePricing for this package
            $pricing = PackagePricing::create([
                'package_id' => $package->id,
                'provider_id' => $this->demoProvider->id,
                'name' => 'Standard',
                'occupancy' => 'double',
                'price' => $data['price'],
                'currency' => 'INR',
                'includes' => $data['highlights'],
                'room_configuration' => 'Double Room',
                'is_active' => true,
            ]);

            // Create PackageInventory for this package
            $dates = collect(range(0, 180))->map(fn ($i) => Carbon::today()->addDays($i));

            foreach ($dates as $date) {
                if (rand(1, 10) <= 8) {
                    PackageInventory::create([
                        'package_id' => $package->id,
                        'pricing_id' => $pricing->id,
                        'start_date' => $date->toDateString(),
                        'end_date' => $date->copy()->addDays($data['nights'])->toDateString(),
                        'total_slots' => 10,
                        'available_slots' => rand(1, 10),
                        'booked_slots' => 0,
                        'price_override' => null,
                        'is_closed' => false,
                    ]);
                }
            }

            // Create PackageItems for this package
            $destinations = [
                ['service_type' => 'hotel', 'service_name' => $data['city'], 'quantity' => 1, 'description' => "Hotel stay in {$data['city']}"],
                ['service_type' => 'flight', 'service_name' => "Flight to {$data['city']}", 'quantity' => 1, 'description' => "Round trip flight to {$data['city']}"],
                ['service_type' => 'transfer', 'service_name' => "Airport transfer in {$data['city']}", 'quantity' => 2, 'description' => "Airport pickup and drop"],
                ['service_type' => 'activity', 'service_name' => "City tour in {$data['city']}", 'quantity' => 1, 'description' => "Guided city tour"],
            ];
            foreach ($destinations as $index => $item) {
                \App\Models\PackageItem::create([
                    'package_id' => $package->id,
                    'day_number' => 1,
                    'service_type' => $item['service_type'],
                    'service_name' => $item['service_name'],
                    'service_details' => ['description' => $item['description']],
                    'sort_order' => $index,
                ]);
            }
        }
    }
}
