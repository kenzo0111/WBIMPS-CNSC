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
        return $this->subject("{$this->modelName} status changed: {$this->newStatus}")
            ->view('emails.status_changed')
            ->with([
                'modelName' => $this->modelName,
                'modelId' => $this->modelId,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
                'notes' => $this->notes,
            ]);
    }
}
