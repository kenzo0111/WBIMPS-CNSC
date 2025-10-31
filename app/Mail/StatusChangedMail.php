<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $modelName;
    public $modelId;
    public $oldStatus;
    public $newStatus;
    public $notes;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(string $modelName, $modelId, ?string $oldStatus, string $newStatus, ?string $notes = null)
    {
        $this->modelName = $modelName;
        $this->modelId = $modelId;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->notes = $notes;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // Attempt to embed a local logo so it appears inline in email clients.
        $logoCid = null;
        $logoPath = public_path('images/UCN1.png');
        if (file_exists($logoPath)) {
            try {
                // embed() returns a CID string like "cid:..." that can be used as img src
                $logoCid = $this->embed($logoPath);
            } catch (\Throwable $e) {
                // ignore embed failures and fall back to public asset URL in the view
                $logoCid = null;
            }
        }

        return $this->subject("{$this->modelName} status changed: {$this->newStatus}")
            ->view('emails.status_changed')
            ->with([
                'modelName' => $this->modelName,
                'modelId' => $this->modelId,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
                'notes' => $this->notes,
                'logoCid' => $logoCid,
                'logoUrl' => asset('images/UCN1.png'),
            ]);
    }
}
