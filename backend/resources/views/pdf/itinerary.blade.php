<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Itinerary {{ $booking->booking_reference }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #102a43; font-size: 13px; padding: 40px; }
        .header { display: table; width: 100%; margin-bottom: 32px; }
        .brand { display: table-cell; vertical-align: top; }
        .brand h1 { font-size: 24px; }
        .brand .tagline { color: #627d98; font-size: 12px; margin-top: 4px; }
        .meta { display: table-cell; vertical-align: top; text-align: right; }
        .meta h2 { font-size: 20px; color: #486581; text-transform: uppercase; letter-spacing: 2px; }
        .meta .meta-row { margin-top: 6px; color: #486581; font-size: 12px; }
        .reference-box { background: #102a43; color: #ffffff; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 28px; }
        .reference-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9fb3c8; }
        .reference-box .ref { font-size: 24px; font-weight: bold; letter-spacing: 4px; margin-top: 6px; }
        .timeline { margin-bottom: 28px; }
        .timeline-item { display: table; width: 100%; margin-bottom: 14px; }
        .timeline-marker { display: table-cell; width: 34px; vertical-align: top; }
        .timeline-marker .dot { width: 12px; height: 12px; border-radius: 6px; background: #102a43; margin: 4px auto; }
        .timeline-content { display: table-cell; vertical-align: top; border-left: 2px solid #d9e2ec; padding-left: 16px; padding-bottom: 10px; }
        .timeline-content .date { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #627d98; }
        .timeline-content .title { font-weight: bold; font-size: 14px; margin-top: 2px; }
        .timeline-content .desc { font-size: 12px; color: #486581; margin-top: 2px; }
        .footer { margin-top: 40px; border-top: 1px solid #d9e2ec; padding-top: 16px; color: #627d98; font-size: 11px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">
            <h1>EventraOS</h1>
            <div class="tagline">Travel &bull; Stays &bull; Events &bull; Experiences</div>
        </div>
        <div class="meta">
            <h2>Itinerary</h2>
            <div class="meta-row">Generated: {{ now()->format('d M Y') }}</div>
        </div>
    </div>

    <div class="reference-box">
        <div class="label">Booking Reference</div>
        <div class="ref">{{ $booking->booking_reference }}</div>
    </div>

    <div class="timeline">
        @foreach ($booking->items as $item)
        <div class="timeline-item">
            <div class="timeline-marker"><div class="dot"></div></div>
            <div class="timeline-content">
                <div class="date">
                    {{ $item->service_date?->format('d M Y') ?? data_get($item->configuration, 'check_in', 'Date on request') }}
                    @if ($item->service_end_date)
                    &ndash; {{ $item->service_end_date->format('d M Y') }}
                    @endif
                </div>
                <div class="title">{{ ucfirst($item->item_type) }}: {{ $item->service_name }}</div>
                <div class="desc">
                    Status: {{ ucfirst($item->item_status) }}
                    @if (data_get($item->configuration, 'rooms')) &bull; {{ data_get($item->configuration, 'rooms') }} room(s) @endif
                    @if ($item->guests->count()) &bull; {{ $item->guests->count() }} traveler(s) @endif
                </div>
            </div>
        </div>
        @endforeach
    </div>

    <div class="footer">
        &copy; {{ now()->format('Y') }} EventraOS. All rights reserved. For support: support@eventraos.com
    </div>
</body>
</html>
