@component('mail::layout')
{{-- Header --}}
@slot('header')
@component('mail::header', ['url' => config('app.url')])
EventraOS
@endcomponent
@endslot

{{-- Body --}}
## {{ str($templateKey)->replace('_', ' ')->title() }}

@if ($templateKey === 'booking_confirmed' && isset($data['booking']))
Your booking **{{ $data['booking']->booking_reference }}** has been confirmed.

@foreach ($data['booking']->items ?? [] as $item)
- **{{ $item->service_name }}** — {{ ucfirst($item->item_status) }}
@endforeach

Total: {{ $data['booking']->currency }} {{ number_format((float) $data['booking']->grand_total, 2) }}
@elseif (isset($data['booking']))
Booking reference: **{{ $data['booking']->booking_reference }}**
@endif

Thank you for choosing EventraOS.

@slot('footer')
@component('mail::footer')
© {{ now()->format('Y') }} EventraOS. All rights reserved.
@endcomponent
@endslot
@endcomponent
