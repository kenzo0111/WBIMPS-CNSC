<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class PurchaseRequestIdGenerator
{
    /**
     * Return the next base request id for the given period (YYYY-MM).
     * The returned value is in the form: YYYY-MM-0001 (4-digit sequence)
     */
    public function nextBaseForPeriod(?string $period = null): string
    {
        $period = $period ?? now()->format('Y-m');

        // DB-agnostic approach: collect all request_ids for the period and pick the maximum
        $existingRequests = DB::table('purchase_requests')
            ->where('request_id', 'like', "{$period}-%")
            ->pluck('request_id');

        $maxSeq = 0;
        foreach ($existingRequests as $rid) {
            // Capture the first numeric segment immediately after the period: YYYY-MM-<seq>
            if (preg_match('/^' . preg_quote($period, '/') . '-(\d+)/', $rid, $m)) {
                $num = (int) $m[1];
                if ($num > $maxSeq) {
                    $maxSeq = $num;
                }
            }
        }

        $next = $maxSeq + 1;

        return sprintf('%s-%04d', $period, $next);
    }

    /**
     * Alias for nextBaseForPeriod to make intent clearer when requesting next sequential id.
     */
    public function nextForPeriod(?string $period = null): string
    {
        return $this->nextBaseForPeriod($period);
    }

    /**
     * Helper to format per-item suffixes (e.g., -01)
     */
    public function withItemSuffix(string $base, int $index): string
    {
        return $base . '-' . sprintf('%02d', $index);
    }
}
