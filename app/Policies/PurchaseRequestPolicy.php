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
        return $user->isAdmin() || (int) $purchaseRequest->requested_by === $user->id;
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
        if ($user->id === (int) $purchaseRequest->requested_by && $purchaseRequest->status === 'pending') {
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
        if ($user->id === (int) $purchaseRequest->requested_by && $purchaseRequest->status === 'pending') {
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
}
