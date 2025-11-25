<?php

namespace App\Policies;

use App\Models\PurchaseRequest;
use App\Models\User;

class PurchaseRequestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Users can view their own purchase requests or admins can view all.
        // The PurchaseRequest model stores requester information as `email` and/or `requester` (name).
        // Some installations may include a numeric `requester_id` column — support that as well.
        return $user->isAdmin() || $this->isOwnedByUser($user, $purchaseRequest);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // All authenticated users can create purchase requests
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Users can update their own pending requests or users with 'manage requests' permission
        if ($this->isOwnedByUser($user, $purchaseRequest) && $purchaseRequest->status === 'pending') {
            return true;
        }

        return $user->hasPermissionTo('manage requests') || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Only the requester (if pending) or users with 'manage requests' permission can delete
        if ($this->isOwnedByUser($user, $purchaseRequest) && $purchaseRequest->status === 'pending') {
            return true;
        }

        return $user->hasPermissionTo('manage requests') || $user->isAdmin();
    }

    /**
     * Determine whether the user can approve the purchase request.
     */
    public function approve(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Users with 'manage requests' permission can approve pending requests
        return ($user->hasPermissionTo('manage requests') || $user->isAdmin()) && $purchaseRequest->status === 'pending';
    }

    /**
     * Determine whether the user can reject the purchase request.
     */
    public function reject(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Users with 'manage requests' permission can reject pending requests
        return ($user->hasPermissionTo('manage requests') || $user->isAdmin()) && $purchaseRequest->status === 'pending';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->hasPermissionTo('manage requests') || $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->hasPermissionTo('manage requests') || $user->isAdmin();
    }

    /**
     * Check whether a purchase request belongs to the given user.
     *
     * This tries multiple strategies since older code stores the requester's
     * name in `requester` or their email in `email`. Some installs might
     * include a numeric `requester_id` as well.
     */
    private function isOwnedByUser(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Prefer a direct numeric foreign key (if present)
        if (isset($purchaseRequest->requester_id) && (int) $purchaseRequest->requester_id === (int) $user->id) {
            return true;
        }

        // Match by email when available
        if (
            !empty($purchaseRequest->email) && !empty($user->email)
            && strcasecmp(trim($purchaseRequest->email), trim($user->email)) === 0
        ) {
            return true;
        }

        // Lastly, match by name if the request stores the requester's name
        if (
            !empty($purchaseRequest->requester) && !empty($user->name)
            && strcasecmp(trim($purchaseRequest->requester), trim($user->name)) === 0
        ) {
            return true;
        }

        return false;
    }
}
