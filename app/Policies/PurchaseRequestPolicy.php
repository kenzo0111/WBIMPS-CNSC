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
        // Users can view their own purchase requests or admins can view all
        return $user->is_admin === true || (int) $purchaseRequest->requested_by === $user->id;
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
        // Users can update their own pending requests or admins can update any
        return ($user->id === (int) $purchaseRequest->requested_by && $purchaseRequest->status === 'pending')
            || $user->is_admin === true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Only admins or the requester (if pending) can delete
        return $user->is_admin === true
            || ($user->id === (int) $purchaseRequest->requested_by && $purchaseRequest->status === 'pending');
    }

    /**
     * Determine whether the user can approve the purchase request.
     */
    public function approve(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Admins and Supply Officers can approve pending purchase requests
        return ($user->is_admin === true || $user->isSupplyOfficer()) && $purchaseRequest->status === 'pending';
    }

    /**
     * Determine whether the user can reject the purchase request.
     */
    public function reject(User $user, PurchaseRequest $purchaseRequest): bool
    {
        // Admins and Supply Officers can reject pending purchase requests
        return ($user->is_admin === true || $user->isSupplyOfficer()) && $purchaseRequest->status === 'pending';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->is_admin === true || $user->isSupplyOfficer();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->is_admin === true || $user->isSupplyOfficer();
    }
}
