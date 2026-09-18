<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Provider;
use App\Models\SupportTicket;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $customerCount = Customer::count();
        $agentCount = Agent::where('status', 'active')->count();

        $bookingsToday = Booking::whereDate('created_at', today())->count();
        $bookingsThisMonth = Booking::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        $grossValue = (float) Booking::where('payment_status', 'paid')->sum('grand_total');
        $netRevenue = (float) Payment::where('status', 'captured')->sum('net_amount');
        $pendingPayments = Booking::whereIn('payment_status', ['unpaid', 'partial'])->whereIn('status', ['confirmed', 'payment_pending'])->count();
        $refundCount = Refund::where('status', 'completed')->count();
        $supportCount = SupportTicket::whereIn('status', ['open', 'in_progress'])->count();

        $categoryDist = DB::table('booking_items')
            ->select('item_type', DB::raw('count(*) as count'))
            ->groupBy('item_type')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => ['category' => $r->item_type, 'count' => $r->count]);

        $revenueTrend = Booking::selectRaw("DATE(created_at) as date, SUM(grand_total) as revenue")
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'revenue' => (float) $r->revenue]);

        $recentBookings = Booking::with('items')->orderBy('created_at', 'desc')->limit(10)->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'booking_reference' => $b->booking_reference,
                'customer_name' => $b->customer?->user?->name ?? '—',
                'service_name' => $b->items->first()?->service_name ?? '—',
                'amount' => (float) $b->grand_total,
                'currency' => $b->currency,
                'status' => $b->status,
                'created_at' => $b->created_at->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'kpis' => [
                    'total_customers' => $customerCount,
                    'total_agents' => $agentCount,
                    'bookings_today' => $bookingsToday,
                    'bookings_this_month' => $bookingsThisMonth,
                    'gross_booking_value' => $grossValue,
                    'net_revenue' => $netRevenue,
                    'pending_payments' => $pendingPayments,
                    'refunds' => $refundCount,
                    'upcoming_travel' => Booking::whereIn('status', ['confirmed'])->whereHas('items', fn ($q) => $q->where('service_date', '>=', now()))->count(),
                    'support_tickets' => $supportCount,
                ],
                'revenue_chart' => $revenueTrend,
                'booking_trends' => [],
                'category_distribution' => $categoryDist,
                'recent_bookings' => $recentBookings,
                'recent_payments' => [],
                'pending_refunds' => [],
                'system_health' => $this->systemHealthData(),
            ],
        ]);
    }

    public function systemHealth(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->systemHealthData()]);
    }

    public function reports(Request $request): JsonResponse
    {
        $type = $request->query('type', 'sales');
        $days = (int) $request->query('days', 30);

        $salesReport = [
            'summary' => [
                'total_bookings' => Booking::count(),
                'total_revenue' => (float) Booking::where('payment_status', 'paid')->sum('grand_total'),
                'avg_booking_value' => (float) Booking::where('payment_status', 'paid')->avg('grand_total'),
                'cancellation_rate' => Booking::count() > 0
                    ? round(Booking::whereIn('status', ['cancelled', 'cancel_requested'])->count() / Booking::count() * 100, 2)
                    : 0,
            ],
            'by_product' => DB::table('booking_items')
                ->join('bookings', 'booking_items.booking_id', '=', 'bookings.id')
                ->select('booking_items.item_type', DB::raw('count(*) as count'), DB::raw('SUM(booking_items.total_price) as revenue'))
                ->where('bookings.payment_status', 'paid')
                ->groupBy('booking_items.item_type')
                ->get(),
            'daily_revenue' => Booking::selectRaw("DATE(created_at) as date, SUM(grand_total) as revenue, COUNT(*) as bookings")
                ->where('created_at', '>=', now()->subDays($days))
                ->groupBy('date')->orderBy('date')->get(),
        ];

        $customerReport = [
            'total' => Customer::count(),
            'new_this_month' => Customer::whereMonth('created_at', now()->month)->count(),
            'repeat_customers' => Customer::has('bookings', '>=', 2)->count(),
            'top_customers' => Customer::with('user')
                ->withCount('bookings')
                ->orderByDesc('bookings_count')->limit(10)->get()
                ->map(fn ($c) => ['name' => $c->user?->name, 'bookings' => $c->bookings_count]),
        ];

        $agentReport = [
            'total_agents' => Agent::count(),
            'active_agents' => Agent::where('status', 'active')->count(),
            'top_agents' => Agent::with('user')->withCount('bookings')->orderByDesc('bookings_count')->limit(10)->get()
                ->map(fn ($a) => ['name' => $a->user?->name, 'bookings' => $a->bookings_count]),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'type' => $type,
                'sales' => $salesReport,
                'customers' => $customerReport,
                'agents' => $agentReport,
            ],
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::query()->orderBy('created_at', 'desc');

        if ($severity = $request->query('severity')) {
            if ($severity !== 'all') $query->where('severity', $severity);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('entity_type', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate($request->integer('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => [
                'logs' => collect($logs->items()),
                'total_count' => $logs->total(),
                'actions' => AuditLog::distinct()->pluck('action'),
                'entities' => AuditLog::distinct()->pluck('entity_type'),
            ],
        ]);
    }

    public function getSettings(): JsonResponse
    {
        $settings = SystemSetting::orderBy('group')->orderBy('sort_order')->get();
        return response()->json(['success' => true, 'data' => ['settings' => $settings]]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
        ]);

        foreach ($validated['settings'] as $setting) {
            SystemSetting::where('key', $setting['key'])->update(['value' => (string) ($setting['value'] ?? '')]);
        }

        return response()->json(['success' => true, 'message' => 'Settings updated.']);
    }

    private function systemHealthData(): array
    {
        $dbOk = false;
        try { DB::select('SELECT 1'); $dbOk = true; } catch (\Throwable) {}

        return [
            'database' => ['status' => $dbOk ? 'healthy' : 'error', 'latency' => '—'],
            'cache' => ['status' => 'healthy', 'driver' => config('cache.default')],
            'queue' => ['status' => 'healthy', 'connection' => config('queue.default')],
            'mail' => ['status' => 'healthy', 'mailer' => config('mail.default')],
            'payment_gateway' => ['status' => 'healthy', 'mode' => config('services.payment.mode', 'demo')],
            'providers' => Provider::get()->map(fn ($p) => [
                'code' => $p->code, 'type' => $p->type, 'mode' => $p->mode,
                'status' => $p->status, 'last_sync' => $p->last_sync_at?->toISOString(),
            ]),
            'disk_space' => ['status' => 'healthy'],
        ];
    }
}
