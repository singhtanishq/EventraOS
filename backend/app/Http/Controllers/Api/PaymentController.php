<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Booking;
use App\Services\Payment\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function initiate(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:bookings,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'customer_payment_method_id' => 'sometimes|exists:customer_payment_methods,id',
            'idempotency_key' => 'sometimes|string',
            'metadata' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $booking = Booking::findOrFail($validator->validated()['booking_id']);
        
        if ($booking->customer_id !== $customer->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $paymentMethod = \App\Models\PaymentMethod::findOrFail($validator->validated()['payment_method_id']);
        $customerPaymentMethod = null;
        
        if ($request->has('customer_payment_method_id')) {
            $customerPaymentMethod = \App\Models\CustomerPaymentMethod::findOrFail($request->customer_payment_method_id);
            if ($customerPaymentMethod->customer_id !== $customer->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid payment method',
                ], 422);
            }
        }

        try {
            $payment = $this->paymentService->initiatePayment(
                $booking,
                $customer,
                $paymentMethod,
                $customerPaymentMethod,
                $validator->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment initiated',
                'data' => $payment,
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initiate payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function process(Request $request, Payment $payment)
    {
        $user = $request->user();
        $customer = $user->customer;

        if ($payment->customer_id !== $customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Payment cannot be processed in current state',
            ], 422);
        }

        try {
            $processedPayment = $this->paymentService->processPayment($payment);

            return response()->json([
                'success' => true,
                'message' => $processedPayment->isSuccessful() ? 'Payment successful' : 'Payment failed',
                'data' => $processedPayment,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function retry(Request $request, Payment $payment)
    {
        $user = $request->user();
        $customer = $user->customer;

        if ($payment->customer_id !== $customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        try {
            $retryPayment = $this->paymentService->retryPayment($payment);

            return response()->json([
                'success' => true,
                'message' => 'Payment retry initiated',
                'data' => $retryPayment,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retry payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function capture(Request $request, Payment $payment)
    {
        $user = $request->user();
        
        if (!$user->hasRole('admin') && !$user->hasRole('agent')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        try {
            $capturedPayment = $this->paymentService->capturePayment($payment);

            return response()->json([
                'success' => true,
                'message' => 'Payment captured successfully',
                'data' => $capturedPayment,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to capture payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function refund(Request $request, Payment $payment)
    {
        $user = $request->user();
        $customer = $user->customer;

        // Customers can only request refunds for their own payments
        if ($user->hasRole('customer') && $payment->customer_id !== $customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Admins and agents can process refunds
        if (!$user->hasRole('admin') && !$user->hasRole('agent')) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins and agents can process refunds',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'sometimes|numeric|min:0.01|max:' . $payment->getRemainingRefundableAmount(),
            'reason' => 'required|in:cancellation,schedule_change,service_not_provided,quality_issue,duplicate_charge,fraud,customer_request,admin_adjustment,other',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $refund = $this->paymentService->refundPayment(
                $payment,
                $request->amount,
                $request->reason
            );

            return response()->json([
                'success' => true,
                'message' => 'Refund processed',
                'data' => $refund,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process refund: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function status(Request $request, Payment $payment)
    {
        $user = $request->user();
        $customer = $user->customer;

        if ($user->hasRole('customer') && $payment->customer_id !== $customer?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $payment->load(['attempts', 'refunds', 'booking']);

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }

    public function webhook(Request $request, string $providerCode)
    {
        $result = $this->paymentService->handleWebhook($providerCode, $request->all());

        return response()->json($result);
    }

    public function methods(Request $request)
    {
        $currency = $request->get('currency', 'INR');
        $country = $request->get('country', 'IN');

        $methods = $this->paymentService->getAvailablePaymentMethods($currency, $country);

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }

    public function customerMethods(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found',
            ], 404);
        }

        $methods = $this->paymentService->getPaymentMethodsForCustomer($customer);

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }
}