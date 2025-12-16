<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Supplier;
use App\Models\PurchaseRequest;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = (string) $request->get('q', '');
        $qTrim = trim($q);
        if ($qTrim === '') {
            return response()->json([]);
        }

        $like = '%' . $qTrim . '%';

        // Items
        $items = Item::query()
            ->where('name', 'like', $like)
            ->orWhere('sku', 'like', $like)
            ->orWhere('id', 'like', $like)
            ->select('id', 'name', 'sku')
            ->limit(8)
            ->get()
            ->map(function ($i) {
                return [
                    'type' => 'item',
                    'id' => $i->id,
                    'label' => $i->name ?: (string) $i->id,
                    'meta' => $i->sku ?? '',
                ];
            })
            ->toArray();

        // Suppliers
        $suppliers = Supplier::query()
            ->where('name', 'like', $like)
            ->orWhere('email', 'like', $like)
            ->select('id', 'name', 'address', 'email')
            ->limit(6)
            ->get()
            ->map(function ($s) {
                return [
                    'type' => 'supplier',
                    'id' => $s->id,
                    'label' => $s->name ?: $s->email,
                    'meta' => $s->address ?: $s->email ?: '',
                ];
            })
            ->toArray();

        // Purchase Requests
        $requests = PurchaseRequest::query()
            ->where('request_id', 'like', $like)
            ->orWhere('id', 'like', $like)
            ->orWhere('requester', 'like', $like)
            ->orWhere('department', 'like', $like)
            ->select('id', 'request_id', 'requester', 'status')
            ->limit(6)
            ->get()
            ->map(function ($r) {
                return [
                    'type' => 'request',
                    'id' => $r->id,
                    'label' => $r->request_id ?: (string) $r->id,
                    'meta' => $r->status ?: $r->requester ?: '',
                ];
            })
            ->toArray();

        // Activities (Spatie)
        $activities = Activity::query()
            ->where('description', 'like', $like)
            ->orWhere('subject_type', 'like', $like)
            ->orWhere('causer_type', 'like', $like)
            ->select('id', 'description', 'causer_type', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get()
            ->map(function ($a) {
                return [
                    'type' => 'activity',
                    'id' => $a->id,
                    'label' => $a->description ?: '',
                    'meta' => $a->causer_type ?: '',
                ];
            })
            ->toArray();

        $results = array_values(array_merge($items, $suppliers, $requests, $activities));

        // Deduplicate by type+id/label
        $seen = [];
        $out = [];
        foreach ($results as $r) {
            $key = ($r['type'] ?? '') . ':' . ($r['id'] ?? $r['label'] ?? '');
            if (isset($seen[$key]))
                continue;
            $seen[$key] = true;
            $out[] = $r;
            if (count($out) >= 12)
                break;
        }

        return response()->json($out);
    }
}
