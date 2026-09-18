<?php

namespace App\Services\PDF;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Invoice;
use App\Models\Booking;
use App\Models\CreditNote;
use Illuminate\Support\Facades\Storage;

class PDFService
{
    public function generateInvoice(Invoice $invoice): string
    {
        $booking = $invoice->booking;
        $customer = $invoice->customer;

        $html = view('pdf.invoice', compact('invoice', 'booking', 'customer'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "invoice-{$invoice->invoice_number}.pdf";
        $path = "invoices/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateInvoiceStream(Invoice $invoice): \Barryvdh\DomPDF\PDF
    {
        $booking = $invoice->booking;
        $customer = $invoice->customer;

        $html = view('pdf.invoice', compact('invoice', 'booking', 'customer'))->render();
        
        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);
    }

    public function generateVoucher(Booking $booking): string
    {
        $customer = $booking->customer;

        $html = view('pdf.voucher', compact('booking', 'customer'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "voucher-{$booking->booking_reference}.pdf";
        $path = "vouchers/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateVoucherStream(Booking $booking): \Barryvdh\DomPDF\PDF
    {
        $customer = $booking->customer;

        $html = view('pdf.voucher', compact('booking', 'customer'))->render();
        
        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);
    }

    public function generateCreditNote(CreditNote $creditNote): string
    {
        $invoice = $creditNote->invoice;
        $customer = $creditNote->customer;

        $html = view('pdf.credit-note', compact('creditNote', 'invoice', 'customer'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "credit-note-{$creditNote->credit_note_number}.pdf";
        $path = "credit-notes/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateItinerary(Booking $booking): string
    {
        $customer = $booking->customer;

        $html = view('pdf.itinerary', compact('booking', 'customer'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "itinerary-{$booking->booking_reference}.pdf";
        $path = "itineraries/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateTicket(BookingItem $item): string
    {
        $booking = $item->booking;
        $customer = $booking->customer;

        $html = view('pdf.ticket', compact('item', 'booking', 'customer'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "ticket-{$item->uuid}.pdf";
        $path = "tickets/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateEventPass(Booking $booking): string
    {
        $customer = $booking->customer;
        $eventItem = $booking->items()->where('item_type', 'venue')->first();

        $html = view('pdf.event-pass', compact('booking', 'customer', 'eventItem'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "event-pass-{$booking->booking_reference}.pdf";
        $path = "event-passes/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateBookingSummary(Booking $booking): string
    {
        $customer = $booking->customer;

        $html = view('pdf.booking-summary', compact('booking', 'customer'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "booking-summary-{$booking->booking_reference}.pdf";
        $path = "booking-summaries/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateAgentCommissionReport(\App\Models\Agent $agent, \Carbon\Carbon $startDate, \Carbon\Carbon $endDate): string
    {
        $commissions = $agent->commissions()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('booking', 'bookingItem')
            ->get();

        $summary = [
            'total_bookings' => $commissions->count(),
            'total_commission' => $commissions->sum('commission_amount'),
            'total_net_commission' => $commissions->sum('net_commission'),
            'pending' => $commissions->where('status', 'pending')->sum('net_commission'),
            'eligible' => $commissions->where('status', 'eligible')->sum('net_commission'),
            'paid' => $commissions->where('status', 'paid')->sum('net_commission'),
        ];

        $html = view('pdf.agent-commission-report', compact('agent', 'commissions', 'summary', 'startDate', 'endDate'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "commission-report-{$agent->agent_number}-{$startDate->format('Ymd')}-{$endDate->format('Ymd')}.pdf";
        $path = "reports/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function generateAdminReport(string $reportType, array $data, \Carbon\Carbon $startDate, \Carbon\Carbon $endDate): string
    {
        $html = view("pdf.admin-reports.{$reportType}", compact('data', 'startDate', 'endDate'))->render();
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "admin-report-{$reportType}-{$startDate->format('Ymd')}-{$endDate->format('Ymd')}.pdf";
        $path = "reports/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    public function mergePDFs(array $paths): string
    {
        // For merging multiple PDFs, we'd use a different library like spatie/pdf-merger
        // This is a placeholder
        $mergedPath = "merged-" . Str::random(10) . ".pdf";
        
        // Implementation would use spatie/pdf-merger
        // $merger = \Spatie\PdfMerger\PdfMerger::create();
        // foreach ($paths as $path) {
        //     $merger->addFile(Storage::disk('public')->path($path));
        // }
        // $merger->merge()->save(Storage::disk('public')->path($mergedPath));
        
        return $mergedPath;
    }

    public function addWatermark(string $sourcePath, string $watermarkText, string $outputPath): void
    {
        // Add watermark to PDF
        // Implementation would use a library that supports watermarking
    }

    public function protectPDF(string $sourcePath, string $outputPath, string $userPassword = '', string $ownerPassword = ''): void
    {
        // Add password protection to PDF
        // Implementation would use a library that supports PDF encryption
    }
}