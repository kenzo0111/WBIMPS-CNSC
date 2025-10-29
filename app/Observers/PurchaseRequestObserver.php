<?php

namespace App\Observers;

use App\Mail\StatusChangedMail;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class PurchaseRequestObserver
{
    /**
     * Handle the PurchaseRequest "updated" event.
     *
     * @param  \App\Models\PurchaseRequest  $purchaseRequest
     * @return void
     */
    public function updated(PurchaseRequest $purchaseRequest)
    {
        // Only send email when status attribute changed
        if ($purchaseRequest->wasChanged('status')) {
            $old = $purchaseRequest->getOriginal('status');
            $new = $purchaseRequest->status;

            $modelName = 'Purchase Request';
            $modelId = $purchaseRequest->request_id ?? $purchaseRequest->id;
            $notes = $purchaseRequest->metadata['notes'] ?? null;

            $mail = new StatusChangedMail($modelName, $modelId, $old, $new, $notes);

            // Send to requester email if present
            if (!empty($purchaseRequest->email)) {
                try {
                    Mail::to($purchaseRequest->email)->send($mail);
                } catch (\Throwable $e) {
                    // Log but don't break
                    logger()->error('Failed sending status email to requester: '.$e->getMessage());
                }
            }

            // Also send to all admin users
            try {
                $admins = User::where('is_admin', true)->pluck('email')->filter()->unique()->toArray();
                foreach (array_chunk($admins, 50) as $batch) {
                    Mail::to($batch)->send($mail);
                }
            } catch (\Throwable $e) {
                logger()->error('Failed sending status email to admins: '.$e->getMessage());
            }
        }
    }
}