<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;

class VerifyCsrfToken extends BaseVerifier
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        'purchase-request/generate',
        'purchase-order/generate',
        'inspection-acceptance-report/generate',
        'inventory-custodian-slip/generate',
        'requisition-issue-slip/generate',
        'reports/rsmi/export',
        // API-style endpoints served under web middleware for AJAX calls
        // Exclude all /api/* endpoints from CSRF verification when accessed via session-authenticated web routes
        'api/*',
    ];
}
