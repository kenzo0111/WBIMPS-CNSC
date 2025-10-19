<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PurchaseRequest;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        // Return latest requests, optionally filtered by department or status
        $q = PurchaseRequest::query();
        if ($request->has('department') && $request->department !== 'All') {
            $q->where('department', $request->department);
        }
        if ($request->has('status') && $request->status !== 'All') {
            $q->where('status', $request->status);
        }

        $results = $q->orderBy('submitted_at', 'desc')->get();
        return response()->json($results);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'requester' => 'required|string',
            'department' => 'required|string',
            'items' => 'required',
            'unit' => 'nullable|string',
            'neededDate' => 'nullable|date',
            'priority' => 'nullable|string',
        ]);

        // Accept items as string or array; normalize to array
        $items = $data['items'];
        if (!is_array($items)) {
            // split lines as simple heuristic, or keep as single item
            $items = preg_split('/\r?\n/', $items);
            $items = array_values(array_filter(array_map('trim', $items)));
        }

        $currentYear = now()->year;

        // Determine the next sequence number for the current year by inspecting
        // existing request_id values of the form "REQ-<year>-<nnn>". Using
        // MAX on the numeric suffix reduces the chance of duplicates compared
        // to a simple total count. We still guard against a race by retrying
        // on duplicate key errors.
        $maxNum = DB::table('purchase_requests')
            ->where('request_id', 'like', "REQ-{$currentYear}-%")
            ->select(DB::raw("MAX(CAST(SUBSTRING_INDEX(request_id, '-', -1) AS UNSIGNED)) as maxnum"))
            ->value('maxnum');

        $nextSeq = ($maxNum ? (int) $maxNum + 1 : 1);

        $pr = null;
        $attempts = 0;
        $maxAttempts = 5;

        while (is_null($pr) && $attempts < $maxAttempts) {
            $requestId = sprintf('REQ-%d-%03d', $currentYear, $nextSeq);
            try {
                $pr = PurchaseRequest::create([
            'request_id' => $requestId,
            'email' => $data['email'],
            'requester' => $data['requester'],
            'department' => $data['department'],
            'items' => $items,
            'unit' => $data['unit'] ?? null,
            'needed_date' => $data['neededDate'] ?? null,
            'priority' => $data['priority'] ?? 'Low',
            'status' => 'Incoming',
            'submitted_at' => now(),
            'metadata' => [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ],
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                // If there's a duplicate key for request_id, bump the sequence and retry.
                $sqlState = $e->getCode();
                if ($sqlState === '23000' || strpos($e->getMessage(), 'Duplicate') !== false) {
                    $nextSeq++;
                    $attempts++;
                    continue;
                }
                // rethrow unexpected DB errors
                throw $e;
            }
        }

        if (is_null($pr)) {
            return response()->json(['error' => 'Could not create purchase request, please try again'], 500);
        }

        // Send notification emails: to requester and to admins
        $emailSent = false;
        try {
            $admins = \App\Models\User::where('is_admin', true)->pluck('email')->filter()->toArray();
            // send to requester
            \Illuminate\Support\Facades\Mail::to($pr->email)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
            // send to admins (if any)
            if (!empty($admins)) {
                \Illuminate\Support\Facades\Mail::to($admins)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
            }
            $emailSent = true;
        } catch (\Exception $e) {
            // If the failure looks like an OpenSSL certificate verification error, try a single insecure fallback
            \Illuminate\Support\Facades\Log::error('Failed sending purchase request submitted email: '.$e->getMessage());
            $msg = $e->getMessage();
            if (stripos($msg, 'certificate verify failed') !== false || stripos($msg, 'stream_socket_enable_crypto') !== false || stripos($msg, 'STARTTLS') !== false) {
                try {
                    \Illuminate\Support\Facades\Log::warning('Attempting insecure SMTP retry (verify_peer=false) due to TLS certificate verification failure');
                    // set runtime stream options for smtp mailer to bypass peer verification (development only)
                    config(['mail.mailers.smtp.stream' => [
                        'ssl' => [
                            'allow_self_signed' => true,
                            'verify_peer' => false,
                            'verify_peer_name' => false,
                        ],
                    ]]);

                    // retry send once
                    \Illuminate\Support\Facades\Mail::to($pr->email)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
                    if (!empty($admins)) {
                        \Illuminate\Support\Facades\Mail::to($admins)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
                    }
                    $emailSent = true;
                    \Illuminate\Support\Facades\Log::warning('Insecure SMTP retry succeeded (email sent)');
                } catch (\Exception $e2) {
                    \Illuminate\Support\Facades\Log::error('Insecure SMTP retry failed: '.$e2->getMessage());
                    $emailSent = false;
                }
            } else {
                $emailSent = false;
            }
        }

        return response()->json(array_merge($pr->toArray(), ['email_sent' => $emailSent]), 201);
    }
}
