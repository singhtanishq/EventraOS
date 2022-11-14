<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // bookings
            'bookings.view', 'bookings.viewAny', 'bookings.create', 'bookings.edit',
            'bookings.cancel', 'bookings.refund', 'bookings.reschedule',
            // customers
            'customers.view', 'customers.viewAny', 'customers.create', 'customers.edit', 'customers.delete',
            // agents
            'agents.view', 'agents.viewAny', 'agents.create', 'agents.edit', 'agents.delete',
            // inventory
            'inventory.view', 'inventory.manage', 'suppliers.manage', 'venues.manage', 'hotels.manage', 'transport.manage',
            // promotions
            'promotions.view', 'promotions.manage',
            // payments
            'payments.view', 'payments.viewAny', 'payments.make', 'payments.refund',
            // reports
            'reports.view', 'reports.export',
            // system
            'settings.manage', 'audit.view', 'system.manage',
            // support
            'support.view', 'support.create', 'support.respond',
            // commissions
            'commissions.view', 'commissions.manage',
            // reviews
            'reviews.create', 'reviews.moderate',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $customer = Role::findOrCreate('customer', 'web');
        $customer->syncPermissions([
            'bookings.view', 'bookings.create', 'bookings.cancel', 'bookings.reschedule',
            'payments.view', 'payments.make', 'reviews.create',
            'support.view', 'support.create',
        ]);

        $agent = Role::findOrCreate('agent', 'web');
        $agent->syncPermissions([
            'bookings.view', 'bookings.viewAny', 'bookings.create', 'bookings.edit', 'bookings.cancel',
            'customers.view', 'customers.viewAny', 'customers.create', 'customers.edit',
            'promotions.view', 'payments.view',
            'reports.view', 'support.view', 'support.respond',
            'commissions.view',
        ]);

        $admin = Role::findOrCreate('admin', 'web');
        $admin->syncPermissions(Permission::all());
    }
}
