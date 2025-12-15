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

        $existingRequests = DB::table('purchase_requests')
            ->where('request_id', 'like', "$period-%")
            ->pluck('request_id');

        $maxNum = 0;
        foreach ($existingRequests as $requestId) {
            if (preg_match('/\d{4}-\d{2}-(\d+)$/', $requestId, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextSeq = $maxNum + 1;

        return sprintf('%s-%04d', $period, $nextSeq);
    }

    /**
     * Helper to format per-item suffixes (e.g., -01)
     */
    public function withItemSuffix(string $base, int $index): string
    {
        return $base . '-' . sprintf('%02d', $index);
    }
}
