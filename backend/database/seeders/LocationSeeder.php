<?php

namespace Database\Seeders;

use App\Models\Airport;
use App\Models\City;
use App\Models\Country;
use App\Models\Station;
use App\Models\BusTerminal;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            [
                'country' => ['name' => 'India', 'iso_code_2' => 'IN', 'iso_code_3' => 'IND', 'iso_numeric' => '356', 'phone_code' => '+91', 'currency_code' => 'INR', 'currency_symbol' => '₹', 'currency_name' => 'Indian Rupee', 'capital' => 'New Delhi', 'region' => 'Asia', 'subregion' => 'Southern Asia', 'flag_emoji' => '🇮🇳'],
                'cities' => [
                    ['name' => 'Delhi', 'latitude' => 28.6139, 'longitude' => 77.2090, 'timezone' => 'Asia/Kolkata', 'is_popular' => true],
                    ['name' => 'Mumbai', 'latitude' => 19.0760, 'longitude' => 72.8777, 'timezone' => 'Asia/Kolkata', 'is_popular' => true],
                    ['name' => 'Jaipur', 'latitude' => 26.9124, 'longitude' => 75.7873, 'timezone' => 'Asia/Kolkata'],
                    ['name' => 'Lucknow', 'latitude' => 26.8467, 'longitude' => 80.9462, 'timezone' => 'Asia/Kolkata'],
                    ['name' => 'Goa', 'latitude' => 15.2993, 'longitude' => 74.1240, 'timezone' => 'Asia/Kolkata', 'is_popular' => true],
                ],
                'airports' => [
                    ['city' => 'Delhi', 'name' => 'Indira Gandhi International Airport', 'iata_code' => 'DEL', 'icao_code' => 'VIDP', 'latitude' => 28.5562, 'longitude' => 77.1000, 'timezone' => 'Asia/Kolkata', 'is_international' => true],
                    ['city' => 'Mumbai', 'name' => 'Chhatrapati Shivaji Maharaj International Airport', 'iata_code' => 'BOM', 'icao_code' => 'VABB', 'latitude' => 19.0896, 'longitude' => 72.8656, 'timezone' => 'Asia/Kolkata', 'is_international' => true],
                    ['city' => 'Goa', 'name' => 'Dabolim Airport', 'iata_code' => 'GOI', 'icao_code' => 'VOGO', 'latitude' => 15.3808, 'longitude' => 73.8314, 'timezone' => 'Asia/Kolkata', 'is_international' => true],
                ],
                'stations' => [
                    ['city' => 'Delhi', 'name' => 'New Delhi Railway Station', 'code' => 'NDLS', 'latitude' => 28.6428, 'longitude' => 77.2192, 'timezone' => 'Asia/Kolkata'],
                    ['city' => 'Mumbai', 'name' => 'Mumbai Central', 'code' => 'BCT', 'latitude' => 18.9712, 'longitude' => 72.8193, 'timezone' => 'Asia/Kolkata'],
                    ['city' => 'Jaipur', 'name' => 'Jaipur Junction', 'code' => 'JP', 'latitude' => 26.9196, 'longitude' => 75.7878, 'timezone' => 'Asia/Kolkata'],
                ],
                'bus_terminals' => [
                    ['city' => 'Delhi', 'name' => 'Kashmere Gate ISBT', 'code' => 'DEL-ISBT', 'latitude' => 28.6673, 'longitude' => 77.2283],
                    ['city' => 'Jaipur', 'name' => 'Sindhi Camp Bus Stand', 'code' => 'JPR-SC', 'latitude' => 26.9287, 'longitude' => 75.7900],
                ],
            ],
            [
                'country' => ['name' => 'United Arab Emirates', 'iso_code_2' => 'AE', 'iso_code_3' => 'ARE', 'iso_numeric' => '784', 'phone_code' => '+971', 'currency_code' => 'AED', 'currency_symbol' => 'د.إ', 'currency_name' => 'UAE Dirham', 'capital' => 'Abu Dhabi', 'region' => 'Asia', 'subregion' => 'Western Asia', 'flag_emoji' => '🇦🇪'],
                'cities' => [
                    ['name' => 'Dubai', 'latitude' => 25.2048, 'longitude' => 55.2708, 'timezone' => 'Asia/Dubai', 'is_popular' => true],
                    ['name' => 'Abu Dhabi', 'latitude' => 24.4539, 'longitude' => 54.3773, 'timezone' => 'Asia/Dubai'],
                ],
                'airports' => [
                    ['city' => 'Dubai', 'name' => 'Dubai International Airport', 'iata_code' => 'DXB', 'icao_code' => 'OMDB', 'latitude' => 25.2532, 'longitude' => 55.3657, 'timezone' => 'Asia/Dubai', 'is_international' => true],
                    ['city' => 'Abu Dhabi', 'name' => 'Zayed International Airport', 'iata_code' => 'AUH', 'icao_code' => 'OMAA', 'latitude' => 24.4330, 'longitude' => 54.6511, 'timezone' => 'Asia/Dubai', 'is_international' => true],
                ],
                'stations' => [],
                'bus_terminals' => [],
            ],
            [
                'country' => ['name' => 'Singapore', 'iso_code_2' => 'SG', 'iso_code_3' => 'SGP', 'iso_numeric' => '702', 'phone_code' => '+65', 'currency_code' => 'SGD', 'currency_symbol' => 'S$', 'currency_name' => 'Singapore Dollar', 'capital' => 'Singapore', 'region' => 'Asia', 'subregion' => 'South-Eastern Asia', 'flag_emoji' => '🇸🇬'],
                'cities' => [
                    ['name' => 'Singapore', 'latitude' => 1.3521, 'longitude' => 103.8198, 'timezone' => 'Asia/Singapore', 'is_popular' => true],
                ],
                'airports' => [
                    ['city' => 'Singapore', 'name' => 'Singapore Changi Airport', 'iata_code' => 'SIN', 'icao_code' => 'WSSS', 'latitude' => 1.3644, 'longitude' => 103.9915, 'timezone' => 'Asia/Singapore', 'is_international' => true],
                ],
                'stations' => [],
                'bus_terminals' => [],
            ],
            [
                'country' => ['name' => 'Thailand', 'iso_code_2' => 'TH', 'iso_code_3' => 'THA', 'iso_numeric' => '764', 'phone_code' => '+66', 'currency_code' => 'THB', 'currency_symbol' => '฿', 'currency_name' => 'Thai Baht', 'capital' => 'Bangkok', 'region' => 'Asia', 'subregion' => 'South-Eastern Asia', 'flag_emoji' => '🇹🇭'],
                'cities' => [
                    ['name' => 'Bangkok', 'latitude' => 13.7563, 'longitude' => 100.5018, 'timezone' => 'Asia/Bangkok', 'is_popular' => true],
                    ['name' => 'Phuket', 'latitude' => 7.8804, 'longitude' => 98.3923, 'timezone' => 'Asia/Bangkok'],
                ],
                'airports' => [
                    ['city' => 'Bangkok', 'name' => 'Suvarnabhumi Airport', 'iata_code' => 'BKK', 'icao_code' => 'VTBS', 'latitude' => 13.6900, 'longitude' => 100.7501, 'timezone' => 'Asia/Bangkok', 'is_international' => true],
                ],
                'stations' => [],
                'bus_terminals' => [],
            ],
            [
                'country' => ['name' => 'United Kingdom', 'iso_code_2' => 'GB', 'iso_code_3' => 'GBR', 'iso_numeric' => '826', 'phone_code' => '+44', 'currency_code' => 'GBP', 'currency_symbol' => '£', 'currency_name' => 'British Pound', 'capital' => 'London', 'region' => 'Europe', 'subregion' => 'Northern Europe', 'flag_emoji' => '🇬🇧'],
                'cities' => [
                    ['name' => 'London', 'latitude' => 51.5074, 'longitude' => -0.1278, 'timezone' => 'Europe/London', 'is_popular' => true],
                ],
                'airports' => [
                    ['city' => 'London', 'name' => 'Heathrow Airport', 'iata_code' => 'LHR', 'icao_code' => 'EGLL', 'latitude' => 51.4700, 'longitude' => -0.4543, 'timezone' => 'Europe/London', 'is_international' => true],
                ],
                'stations' => [],
                'bus_terminals' => [],
            ],
            [
                'country' => ['name' => 'United States', 'iso_code_2' => 'US', 'iso_code_3' => 'USA', 'iso_numeric' => '840', 'phone_code' => '+1', 'currency_code' => 'USD', 'currency_symbol' => '$', 'currency_name' => 'US Dollar', 'capital' => 'Washington, D.C.', 'region' => 'Americas', 'subregion' => 'Northern America', 'flag_emoji' => '🇺🇸'],
                'cities' => [
                    ['name' => 'New York', 'latitude' => 40.7128, 'longitude' => -74.0060, 'timezone' => 'America/New_York', 'is_popular' => true],
                ],
                'airports' => [
                    ['city' => 'New York', 'name' => 'John F. Kennedy International Airport', 'iata_code' => 'JFK', 'icao_code' => 'KJFK', 'latitude' => 40.6413, 'longitude' => -73.7781, 'timezone' => 'America/New_York', 'is_international' => true],
                ],
                'stations' => [],
                'bus_terminals' => [],
            ],
        ];

        foreach ($locations as $entry) {
            $country = Country::create(array_merge($entry['country'], ['is_active' => true]));
            $cityMap = [];

            foreach ($entry['cities'] as $cityData) {
                $city = City::create(array_merge($cityData, ['country_id' => $country->id, 'is_active' => true]));
                $cityMap[$cityData['name']] = $city->id;
            }

            foreach ($entry['airports'] as $airportData) {
                $airportDataClean = collect($airportData)->except('city')->all();
                Airport::create(array_merge($airportDataClean, ['city_id' => $cityMap[$airportData['city']], 'is_active' => true]));
            }

            foreach ($entry['stations'] as $stationData) {
                $stationDataClean = collect($stationData)->except('city')->all();
                Station::create(array_merge($stationDataClean, ['city_id' => $cityMap[$stationData['city']], 'type' => 'train', 'is_active' => true]));
            }

            foreach ($entry['bus_terminals'] as $terminalData) {
                $terminalDataClean = collect($terminalData)->except('city')->all();
                BusTerminal::create(array_merge($terminalDataClean, ['city_id' => $cityMap[$terminalData['city']], 'is_active' => true]));
            }
        }
    }
}
