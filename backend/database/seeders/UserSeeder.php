<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Agent;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        $adminUser = User::create([
            'uuid' => Str::uuid(),
            'name' => 'EventraOS Admin',
            'email' => 'admin@demo.com',
            'phone' => '+911111111111',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $adminUser->assignRole('admin');
        Admin::create([
            'uuid' => Str::uuid(),
            'user_id' => $adminUser->id,
            'admin_number' => 'ADM-' . strtoupper(Str::random(8)),
            'department' => 'Operations',
            'level' => 'super_admin',
            'can_manage_admins' => true,
            'can_manage_agents' => true,
            'can_manage_finances' => true,
            'can_view_audit_logs' => true,
            'can_manage_system' => true,
        ]);

        // Agents
        $agents = [
            ['name' => 'Sarah Travel Expert', 'email' => 'agent@demo.com', 'phone' => '+912222222222', 'agency' => 'EventraOS Travel Partners'],
            ['name' => 'Rajesh Kumar', 'email' => 'rajesh.agent@demo.com', 'phone' => '+912222222223', 'agency' => 'Kumar Holidays'],
        ];

        foreach ($agents as $i => $agentData) {
            $user = User::create([
                'uuid' => Str::uuid(),
                'name' => $agentData['name'],
                'email' => $agentData['email'],
                'phone' => $agentData['phone'],
                'password' => bcrypt('password'),
                'role' => 'agent',
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
            $user->assignRole('agent');

            $agent = Agent::create([
                'uuid' => Str::uuid(),
                'user_id' => $user->id,
                'agent_number' => 'AGT-' . strtoupper(Str::random(8)),
                'agency_name' => $agentData['agency'],
                'commission_rate' => 10.00,
                'commission_type' => 'percentage',
                'monthly_target' => 500000,
                'status' => 'active',
            ]);

            if ($i === 0) {
                $this->primaryAgentId = $agent->id;
            }
        }

        // Customers
        $customers = [
            ['name' => 'Demo Customer', 'email' => 'customer@demo.com', 'phone' => '+913333333333'],
            ['name' => 'Priya Sharma', 'email' => 'priya@demo.com', 'phone' => '+913333333334'],
            ['name' => 'John Traveler', 'email' => 'john@demo.com', 'phone' => '+913333333335'],
        ];

        foreach ($customers as $i => $customerData) {
            $user = User::create([
                'uuid' => Str::uuid(),
                'name' => $customerData['name'],
                'email' => $customerData['email'],
                'phone' => $customerData['phone'],
                'password' => bcrypt('password'),
                'role' => 'customer',
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
            $user->assignRole('customer');

            $customer = Customer::create([
                'uuid' => Str::uuid(),
                'user_id' => $user->id,
                'customer_number' => 'CUST-' . strtoupper(Str::random(8)),
                'nationality' => 'IN',
                'assigned_agent_id' => $i === 0 ? $this->primaryAgentId : null,
                'is_vip' => $i === 1,
            ]);

            $customer->wallet()->create(['currency' => 'INR', 'balance' => $i === 0 ? 10000 : 0]);
            $customer->loyaltyAccount()->create([
                'points_balance' => $i === 0 ? 500 : 0,
                'points_lifetime_earned' => $i === 0 ? 500 : 0,
                'tier' => $i === 0 ? 'bronze' : 'bronze',
            ]);
        }
    }

    private int $primaryAgentId = 0;
}
