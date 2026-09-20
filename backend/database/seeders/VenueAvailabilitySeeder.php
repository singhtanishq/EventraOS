<?php

namespace Database\Seeders;

use App\Models\Venue;
use App\Models\VenueAvailability;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class VenueAvailabilitySeeder extends Seeder
{
    public function run(): void
    {
        $venues = \App\Models\Venue::where('is_active', true)->where('is_demo', true)->get();
        
        foreach ($venues as $venue) {
            // Create availability for the next 90 days
            $dates = collect(range(0, 90))->map(fn ($i) => \Carbon\Carbon::today()->addDays($i));
            
            foreach ($dates as $date) {
                // 80% chance of availability
                if (rand(1, 10) <= 8) {
                    \App\Models\VenueAvailability::create([
                        'venue_id' => $venue->id,
                        'venue_room_id' => null,
                        'date' => $date->toDateString(),
                        'start_time' => '09:00:00',
                        'end_time' => '23:00:00',
                        'status' => 'available',
                        'price_override' => null,
                    ]);
                }
            }
        }
    }
}
