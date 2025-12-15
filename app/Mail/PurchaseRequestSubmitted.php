<?php

namespace App\Mail;

use App\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PurchaseRequestSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    /** @var PurchaseRequest */
    public $pr;

    /** @var \Illuminate\Database\Eloquent\Collection|null */
    public $batchItems;

    /**
     * Create a new message instance.
     */
    public function __construct(PurchaseRequest $pr, $batchItems = null)
    {
        $this->pr = $pr;
        $this->batchItems = $batchItems;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $subject = sprintf('New Purchase Request submitted: %s', $this->pr->request_id ?? $this->pr->id);
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

        return $this->subject($subject)
            ->view('emails.request_submitted')
            ->with([
                'pr' => $this->pr,
                'logoCid' => $logoCid,
                'batchItems' => $this->batchItems,
                // keep logoUrl available as a fallback for clients that block inline images
                'logoUrl' => asset('images/UCN1.png'),
            ]);
    }
}
