<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentTask;
use App\Models\Booking;
use App\Models\Commission;
use App\Models\Customer;
use App\Models\Quote;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    private function agent(Request $request): Agent
    {
        $agent = $request->user()->agent;
        abort_unless($agent, 403, 'Agent profile not found.');
        return $agent;
    }

    public function dashboard(Request $request): JsonResponse
    {
        $agent = $this->agent($request);

        $todayBookings = $agent->bookings()->whereDate('created_at', today())->count();
        $upcomingTrips = $agent->bookings()
            ->whereIn('status', ['confirmed', 'partially_confirmed'])
            ->whereHas('items', fn ($q) => $q->where('service_date', '>=', now()))
            ->count();
        $commissionSummary = $this->commissionSummary($agent);
        $customerCount = Customer::where('assigned_agent_id', $agent->id)->count();
        $taskCount = AgentTask::where('agent_id', $agent->id)->where('status', '!=', 'completed')->count();
        $supportCount = SupportTicket::where('assigned_agent_id', $agent->id)->whereIn('status', ['open', 'in_progress'])->count();

        $recentBookings = $agent->bookings()->with('items')
            ->orderBy('created_at', 'desc')->limit(5)->get()
            ->map(fn ($b) => $this->mapBooking($b, $agent));

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'today_bookings' => $todayBookings,
                    'pending_requests' => 0,
                    'upcoming_trips' => $upcomingTrips,
                    'commission_earned' => $commissionSummary['total_net'],
                    'revenue' => (float) $agent->bookings()->where('payment_status', 'paid')->sum('grand_total'),
                    'customers_count' => $customerCount,
                    'tasks_count' => $taskCount,
                    'support_cases' => $supportCount,
                ],
                'commission_summary' => $commissionSummary,
                'recent_bookings' => $recentBookings,
                'pending_requests' => [],
                'upcoming_trips' => [],
                'tasks' => $agent->tasks()->whereIn('status', ['pending', 'in_progress'])->orderBy('due_date')->limit(5)->get(),
            ],
        ]);
    }

    public function customers(Request $request): JsonResponse
    {
        $agent = $this->agent($request);

        $query = Customer::with('user')->where('assigned_agent_id', $agent->id);

        if ($search = $request->query('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        $customers = $query->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15))
            ->through(fn ($c) => $this->mapCustomer($c));

        return response()->json(['success' => true, 'data' => ['customers' => collect($customers->items()), 'total_count' => $customers->total()]]);
    }

    public function createCustomer(Request $request): JsonResponse
    {
        $agent = $this->agent($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8',
        ]);

        $customer = DB::transaction(function () use ($validated, $agent) {
            $user = User::create([
                'uuid' => Str::uuid(),
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'customer',
            ]);

            $customer = Customer::create([
                'uuid' => Str::uuid(),
                'user_id' => $user->id,
                'customer_number' => 'CUST-' . strtoupper(Str::random(8)),
                'assigned_agent_id' => $agent->id,
            ]);

            $customer->wallet()->create(['currency' => 'INR']);
            $customer->loyaltyAccount()->create([]);
            $user->assignRole('customer');

            return $customer;
        });

        return response()->json(['success' => true, 'message' => 'Customer created.', 'data' => $this->mapCustomer($customer->load('user'))], 201);
    }

    public function bookings(Request $request): JsonResponse
    {
        $agent = $this->agent($request);
        $query = Booking::with('items')->where('agent_id', $agent->id)->orderBy('created_at', 'desc');

        if ($status = $request->query('status')) {
            if ($status !== 'all') $query->where('status', $status);
        }

        $bookings = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => [
                'bookings' => collect($bookings->items())->map(fn ($b) => $this->mapBooking($b, $agent)),
                'total_count' => $bookings->total(),
            ],
        ]);
    }

    public function createBooking(Request $request): JsonResponse
    {
        $agent = $this->agent($request);
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,id',
            'items' => 'required|array|min:1',
        ]);

        $customer = Customer::findOrFail($validated['customer_id']);
        abort_unless($customer->assigned_agent_id === $agent->id, 403, 'Customer is not assigned to you.');

        $booking = app(\App\Services\Booking\BookingService::class)->createBooking($customer, $validated, $agent);

        return response()->json(['success' => true, 'message' => 'Booking created.', 'data' => $booking], 201);
    }

    public function quotes(Request $request): JsonResponse
    {
        $agent = $this->agent($request);
        $quotes = Quote::where('agent_id', $agent->id)->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => ['quotes' => $quotes]]);
    }

    public function createQuote(Request $request): JsonResponse
    {
        $agent = $this->agent($request);
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,id',
            'items' => 'required|array|min:1',
            'valid_until' => 'required|date|after:now',
            'notes' => 'nullable|string|max:2000',
        ]);

        $customer = Customer::findOrFail($validated['customer_id']);
        abort_unless($customer->assigned_agent_id === $agent->id, 403, 'Customer is not assigned to you.');

        $subtotal = collect($validated['items'])->sum(fn ($i) => (float) ($i['unit_price'] ?? 0) * ($i['quantity'] ?? 1));
        $taxTotal = round($subtotal * 0.18, 2);

        $quote = Quote::create([
            'agent_id' => $agent->id,
            'customer_id' => $customer->id,
            'status' => 'draft',
            'items' => $validated['items'],
            'subtotal' => $subtotal,
            'tax_total' => $taxTotal,
            'grand_total' => $subtotal + $taxTotal,
            'currency' => 'INR',
            'valid_until' => $validated['valid_until'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json(['success' => true, 'message' => 'Quote created.', 'data' => $quote], 201);
    }

    public function commissions(Request $request): JsonResponse
    {
        $agent = $this->agent($request);
        $commissions = Commission::where('agent_id', $agent->id)->orderBy('created_at', 'desc')->get();
        $summary = $this->commissionSummary($agent);

        return response()->json([
            'success' => true,
            'data' => [
                'commissions' => $commissions,
                'summary' => $summary,
            ],
        ]);
    }

    public function tasks(Request $request): JsonResponse
    {
        $tasks = $this->agent($request)->tasks()->orderBy('due_date')->get();
        return response()->json(['success' => true, 'data' => ['tasks' => $tasks]]);
    }

    public function createTask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'due_date' => 'required|date|after_or_equal:today',
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'customer_id' => 'nullable|integer|exists:customers,id',
            'booking_id' => 'nullable|integer|exists:bookings,id',
        ]);

        $task = $this->agent($request)->tasks()->create($validated + ['status' => 'pending', 'priority' => $validated['priority'] ?? 'normal']);
        return response()->json(['success' => true, 'message' => 'Task created.', 'data' => $task], 201);
    }

    public function updateTask(Request $request, AgentTask $task): JsonResponse
    {
        abort_unless($task->agent_id === $this->agent($request)->id, 403);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'due_date' => 'sometimes|date',
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'status' => 'sometimes|in:pending,in_progress,completed,cancelled',
        ]);

        $task->update($validated);
        return response()->json(['success' => true, 'message' => 'Task updated.', 'data' => $task->fresh()]);
    }

    public function support(Request $request): JsonResponse
    {
        $tickets = SupportTicket::with('customer.user')->where('assigned_agent_id', $this->agent($request)->id)
            ->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => ['tickets' => $tickets]]);
    }

    private function commissionSummary(Agent $agent): array
    {
        $commissions = Commission::where('agent_id', $agent->id)->get();

        return [
            'total_earned' => (float) $commissions->sum('commission_amount'),
            'total_net' => (float) $commissions->sum('net_commission'),
            'pending' => (float) $commissions->where('status', 'pending')->sum('net_commission'),
            'eligible' => (float) $commissions->where('status', 'eligible')->sum('net_commission'),
            'approved' => (float) $commissions->where('status', 'approved')->sum('net_commission'),
            'paid' => (float) $commissions->where('status', 'paid')->sum('net_commission'),
            'this_month_target' => (float) $agent->monthly_target,
            'paid_this_month' => (float) $commissions->where('status', 'paid')->where('paid_at', '>=', now()->startOfMonth())->sum('net_commission'),
        ];
    }

    private function mapBooking(Booking $b, Agent $agent): array
    {
        return [
            'id' => $b->id,
            'booking_reference' => $b->booking_reference,
            'customer_name' => $b->customer?->user?->name ?? '—',
            'customer_email' => $b->customer?->user?->email ?? '—',
            'service_type' => $b->items->first()?->item_type ?? 'package',
            'service_name' => $b->items->first()?->service_name ?? '—',
            'status' => $b->status,
            'payment_status' => $b->payment_status,
            'amount' => (float) $b->grand_total,
            'currency' => $b->currency,
            'travel_date' => $b->items->first()?->service_date?->toDateString(),
            'created_at' => $b->created_at->toISOString(),
            'items' => $b->items,
        ];
    }

    private function mapCustomer(Customer $c): array
    {
        return [
            'id' => $c->id,
            'uuid' => $c->uuid,
            'customer_number' => $c->customer_number,
            'user' => ['name' => $c->user?->name, 'email' => $c->user?->email, 'phone' => $c->user?->phone],
            'total_bookings' => $c->bookings()->count(),
            'completed_bookings' => $c->bookings()->where('status', 'completed')->count(),
            'cancelled_bookings' => $c->bookings()->where('status', 'cancelled')->count(),
            'total_spent' => (float) $c->bookings()->where('payment_status', 'paid')->sum('grand_total'),
            'loyalty_points' => (int) ($c->loyaltyAccount?->points_balance ?? 0),
            'assigned_at' => $c->created_at->toISOString(),
            'last_booking_at' => $c->last_booking_at?->toISOString(),
            'is_vip' => (bool) $c->is_vip,
            'status' => $c->user?->is_active ? 'active' : 'inactive',
        ];
    }
}
