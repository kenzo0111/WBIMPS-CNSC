<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Spatie\Activitylog\Models\Activity as SpatieActivity;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        // Server-side pagination and filtering for activities
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = max(1, (int) $request->query('pageSize', $request->query('limit', 10)));
        $search = $request->query('search', null);
        $actorType = $request->query('actorType', $request->query('actor_type', null));
        $dateFrom = $request->query('date_from', $request->query('dateFrom', null));
        $dateTo = $request->query('date_to', $request->query('dateTo', null));

        $q = SpatieActivity::orderBy('created_at', 'desc');

        if ($search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('description', 'like', "%{$search}%");
                // Search raw JSON payload for textual content (best-effort)
                $sub->orWhereRaw("properties LIKE ?", ["%{$search}%"]);
            });
        }

        if ($actorType) {
            // Support passing short values like 'User' or fully-qualified model names
            if ($actorType === 'User')
                $actorType = 'App\\Models\\User';
            $q->where('causer_type', $actorType);
        }

        if ($dateFrom) {
            $q->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $q->whereDate('created_at', '<=', $dateTo);
        }

        $paginator = $q->paginate($pageSize, ['*'], 'page', $page);

        // Attach actor details (if user) to each item to simplify client rendering.
        $items = $paginator->getCollection();
        $userIds = $items->pluck('causer_id')->filter()->unique()->toArray();
        $usersMap = [];
        if (!empty($userIds)) {
            $users = \App\Models\User::whereIn('id', $userIds)->get(['id', 'name', 'email']);
            $usersMap = $users->keyBy('id')->toArray();
        }

        $result = $items->map(function ($item) use ($usersMap) {
            $arr = $item->toArray();
            $arr['actor'] = null;
            // Provide backwards-compatible keys (actor_type/actor_id, action/meta) for legacy clients
            $arr['actor_type'] = $arr['causer_type'] ?? null;
            $arr['actor_id'] = $arr['causer_id'] ?? null;
            $arr['action'] = $arr['description'] ?? null;
            $arr['sentence'] = $activity->sentence ?? ($arr['description'] ?? null);
            $arr['meta'] = $arr['properties'] ?? null;

            if (!empty($arr['actor_type']) && stripos($arr['actor_type'], 'user') !== false && !empty($arr['actor_id'])) {
                $user = $usersMap[$arr['actor_id']] ?? null;
                if ($user) {
                    $arr['actor'] = [
                        'id' => $user['id'],
                        'name' => $user['name'] ?? null,
                        'email' => $user['email'] ?? null,
                    ];
                }
            }
            return $arr;
        });

        return response()->json([
            'data' => $result,
            'meta' => [
                'page' => $paginator->currentPage(),
                'page_size' => $paginator->perPage(),
                'total' => $paginator->total(),
                'total_pages' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $activity = SpatieActivity::findOrFail($id);
        $arr = $activity->toArray();
        $arr['actor'] = null;
        // Map backwards-compatible keys
        $arr['actor_type'] = $arr['causer_type'] ?? null;
        $arr['actor_id'] = $arr['causer_id'] ?? null;
        $arr['action'] = $arr['description'] ?? null;
        $arr['sentence'] = $activity->sentence ?? ($arr['description'] ?? null);
        $arr['meta'] = $arr['properties'] ?? null;
        if (!empty($arr['actor_type']) && stripos($arr['actor_type'], 'user') !== false && !empty($arr['actor_id'])) {
            $user = \App\Models\User::find($arr['actor_id']);
            if ($user) {
                $arr['actor'] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ];
            }
        }
        return response()->json(['data' => $arr]);
    }

    /**
     * Create a new activity record (used by client-side events).
     */
    public function store(Request $request)
    {
        $payload = $request->validate([
            'action' => ['required', 'string', 'max:1024'],
            'meta' => ['nullable'],
        ]);

        $meta = is_array($payload['meta']) ? $payload['meta'] : ($payload['meta'] ?? null);
        $act = activity()->causedBy(Auth::user());
        if (!empty($meta)) {
            $act->withProperties($meta);
        }
        $activity = $act->log($payload['action']);

        $arr = $activity->toArray();
        $arr['actor'] = null;
        $arr['actor_type'] = $arr['causer_type'] ?? null;
        $arr['actor_id'] = $arr['causer_id'] ?? null;
        $arr['action'] = $arr['description'] ?? null;
        $arr['sentence'] = $activity->sentence ?? ($arr['description'] ?? null);
        $arr['meta'] = $arr['properties'] ?? null;
        if (!empty($arr['actor_type']) && stripos($arr['actor_type'], 'user') !== false && !empty($arr['actor_id'])) {
            $u = \App\Models\User::find($arr['actor_id']);
            if ($u) {
                $arr['actor'] = ['id' => $u->id, 'name' => $u->name ?? null, 'email' => $u->email ?? null];
            }
        }

        return response()->json(['data' => $arr], 201);
    }
}
