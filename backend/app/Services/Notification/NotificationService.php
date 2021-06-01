<?php

namespace App\Services\Notification;

use App\Models\Notification;
use App\Models\Customer;
use App\Models\Agent;
use App\Models\Admin;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

class NotificationService
{
    public function sendBookingConfirmation(Booking $booking): void
    {
        $customer = $booking->customer;

        // In-app notification
        $this->createInAppNotification($customer, [
            'type' => 'booking_confirmed',
            'title' => 'Booking Confirmed',
            'message' => "Your booking {$booking->booking_reference} has been confirmed.",
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'items' => $booking->items->map(fn($i) => [
                    'type' => $i->item_type,
                    'name' => $i->service_name,
                    'date' => $i->service_date,
                ])->toArray(),
            ],
            'action_url' => "/customer/bookings/{$booking->booking_reference}",
            'priority' => 'high',
        ]);

        // Email notification
        $this->sendEmail($customer->user->email, 'booking_confirmed', [
            'booking' => $booking,
            'customer' => $customer,
        ]);

        // SMS notification (if enabled)
        if ($this->shouldSendSms($customer, 'booking_confirmed')) {
            $this->sendSms($customer->user->phone, "Booking {$booking->booking_reference} confirmed. Check your email for details.");
        }
    }

    public function sendBookingCancellation(Booking $booking): void
    {
        $customer = $booking->customer;

        $this->createInAppNotification($customer, [
            'type' => 'booking_cancelled',
            'title' => 'Booking Cancelled',
            'message' => "Your booking {$booking->booking_reference} has been cancelled.",
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'refund_amount' => $booking->amount_refunded,
            ],
            'action_url' => "/customer/bookings/{$booking->booking_reference}",
            'priority' => 'high',
        ]);

        $this->sendEmail($customer->user->email, 'booking_cancelled', [
            'booking' => $booking,
            'customer' => $customer,
        ]);

        if ($this->shouldSendSms($customer, 'booking_cancelled')) {
            $this->sendSms($customer->user->phone, "Booking {$booking->booking_reference} cancelled. Refund of " . \App\Services\Currency\CurrencyService::format($booking->amount_refunded, $booking->currency) . " initiated.");
        }
    }

    public function sendBookingReschedule(Booking $booking, BookingItem $item, array $original, array $new): void
    {
        $customer = $booking->customer;

        $this->createInAppNotification($customer, [
            'type' => 'booking_rescheduled',
            'title' => 'Booking Rescheduled',
            'message' => "Your {$item->service_name} has been rescheduled to " . \Carbon\Carbon::parse($new['service_date'])->format('d M Y'),
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'item_id' => $item->id,
                'original_date' => $original['service_date'],
                'new_date' => $new['service_date'],
            ],
            'action_url' => "/customer/bookings/{$booking->booking_reference}",
            'priority' => 'high',
        ]);

        $this->sendEmail($customer->user->email, 'booking_rescheduled', [
            'booking' => $booking,
            'customer' => $customer,
            'item' => $item,
            'original' => $original,
            'new' => $new,
        ]);
    }

    public function sendPaymentConfirmation(Payment $payment): void
    {
        $customer = $payment->customer;

        $this->createInAppNotification($customer, [
            'type' => 'payment_confirmed',
            'title' => 'Payment Successful',
            'message' => "Payment of " . \App\Services\Currency\CurrencyService::format($payment->amount, $payment->currency) . " received for booking {$payment->booking->booking_reference}.",
            'data' => [
                'payment_id' => $payment->id,
                'payment_reference' => $payment->payment_reference,
                'booking_id' => $payment->booking_id,
            ],
            'action_url' => "/customer/bookings/{$payment->booking->booking_reference}",
            'priority' => 'high',
        ]);

        $this->sendEmail($customer->user->email, 'payment_receipt', [
            'payment' => $payment,
            'customer' => $customer,
        ]);
    }

    public function sendPaymentFailure(Payment $payment): void
    {
        $customer = $payment->customer;

        $this->createInAppNotification($customer, [
            'type' => 'payment_failed',
            'title' => 'Payment Failed',
            'message' => "Payment for booking {$payment->booking->booking_reference} could not be processed. Please retry.",
            'data' => [
                'payment_id' => $payment->id,
                'booking_id' => $payment->booking_id,
                'error' => $payment->failure_reason,
            ],
            'action_url' => "/checkout/payment/{$payment->id}",
            'priority' => 'urgent',
        ]);

        $this->sendEmail($customer->user->email, 'payment_failed', [
            'payment' => $payment,
            'customer' => $customer,
        ]);
    }

    public function sendRefundConfirmation(\App\Models\Refund $refund): void
    {
        $customer = $refund->customer;

        $this->createInAppNotification($customer, [
            'type' => 'refund_initiated',
            'title' => 'Refund Initiated',
            'message' => "Refund of " . \App\Services\Currency\CurrencyService::format($refund->requested_amount, $refund->currency) . " has been initiated for booking {$refund->booking->booking_reference}.",
            'data' => [
                'refund_id' => $refund->id,
                'refund_reference' => $refund->refund_reference,
                'booking_id' => $refund->booking_id,
            ],
            'action_url' => "/customer/bookings/{$refund->booking->booking_reference}",
            'priority' => 'high',
        ]);

        $this->sendEmail($customer->user->email, 'refund_initiated', [
            'refund' => $refund,
            'customer' => $customer,
        ]);
    }

    public function sendRefundCompleted(\App\Models\Refund $refund): void
    {
        $customer = $refund->customer;

        $this->createInAppNotification($customer, [
            'type' => 'refund_completed',
            'title' => 'Refund Completed',
            'message' => "Refund of " . \App\Services\Currency\CurrencyService::format($refund->processed_amount, $refund->currency) . " has been credited to your original payment method.",
            'data' => [
                'refund_id' => $refund->id,
                'refund_reference' => $refund->refund_reference,
                'booking_id' => $refund->booking_id,
            ],
            'action_url' => "/customer/bookings/{$refund->booking->booking_reference}",
            'priority' => 'high',
        ]);

        $this->sendEmail($customer->user->email, 'refund_completed', [
            'refund' => $refund,
            'customer' => $customer,
        ]);
    }

    public function sendTravelReminder(Booking $booking): void
    {
        $customer = $booking->customer;
        $upcomingItems = $booking->items()
            ->where('service_date', '>=', now())
            ->where('service_date', '<=', now()->addDays(1))
            ->whereIn('item_status', ['confirmed', 'partially_confirmed'])
            ->get();

        foreach ($upcomingItems as $item) {
            $this->createInAppNotification($customer, [
                'type' => 'travel_reminder',
                'title' => 'Upcoming Travel',
                'message' => "Your {$item->service_name} is tomorrow. Have a great trip!",
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'item_id' => $item->id,
                ],
                'action_url' => "/customer/bookings/{$booking->booking_reference}",
                'priority' => 'normal',
            ]);

            $this->sendEmail($customer->user->email, 'travel_reminder', [
                'booking' => $booking,
                'customer' => $customer,
                'item' => $item,
            ]);
        }
    }

    public function sendEventReminder(Booking $booking): void
    {
        $customer = $booking->customer;
        $eventItems = $booking->items()
            ->where('item_type', 'venue')
            ->where('service_date', '>=', now())
            ->where('service_date', '<=', now()->addDays(1))
            ->whereIn('item_status', ['confirmed', 'partially_confirmed'])
            ->get();

        foreach ($eventItems as $item) {
            $this->createInAppNotification($customer, [
                'type' => 'event_reminder',
                'title' => 'Event Tomorrow',
                'message' => "Your event at {$item->service_name} is tomorrow. We hope you have a wonderful celebration!",
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'item_id' => $item->id,
                ],
                'action_url' => "/customer/bookings/{$booking->booking_reference}",
                'priority' => 'high',
            ]);

            $this->sendEmail($customer->user->email, 'event_reminder', [
                'booking' => $booking,
                'customer' => $customer,
                'item' => $item,
            ]);
        }
    }

    public function sendCancellationDeadlineReminder(Booking $booking): void
    {
        $customer = $booking->customer;
        $itemsWithDeadline = $booking->items()
            ->whereNotNull('cancellation_policy')
            ->whereIn('item_status', ['confirmed', 'partially_confirmed'])
            ->get();

        foreach ($itemsWithDeadline as $item) {
            $policy = $item->cancellation_policy;
            if (isset($policy['free_cancellation_hours'])) {
                $deadline = \Carbon\Carbon::parse($item->service_date)->subHours($policy['free_cancellation_hours']);
                
                if ($deadline->isFuture() && $deadline->diffInHours(now()) <= 24) {
                    $this->createInAppNotification($customer, [
                        'type' => 'cancellation_deadline',
                        'title' => 'Free Cancellation Ending Soon',
                        'message' => "Free cancellation for {$item->service_name} ends in {$deadline->diffForHumans()}.",
                        'data' => [
                            'booking_id' => $booking->id,
                            'item_id' => $item->id,
                            'deadline' => $deadline->toISOString(),
                        ],
                        'action_url' => "/customer/bookings/{$booking->booking_reference}",
                        'priority' => 'high',
                    ]);
                }
            }
        }
    }

    public function sendAgentNotification(Agent $agent, array $data): void
    {
        $this->createInAppNotification($agent->user, [
            'type' => $data['type'] ?? 'agent_notification',
            'title' => $data['title'] ?? 'New Notification',
            'message' => $data['message'] ?? '',
            'data' => $data['data'] ?? [],
            'action_url' => $data['action_url'] ?? null,
            'priority' => $data['priority'] ?? 'normal',
        ], 'agent');

        if ($this->shouldSendEmail($agent->user, $data['type'] ?? '')) {
            $this->sendEmail($agent->user->email, 'agent_notification', array_merge($data, ['agent' => $agent]));
        }
    }

    public function sendAdminAlert(string $type, string $message, array $data = [], string $priority = 'normal'): void
    {
        $admins = Admin::where('is_active', true)->with('user')->get();

        foreach ($admins as $admin) {
            $this->createInAppNotification($admin->user, [
                'type' => "admin_{$type}",
                'title' => "Admin Alert: {$type}",
                'message' => $message,
                'data' => $data,
                'priority' => $priority,
            ], 'admin');

            if ($priority === 'critical' || $priority === 'urgent') {
                $this->sendEmail($admin->user->email, 'admin_alert', compact('type', 'message', 'data'));
            }
        }
    }

    public function sendWelcomeEmail(Customer $customer): void
    {
        $this->sendEmail($customer->user->email, 'welcome', [
            'customer' => $customer,
        ]);
    }

    public function sendEmailVerification(Customer $customer): void
    {
        $this->sendEmail($customer->user->email, 'verify_email', [
            'customer' => $customer,
            'verification_url' => url("/verify-email?token={$customer->user->email_verification_token}"),
        ]);
    }

    public function sendPasswordReset(Customer $customer, string $token): void
    {
        $this->sendEmail($customer->user->email, 'password_reset', [
            'customer' => $customer,
            'reset_url' => url("/reset-password?token={$token}"),
        ]);
    }

    protected function createInAppNotification($notifiable, array $data, string $type = 'customer'): Notification
    {
        $notification = Notification::create([
            'notifiable_type' => get_class($notifiable),
            'notifiable_id' => $notifiable->id,
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'channel' => 'in_app',
            'priority' => $data['priority'] ?? 'normal',
            'data' => $data['data'] ?? [],
            'action_url' => $data['action_url'] ?? null,
        ]);

        return $notification;
    }

    protected function sendEmail(string $email, string $templateKey, array $data): void
    {
        $template = EmailTemplate::where('key', $templateKey)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            // Use default template
            $this->sendDefaultEmail($email, $templateKey, $data);
            return;
        }

        // Queue email for sending
        Queue::push(function () use ($email, $template, $data) {
            Mail::to($email)->send(new \App\Mail\TemplateEmail($template, $data));
        });
    }

    protected function sendDefaultEmail(string $email, string $templateKey, array $data): void
    {
        $subjects = [
            'welcome' => 'Welcome to EventraOS!',
            'booking_confirmed' => 'Booking Confirmed - ' . ($data['booking']->booking_reference ?? ''),
            'booking_cancelled' => 'Booking Cancelled - ' . ($data['booking']->booking_reference ?? ''),
            'booking_rescheduled' => 'Booking Rescheduled - ' . ($data['booking']->booking_reference ?? ''),
            'payment_receipt' => 'Payment Receipt - ' . ($data['payment']->payment_reference ?? ''),
            'payment_failed' => 'Payment Failed - ' . ($data['booking']->booking_reference ?? ''),
            'refund_initiated' => 'Refund Initiated - ' . ($data['refund']->refund_reference ?? ''),
            'refund_completed' => 'Refund Completed - ' . ($data['refund']->refund_reference ?? ''),
            'travel_reminder' => 'Travel Reminder - ' . ($data['booking']->booking_reference ?? ''),
            'event_reminder' => 'Event Reminder - ' . ($data['booking']->booking_reference ?? ''),
            'verify_email' => 'Verify Your Email Address',
            'password_reset' => 'Reset Your Password',
            'agent_notification' => 'New Notification',
            'admin_alert' => 'Admin Alert: ' . ($data['type'] ?? ''),
        ];

        Queue::push(function () use ($email, $templateKey, $data, $subjects) {
            Mail::to($email)->send(new \App\Mail\DefaultEmail(
                $subjects[$templateKey] ?? 'EventraOS Notification',
                $templateKey,
                $data
            ));
        });
    }

    protected function sendSms(string $phone, string $message): void
    {
        // Implement SMS sending via provider (Twilio, MSG91, etc.)
        // Queue for async sending
        Queue::push(function () use ($phone, $message) {
            // SMS sending logic here
        });
    }

    protected function shouldSendSms(Customer $customer, string $type): bool
    {
        $preferences = $customer->communication_preferences ?? [];
        return $preferences['sms'][$type] ?? true;
    }

    protected function shouldSendEmail($user, string $type): bool
    {
        $preferences = $user->preferences['notifications']['email'] ?? true;
        return $preferences[$type] ?? true;
    }

    public function markAsRead(Notification $notification): void
    {
        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function markAllAsRead($notifiable): void
    {
        Notification::where('notifiable_type', get_class($notifiable))
            ->where('notifiable_id', $notifiable->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    public function getUnreadCount($notifiable): int
    {
        return Notification::where('notifiable_type', get_class($notifiable))
            ->where('notifiable_id', $notifiable->id)
            ->where('is_read', false)
            ->count();
    }

    public function getNotifications($notifiable, int $perPage = 20, string $status = null)
    {
        $query = Notification::where('notifiable_type', get_class($notifiable))
            ->where('notifiable_id', $notifiable->id)
            ->orderByDesc('created_at');

        if ($status === 'unread') {
            $query->where('is_read', false);
        } elseif ($status === 'read') {
            $query->where('is_read', true);
        }

        return $query->paginate($perPage);
    }
}