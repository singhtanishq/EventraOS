<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #102a43; font-size: 13px; padding: 40px; }
        .header { display: table; width: 100%; margin-bottom: 32px; }
        .brand { display: table-cell; vertical-align: top; }
        .brand h1 { font-size: 24px; color: #102a43; }
        .brand .tagline { color: #627d98; font-size: 12px; margin-top: 4px; }
        .invoice-meta { display: table-cell; vertical-align: top; text-align: right; }
        .invoice-meta h2 { font-size: 20px; color: #486581; text-transform: uppercase; letter-spacing: 2px; }
        .invoice-meta .meta-row { margin-top: 6px; color: #486581; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-top: 8px; background: #dcfce7; color: #166534; text-transform: uppercase; }
        .parties { display: table; width: 100%; margin-bottom: 28px; }
        .party { display: table-cell; width: 50%; vertical-align: top; padding: 14px; background: #f0f4f8; border-radius: 8px; }
        .party h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #627d98; margin-bottom: 8px; }
        .party .name { font-weight: bold; font-size: 14px; }
        .party div { font-size: 12px; color: #486581; line-height: 1.6; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        table.items th { background: #102a43; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        table.items td { padding: 10px 12px; border-bottom: 1px solid #d9e2ec; font-size: 12px; }
        table.items td.num, table.items th.num { text-align: right; }
        .totals { display: table; width: 100%; }
        .totals-spacer { display: table-cell; width: 60%; }
        .totals-box { display: table-cell; width: 40%; vertical-align: top; }
        .totals-box .row { display: table; width: 100%; padding: 6px 0; }
        .totals-box .label { display: table-cell; color: #486581; font-size: 12px; }
        .totals-box .value { display: table-cell; text-align: right; font-size: 12px; }
        .totals-box .grand { border-top: 2px solid #102a43; margin-top: 8px; padding-top: 12px; font-weight: bold; }
        .totals-box .grand .label, .totals-box .grand .value { font-size: 15px; color: #102a43; }
        .footer { margin-top: 48px; border-top: 1px solid #d9e2ec; padding-top: 16px; color: #627d98; font-size: 11px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">
            <h1>EventraOS</h1>
            <div class="tagline">Travel &bull; Stays &bull; Events &bull; Experiences</div>
        </div>
        <div class="invoice-meta">
            <h2>Invoice</h2>
            <div class="meta-row"><strong>{{ $invoice->invoice_number }}</strong></div>
            <div class="meta-row">Issued: {{ $invoice->issued_at?->format('d M Y') ?? now()->format('d M Y') }}</div>
            <div class="meta-row">Booking: {{ $booking->booking_reference }}</div>
            <span class="badge">{{ strtoupper($invoice->status) }}</span>
        </div>
    </div>

    <div class="parties">
        <div class="party">
            <h4>Billed To</h4>
            <div class="name">{{ $customer->user->name ?? $customer->name ?? 'Customer' }}</div>
            <div>{{ $customer->user->email ?? '' }}</div>
            <div>{{ data_get($invoice->billing_details, 'address') ?? '' }}</div>
        </div>
        <div class="party">
            <h4>Booking Details</h4>
            <div class="name">Booking Reference</div>
            <div>{{ $booking->booking_reference }}</div>
            <div>Status: {{ ucfirst($booking->status) }}</div>
            <div>Payment: {{ ucfirst(str_replace('_', ' ', $booking->payment_status)) }}</div>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Description</th>
                <th class="num">Qty</th>
                <th class="num">Unit Price</th>
                <th class="num">Tax</th>
                <th class="num">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->line_items as $item)
            <tr>
                <td>{{ $item['description'] }}</td>
                <td class="num">{{ $item['quantity'] }}</td>
                <td class="num">{{ $invoice->currency }} {{ number_format((float) $item['unit_price'], 2) }}</td>
                <td class="num">{{ $invoice->currency }} {{ number_format((float) ($item['tax_amount'] ?? 0), 2) }}</td>
                <td class="num">{{ $invoice->currency }} {{ number_format((float) $item['total'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-spacer"></div>
        <div class="totals-box">
            <div class="row"><span class="label">Subtotal</span><span class="value">{{ $invoice->currency }} {{ number_format((float) $invoice->subtotal, 2) }}</span></div>
            <div class="row"><span class="label">Tax</span><span class="value">{{ $invoice->currency }} {{ number_format((float) $invoice->tax_total, 2) }}</span></div>
            @if ((float) $invoice->discount_total > 0)
            <div class="row"><span class="label">Discount</span><span class="value">-{{ $invoice->currency }} {{ number_format((float) $invoice->discount_total, 2) }}</span></div>
            @endif
            <div class="row grand"><span class="label">Grand Total</span><span class="value">{{ $invoice->currency }} {{ number_format((float) $invoice->grand_total, 2) }}</span></div>
        </div>
    </div>

    <div class="footer">
        Thank you for choosing EventraOS. This invoice was generated automatically.<br>
        For support, contact us at support@eventraos.com &bull; &copy; {{ now()->format('Y') }} EventraOS. All rights reserved.
    </div>
</body>
</html>
