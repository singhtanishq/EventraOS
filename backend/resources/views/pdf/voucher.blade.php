<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Booking Voucher {{ $booking->booking_reference }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #102a43; font-size: 13px; padding: 40px; }
        .header { display: table; width: 100%; margin-bottom: 32px; }
        .brand { display: table-cell; vertical-align: top; }
        .brand h1 { font-size: 24px; color: #102a43; }
        .brand .tagline { color: #627d98; font-size: 12px; margin-top: 4px; }
        .voucher-meta { display: table-cell; vertical-align: top; text-align: right; }
        .voucher-meta h2 { font-size: 20px; color: #486581; text-transform: uppercase; letter-spacing: 2px; }
        .voucher-meta .meta-row { margin-top: 6px; color: #486581; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-top: 8px; background: #dbeafe; color: #1e40af; text-transform: uppercase; }
        .reference-box { background: #102a43; color: #ffffff; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 28px; }
        .reference-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9fb3c8; }
        .reference-box .ref { font-size: 26px; font-weight: bold; letter-spacing: 4px; margin-top: 6px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        table.items th { background: #f0f4f8; color: #334e68; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #d9e2ec; }
        table.items td { padding: 10px 12px; border-bottom: 1px solid #d9e2ec; font-size: 12px; vertical-align: top; }
        .travelers { margin-bottom: 24px; }
        .travelers h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #627d98; margin-bottom: 8px; }
        .travelers ul { list-style: none; }
        .travelers li { font-size: 12px; padding: 4px 0; color: #334e68; }
        .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 12px; color: #78350f; }
        .footer { margin-top: 40px; border-top: 1px solid #d9e2ec; padding-top: 16px; color: #627d98; font-size: 11px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">
            <h1>EventraOS</h1>
            <div class="tagline">Travel &bull; Stays &bull; Events &bull; Experiences</div>
        </div>
        <div class="voucher-meta">
            <h2>Voucher</h2>
            <div class="meta-row">Issued: {{ now()->format('d M Y, H:i') }}</div>
            <span class="badge">{{ strtoupper($booking->status) }}</span>
        </div>
    </div>

    <div class="reference-box">
        <div class="label">Booking Reference</div>
        <div class="ref">{{ $booking->booking_reference }}</div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Service</th>
                <th>Type</th>
                <th>Status</th>
                <th>Confirmation #</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($booking->items as $item)
            <tr>
                <td><strong>{{ $item->service_name }}</strong></td>
                <td>{{ ucfirst($item->item_type) }}</td>
                <td>{{ ucfirst($item->item_status) }}</td>
                <td>{{ $item->provider_confirmation_number ?? '&mdash;' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="travelers">
        <h4>Lead Traveler</h4>
        <ul>
            @forelse ($booking->items as $item)
                @foreach ($item->guests->take(1) as $guest)
                <li>{{ $guest->first_name }} {{ $guest->last_name }} &mdash; {{ $guest->email }}</li>
                @endforeach
            @empty
                <li>{{ $booking->customer->user->name ?? 'Guest' }} &mdash; {{ $booking->customer->user->email ?? '' }}</li>
            @endforelse
        </ul>
    </div>

    <div class="notes">
        <strong>Important:</strong> Please carry a valid government-issued photo ID for all travelers.
        Present this voucher (printed or digital) at check-in / boarding.
        For assistance 24/7: support@eventraos.com
    </div>

    <div class="footer">
        &copy; {{ now()->format('Y') }} EventraOS. All rights reserved. Generated automatically &mdash; no signature required.
    </div>
</body>
</html>
