<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    /**
     * Proxy simple geocoding queries to Nominatim (OpenStreetMap).
     * This avoids CORS issues and allows setting a proper User-Agent.
     *
     * Query params:
     * - q: the search string (required)
     * - limit: optional (default 1)
     * - countrycodes: optional (default 'ph')
     */
    public function index(Request $request)
    {
        $q = (string) $request->query('q', '');
        if (trim($q) === '') {
            return response()->json([], 200);
        }

        $limit = (int) $request->query('limit', 1);
        $countrycodes = (string) $request->query('countrycodes', 'ph');

        // Simple cache key to reduce duplicate calls
        $cacheKey = 'geocode:' . md5($q . '|' . $limit . '|' . $countrycodes);
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json($cached);
        }

        // Include a User-Agent per Nominatim usage policy
        $userAgent = config('app.name') . ' (contact: ' . config('mail.from.address', 'no-reply@example.com') . ')';

        $url = 'https://nominatim.openstreetmap.org/search';
        try {
            $res = Http::withHeaders([
                'User-Agent' => $userAgent,
                'Accept' => 'application/json',
            ])->timeout(10)->get($url, [
                'format' => 'json',
                'limit' => $limit,
                'countrycodes' => $countrycodes,
                'addressdetails' => 1,
                'q' => $q,
            ]);

            if ($res->ok()) {
                $body = $res->json();
                // Cache short-term (30s)
                Cache::put($cacheKey, $body, 30);
                return response()->json($body);
            }

            return response()->json([], $res->status());
        } catch (\Throwable $e) {
            return response()->json([], 200);
        }
    }
}
