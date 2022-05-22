<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bookings table indexes
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['customer_id', 'status', 'created_at'], 'bookings_customer_status_created_idx');
            $table->index(['agent_id', 'status', 'created_at'], 'bookings_agent_status_created_idx');
            $table->index(['status', 'created_at'], 'bookings_status_created_idx');
            $table->index(['payment_status', 'created_at'], 'bookings_payment_status_created_idx');
            $table->index('booking_reference', 'bookings_reference_idx');
            $table->index(['hold_expires_at', 'status'], 'bookings_hold_expires_status_idx');
            $table->index(['confirmed_at', 'status'], 'bookings_confirmed_status_idx');
            $table->fullText(['booking_reference', 'customer_name']);
        });

        // Booking items indexes
        Schema::table('booking_items', function (Blueprint $table) {
            $table->index(['booking_id', 'item_type'], 'booking_items_booking_type_idx');
            $table->index(['provider_id', 'provider_booking_reference'], 'booking_items_provider_ref_idx');
            $table->index(['service_date', 'item_status'], 'booking_items_date_status_idx');
            $table->index(['service_id', 'item_type'], 'booking_items_service_type_idx');
        });

        // Hotel indexes
        Schema::table('hotels', function (Blueprint $table) {
            $table->index(['city_id', 'is_active', 'is_featured'], 'hotels_city_active_featured_idx');
            $table->index(['provider_id', 'provider_hotel_id'], 'hotels_provider_idx');
            $table->index(['is_active', 'is_featured', 'star_rating'], 'hotels_active_featured_star_idx');
            $table->index(['latitude', 'longitude'], 'hotels_location_idx');
            $table->fullText(['name', 'description', 'address']);
        });

        Schema::table('hotel_room_types', function (Blueprint $table) {
            $table->index(['hotel_id', 'is_active'], 'room_types_hotel_active_idx');
            $table->index(['provider_id', 'provider_room_type_id'], 'room_types_provider_idx');
        });

        Schema::table('hotel_rates', function (Blueprint $table) {
            $table->index(['hotel_id', 'room_type_id', 'is_active'], 'rates_hotel_room_active_idx');
            $table->index(['provider_id', 'provider_rate_id'], 'rates_provider_idx');
        });

        Schema::table('hotel_inventory', function (Blueprint $table) {
            $table->index(['room_type_id', 'rate_id', 'date'], 'inventory_room_rate_date_idx');
            $table->index(['hotel_id', 'date', 'available_rooms'], 'inventory_hotel_date_avail_idx');
            $table->index(['date', 'is_closed'], 'inventory_date_closed_idx');
        });

        // Flight indexes
        Schema::table('flights', function (Blueprint $table) {
            $table->index(['departure_airport_id', 'arrival_airport_id', 'departure_date', 'is_active'], 'flights_route_date_active_idx');
            $table->index(['airline_id', 'is_active'], 'flights_airline_active_idx');
            $table->index(['departure_date', 'is_active'], 'flights_date_active_idx');
            $table->index(['flight_number', 'departure_date'], 'flights_number_date_idx');
        });

        Schema::table('flight_fares', function (Blueprint $table) {
            $table->index(['flight_id', 'cabin_class', 'is_active'], 'fares_flight_cabin_active_idx');
            $table->index(['provider_id', 'provider_fare_id'], 'fares_provider_idx');
        });

        Schema::table('flight_inventory', function (Blueprint $table) {
            $table->index(['fare_id', 'date'], 'flight_inventory_fare_date_idx');
            $table->index(['flight_id', 'date', 'available_seats'], 'flight_inventory_flight_date_avail_idx');
        });

        // Train indexes
        Schema::table('train_routes', function (Blueprint $table) {
            $table->index(['origin_station_id', 'destination_station_id', 'is_active'], 'train_routes_route_active_idx');
            $table->index(['train_number', 'is_active'], 'train_routes_number_active_idx');
            $table->index(['operator_id', 'is_active'], 'train_routes_operator_active_idx');
        });

        Schema::table('train_inventory', function (Blueprint $table) {
            $table->index(['class_id', 'fare_id', 'journey_date'], 'train_inventory_class_fare_date_idx');
            $table->index(['train_route_id', 'journey_date', 'available_berths'], 'train_inventory_route_date_avail_idx');
        });

        // Bus indexes
        Schema::table('bus_routes', function (Blueprint $table) {
            $table->index(['origin_terminal_id', 'destination_terminal_id', 'is_active'], 'bus_routes_route_active_idx');
            $table->index(['operator_id', 'is_active'], 'bus_routes_operator_active_idx');
        });

        Schema::table('bus_inventory', function (Blueprint $table) {
            $table->index(['bus_type_id', 'fare_id', 'journey_date'], 'bus_inventory_type_fare_date_idx');
            $table->index(['bus_route_id', 'journey_date', 'available_seats'], 'bus_inventory_route_date_avail_idx');
        });

        // Venue indexes
        Schema::table('venues', function (Blueprint $table) {
            $table->index(['city_id', 'is_active', 'is_featured'], 'venues_city_active_featured_idx');
            $table->index(['is_active', 'is_featured', 'total_capacity'], 'venues_active_featured_capacity_idx');
            $table->index(['provider_id', 'provider_venue_id'], 'venues_provider_idx');
            $table->index(['latitude', 'longitude'], 'venues_location_idx');
            $table->fullText(['name', 'description', 'address']);
        });

        Schema::table('venue_packages', function (Blueprint $table) {
            $table->index(['venue_id', 'type', 'is_active'], 'venue_packages_venue_type_active_idx');
        });

        Schema::table('venue_availability', function (Blueprint $table) {
            $table->index(['venue_id', 'date', 'status'], 'venue_avail_venue_date_status_idx');
            $table->index(['venue_room_id', 'date', 'status'], 'venue_avail_room_date_status_idx');
        });

        // Car indexes
        Schema::table('cars', function (Blueprint $table) {
            $table->index(['company_id', 'is_active'], 'cars_company_active_idx');
            $table->index(['category_id', 'is_active'], 'cars_category_active_idx');
        });

        Schema::table('car_inventory', function (Blueprint $table) {
            $table->index(['car_id', 'rate_id', 'date', 'status'], 'car_inventory_car_rate_date_status_idx');
        });

        // Activity indexes
        Schema::table('activities', function (Blueprint $table) {
            $table->index(['city_id', 'is_active', 'is_featured'], 'activities_city_active_featured_idx');
            $table->index(['category_id', 'is_active'], 'activities_category_active_idx');
            $table->index(['provider_id', 'provider_activity_id'], 'activities_provider_idx');
        });

        Schema::table('activity_inventory', function (Blueprint $table) {
            $table->index(['activity_id', 'schedule_id', 'pricing_id', 'date'], 'activity_inventory_schedule_pricing_date_idx');
        });

        // Transfer indexes
        Schema::table('transfers', function (Blueprint $table) {
            $table->index(['pickup_location_id', 'dropoff_location_id', 'transfer_type', 'is_active'], 'transfers_route_type_active_idx');
            $table->index(['operator_id', 'is_active'], 'transfers_operator_active_idx');
        });

        Schema::table('transfer_inventory', function (Blueprint $table) {
            $table->index(['transfer_id', 'pricing_id', 'date', 'time_slot'], 'transfer_inventory_transfer_pricing_date_slot_idx');
        });

        // Package indexes
        Schema::table('travel_packages', function (Blueprint $table) {
            $table->index(['is_active', 'is_featured'], 'packages_active_featured_idx');
            $table->index(['duration_nights', 'is_active'], 'packages_duration_active_idx');
        });

        Schema::table('package_inventory', function (Blueprint $table) {
            $table->index(['package_id', 'pricing_id', 'start_date'], 'package_inventory_pkg_pricing_date_idx');
        });

        // Payment indexes
        Schema::table('payments', function (Blueprint $table) {
            $table->index(['booking_id', 'status'], 'payments_booking_status_idx');
            $table->index(['customer_id', 'status'], 'payments_customer_status_idx');
            $table->index(['provider_id', 'provider_payment_id'], 'payments_provider_ref_idx');
            $table->index(['status', 'created_at'], 'payments_status_created_idx');
            $table->index('payment_reference', 'payments_reference_idx');
            $table->index('idempotency_key', 'payments_idempotency_key_idx');
            $table->index(['created_at', 'status'], 'payments_created_status_idx');
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->index(['booking_id', 'status'], 'refunds_booking_status_idx');
            $table->index(['payment_id', 'status'], 'refunds_payment_status_idx');
            $table->index(['customer_id', 'status'], 'refunds_customer_status_idx');
            $table->index(['status', 'created_at'], 'refunds_status_created_idx');
            $table->index('refund_reference', 'refunds_reference_idx');
        });

        Schema::table('cancellations', function (Blueprint $table) {
            $table->index(['booking_id', 'status'], 'cancellations_booking_status_idx');
            $table->index(['customer_id', 'status'], 'cancellations_customer_status_idx');
        });

        Schema::table('reschedules', function (Blueprint $table) {
            $table->index(['booking_id', 'status'], 'reschedules_booking_status_idx');
            $table->index(['booking_item_id', 'status'], 'reschedules_item_status_idx');
        });

        // Commission indexes
        Schema::table('commissions', function (Blueprint $table) {
            $table->index(['agent_id', 'status'], 'commissions_agent_status_idx');
            $table->index(['booking_id', 'status'], 'commissions_booking_status_idx');
            $table->index(['status', 'eligible_date'], 'commissions_status_eligible_idx');
            $table->index('commission_reference', 'commissions_reference_idx');
        });

        // Loyalty indexes
        Schema::table('loyalty_transactions', function (Blueprint $table) {
            $table->index(['loyalty_account_id', 'status'], 'loyalty_transactions_account_status_idx');
            $table->index(['related_booking_id', 'type'], 'loyalty_transactions_booking_type_idx');
        });

        // Notification indexes
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_type', 'notifiable_id', 'is_read'], 'notifications_notifiable_read_idx');
            $table->index(['type', 'created_at'], 'notifications_type_created_idx');
        });

        // Support ticket indexes
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->index(['customer_id', 'status'], 'tickets_customer_status_idx');
            $table->index(['booking_id', 'status'], 'tickets_booking_status_idx');
            <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          ticket.status === 'open' ? 'badge-primary' :
                          ticket.status === 'assigned' ? 'badge-info' :
                          ticket.status === 'in_progress' ? 'badge-warning' :
                          ticket.status === 'waiting_for_customer' ? 'badge-purple' :
                          ticket.status === 'waiting_for_provider' ? 'badge-orange' :
                          ticket.status === 'resolved' ? 'badge-success' :
                          ticket.status === 'closed' ? 'badge-secondary' :
                          ticket.status === 'reopened' ? 'badge-danger' : 'badge-neutral'
                        )}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={cn('badge px-3 py-1 text-body-xs', getPriorityColor(ticket.priority))}>
                          {ticket.priority}
                        </Badge>
                        {ticket.category && (
                          <span className="badge badge-neutral text-body-xs">{ticket.category.replace('_', ' ')}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-eventra-navy-900 truncate">{ticket.subject}</h3>
                      <p className="text-body-sm text-eventra-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-body-xs text-eventra-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(ticket.created_at)}
                        </span>
                        {ticket.booking && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {ticket.booking.booking_reference}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {ticket.response_count} replies
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-eventra-slate-400 flex-shrink-0" />
                  </div>
                </Card>
              )
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {tickets.length > 20 && (
          <Pagination currentPage={1} totalPages={Math.ceil(tickets.length / 20)} />
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Support Ticket"
        size="lg"
      >
        <CreateTicketForm onSubmit={handleCreateTicket} onClose={() => setShowCreateModal(false)} />
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => { setShowTicketModal(false); setSelectedTicket(null); }}
        title={selectedTicket ? `Ticket ${selectedTicket.ticket_number}` : 'Ticket Details'}
        size="xl"
      >
        {selectedTicket && <TicketDetailModal ticket={selectedTicket} onReply={handleSendMessage} newMessage={newMessage} setNewMessage={setNewMessage} isSending={isSending} />}
      </Modal>
    </div>
  )
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  return (
    <Card variant="interactive" onClick={onClick} className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-body-sm text-eventra-slate-500">{ticket.ticket_number}</span>
            <span className={cn('badge px-3 py-1 text-body-xs', getStatusColor(ticket.status))}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={cn('badge px-3 py-1 text-body-xs', getPriorityColor(ticket.priority))}>
              {ticket.priority}
            </span>
            {ticket.category && (
              <span className="badge badge-neutral text-body-xs">{ticket.category.replace('_', ' ')}</span>
            )}
          </div>
          <h3 className="font-semibold text-eventra-navy-900 truncate">{ticket.subject}</h3>
          <p className="text-body-sm text-eventra-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-body-xs text-eventra-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(ticket.created_at)}
            </span>
            {ticket.booking && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {ticket.booking.booking_reference}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {ticket.response_count} replies
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-eventra-slate-400 flex-shrink-0" />
      </div>
    </Card>
  )
}

function EmptyTicketsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Headphones className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No support tickets</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No support tickets found matching your filters.
      </p>
    </motion.div>
  )
}

function SupportSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <ListSkeleton count={5} />
    </div>
  )
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage <= 1}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          className={cn(
            'w-10 h-10 rounded-xl font-medium transition-colors',
            page === currentPage
              ? 'bg-eventra-navy-900 text-white'
              : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
          )}
        >
          {page}
        </button>
      ))}
      {totalPages > 5 && <span className="px-4 text-eventra-slate-500">...</span>}
      {totalPages > 5 && (
        <button className="w-10 h-10 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100">
          {totalPages}
        </button>
      )}
      <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-eventra-blue-100 text-eventra-blue-700'
    case 'assigned': return 'bg-eventra-cyan-100 text-eventra-cyan-700'
    case 'in_progress': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'waiting_for_customer': return 'bg-eventra-purple-100 text-eventra-purple-700'
    case 'waiting_for_provider': return 'bg-eventra-orange-100 text-eventra-orange-700'
    case 'resolved': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'closed': return 'bg-eventra-slate-100 text-eventra-slate-700'
    case 'reopened': return 'bg-eventra-red-100 text-eventra-red-700'
    default: return 'bg-eventra-slate-100 text-eventra-slate-700'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'text-eventra-blue-600'
    case 'normal': return 'text-eventra-slate-600'
    case 'high': return 'text-eventra-amber-600'
    case 'urgent': return 'text-eventra-red-600'
    default: return 'text-eventra-slate-600'
  }
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage <= 1}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          className={cn(
            'w-10 h-10 rounded-xl font-medium transition-colors',
            page === currentPage
              ? 'bg-eventra-navy-900 text-white'
              : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
          )}
        >
          {page}
        </button>
      ))}
      {totalPages > 5 && <span className="px-4 text-eventra-slate-500">...</span>}
      {totalPages > 5 && (
        <button className="w-10 h-10 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100">
          {totalPages}
        </button>
      )}
      <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}