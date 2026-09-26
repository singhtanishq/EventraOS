<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TemplateEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public EmailTemplate $template,
        public array $data = []
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->data['subject'] ?? $this->template->subject ?? 'EventraOS Notification',
        );
    }

    public function content(): Content
    {
        $body = $this->template->body_html ?? $this->template->body ?? null;

        // Render simple {{ placeholder }} substitutions against the data
        if (is_string($body)) {
            foreach ($this->data as $key => $value) {
                if (is_scalar($value)) {
                    $body = str_replace('{{ ' . $key . ' }}', (string) $value, $body);
                    $body = str_replace('{{' . $key . '}}', (string) $value, $body);
                }
            }
        }

        return new Content(
            htmlString: $body ?? view('emails.default', [
                'templateKey' => $this->template->key ?? 'notification',
                'data' => $this->data,
            ])->render(),
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
