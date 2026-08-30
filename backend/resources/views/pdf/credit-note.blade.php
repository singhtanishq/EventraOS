<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Credit Note {{ $creditNote->credit_note_number ?? '' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #102a43; font-size: 13px; padding: 40px; }
        .header { display: table; width: 100%; margin-bottom: 32px; }
        .brand { display: table-cell; vertical-align: top; }
        .brand h1 { font-size: 24px; }
        .brand .tagline { color: #627d98; font-size: 12px; margin-top: 4px; }
        .meta { display: table-cell; vertical-align: top; text-align: right; }
        .meta h2 { font-size: 20px; color: #b45309; text-transform: uppercase; letter-spacing: 2px; }
        .meta .meta-row { margin-top: 6px; color: #486581; font-size: 12px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        table.items th { background: #78350f; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        table.items td { padding: 10px 12px; border-bottom: 1px solid #d9e2ec; font-size: 12px; }
        table.items td.num, table.items th.num { text-align: right; }
        .totals { display: table; width: 100%; }
        .totals-spacer { display: table-cell; width: 60%; }
        .totals-box { display: table-cell; width: 40%; vertical-align: top; }
        .totals-box .row { display: table; width: 100%; padding: 6px 0; }
        .totals-box .label { display: table-cell; color: #486581; font-size: 12px; }
        .totals-box .value { display: table-cell; text-align: right; font-size: 12px; }
        .totals-box .grand { border-top: 2px solid #102a43; margin-top: 8px; padding-top: 12px; font-weight: bold; }
        .totals-box .grand .label, .totals-box .grand .value { font-size: 15px; }
        .footer { margin-top: 48px; border-top: 1px solid #d9e2ec; padding-top: 16px; color: #627d98; font-size: 11px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">
            <h1>EventraOS</h1>
            <div class="tagline">Travel &bull; Stays &bull; Events &bull; Experiences</div>
        </div>
        <div class="meta">
            <h2>Credit Note</h2>
            <div class="meta-row"><strong>{{ $creditNote->credit_note_number ?? '' }}</strong></div>
            <div class="meta-row">Issued: {{ $creditNote->issued_at?->format('d M Y') ?? now()->format('d M Y') }}</div>
            @if (isset($invoice))
            <div class="meta-row">Against Invoice: {{ $invoice->invoice_number }}</div>
            @endif
        </div>
    </div>

    <div>
        <h4 style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#627d98; margin-bottom:8px;">Customer</h4>
        <div class="name">{{ $customer->user->name ?? $customer->name ?? 'Customer' }}</div>
        <div style="font-size:12px; color:#486581;">{{ $customer->user->email ?? '' }}</div>
    </div>

    <table class="items" style="margin-top:24px;">
        <thead>
            <tr>
                <th>Description</th>
                <th class="num">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $creditNote->reason ?? 'Refund credit' }}</td>
                <td class="num">{{ $creditNote->currency ?? 'INR' }} {{ number_format((float) ($creditNote->amount ?? $creditNote->total ?? 0), 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-spacer"></div>
        <div class="totals-box">
            <div class="row grand">
                <span class="label">Total Credit</span>
                <span class="value">{{ $creditNote->currency ?? 'INR' }} {{ number_format((float) ($creditNote->amount ?? $creditNote->total ?? 0), 2) }}</span>
            </div>
        </div>
    </div>

    <div class="footer">
        This credit note was generated automatically. &copy; {{ now()->format('Y') }} EventraOS. All rights reserved.
    </div>
</body>
</html>
