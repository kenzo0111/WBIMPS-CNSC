# Code Snippets — moved

This document has been moved to a clearer location: `docs/guides/code-snippets.md`

---

## Authentication Module ✅

### 1) Login (backend)

File: `app/Http/Controllers/AccessController.php`

```php
// Authenticate request (email + password) and login
public function authenticate(Request $request): JsonResponse
{
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string', 'min:8'],
    ]);

    $user = User::where('email', $credentials['email'])->first();

    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        return response()->json(['message' => 'Invalid email or password.'], 422);
    }

    if ($user->status !== 'active') {
        return response()->json(['message' => 'Account is not activated.'], 422);
    }

    Auth::login($user, true);
    $request->session()->regenerate();

    // record activity
    Activity::create(['action' => 'User logged in: '.($user->email ?? $user->name)]);

    return response()->json(['message' => 'Login successful.', 'redirect' => route('admin.dashboard'), 'user' => [/* profile */]]);
}
```

Notes: The endpoint uses Laravel's Hash::check for verification and records a login activity record. Redirect after login is `route('admin.dashboard')` (role-aware UI can read user.role/is_admin for client logic).

### 2) Password hashing (registration / account setup / reset)

File: `app/Http/Controllers/AccountSetupController.php`, `app/Http/Controllers/PasswordResetController.php`

```php
// When creating/updating a user's password
$user->password = Hash::make($request->password);
$user->save();
```

Notes: Passwords use Laravel's Hash facade (bcrypt) — correct approach.

### 3) Role-based access / redirect

The project stores `role` and `is_admin` on `User` model: `app/Models/User.php`.

Example (login response frontend uses role/is_admin):

```php
'role' => data_get($user, 'role', 'Administrator'),
'is_admin' => (bool) data_get($user, 'is_admin', false),
```

Policies and authorization checks exist in `app/Policies/*` enforcing is_admin for privileged actions.

---

## Purchase Request (PR) Module ✅

### 1) Insert PR (server-side)

File: `app/Http/Controllers/Api/PurchaseRequestController.php` (store method)

```php
// Generate request_id like REQ-2025-001
$currentYear = now()->year;
$existingRequests = DB::table('purchase_requests')
    ->where('request_id', 'like', "REQ-{$currentYear}-%")
    ->pluck('request_id');

$maxNum = 0;
foreach ($existingRequests as $requestId) {
    if (preg_match('/REQ-\d{4}-(\d+)$/', $requestId, $matches)) {
        $num = (int) $matches[1];
        $maxNum = max($maxNum, $num);
    }
}
$nextSeq = $maxNum + 1;
$requestId = sprintf('REQ-%d-%03d', $currentYear, $nextSeq);

$pr = PurchaseRequest::create([... 'request_id' => $requestId, ...]);
```

Notes: Uses a brief retry loop to handle possible duplicate keys.

---

## Purchase Order (PO) Module ✅

### 1) Generate PO from approved PR (front-end + backend)

- Frontend: `resources/js/dashboard.js` — the UI supports creating a PO from an existing request by opening the PO modal with the PR id, pre-filling the form and then POSTing to the Purchase Order API.
- The API expects to receive `po_number`, `items`, and the form (ics/ris/par/iar) payloads.

Snippet (frontend shows how create POST payload is prepared):

```js
// prepare and POST to /api/purchase-orders
const payload = {
  po_number: '2025-11-001',
  supplier: 'ABC Supplier',
  items: [...],
  grand_total: 1234.00,
  ics_form_data: {...},
  ris_form_data: {...},
  par_form_data: {...},
  iar_form_data: {...}
}
fetch('/api/purchase-orders', { method: 'POST', body: JSON.stringify(payload) })
```

### 2) Auto-generate sequential PO number (server-side)

File: `app/Http/Controllers/Api/PurchaseOrderController.php`

```php
protected function generateSequentialPoNumber()
{
    $currentYear = now()->year;
    $currentMonth = now()->month;
    $prefix = "PO-{$currentYear}-" . str_pad($currentMonth, 2, '0', STR_PAD_LEFT) . "-";

    $latestPo = PurchaseOrder::where('po_number', 'like', $prefix . '%')->orderBy('po_number', 'desc')->first();

    if ($latestPo) {
        $lastNumber = (int) substr($latestPo->po_number, strlen($prefix));
        $nextNumber = $lastNumber + 1;
    } else {
        $nextNumber = 1;
    }

    return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
}
```

### 3) PO PDF Generation with DOMPDF (server-side)

File: `app/Http/Controllers/PurchaseOrderController.php`

```php
use Barryvdh\DomPDF\Facade\Pdf;

public function generatePDF(Request $request)
{
    $data = $request->all();
    $data['items'] = collect($request->input('items', []))->map(...)->all();
    $data['grand_total'] = collect($data['items'])->sum('amount');
    $pdf = Pdf::loadView('pdf.purchase_order_pdf', $data)->setPaper('a4', 'portrait');
    return $pdf->download('purchase_order.pdf');
}
```

Notes: There is also a `preview` and `downloadPDF` method which loads the model and streams/returns the PDF for saved POs.

---

## Inventory Module ✅

### 1) Add Item (server-side)

File: `app/Http/Controllers/Api/ItemController.php` (store method)

```php
$validated = $request->validate([
  'sku' => 'required|string|unique:items',
  'name' => 'required|string|max:255',
  'description' => 'nullable|string',
  'category_id' => 'nullable|exists:categories,id',
  'quantity' => 'integer|min:0',
  'unit' => 'nullable|string|max:50',
  'unit_cost' => 'numeric|min:0',
]);

$item = Item::create($validated);
```

Notes: Controller contains extra category-based validation (non-expendable/semi-expendable rules).

### 2) Low-stock detection endpoint (server-side)

File: `app/Http/Controllers/Api/ItemController.php`

```php
public function lowStock(Request $request)
{
    $threshold = $request->get('threshold', 20);
    $items = Item::where('quantity', '<=', $threshold)->orderBy('quantity', 'asc')->get();
    return response()->json(['data' => $items]);
}
```

### 3) Update quantity during issuance (Stock Out)

File: `app/Http/Controllers/Api/StockOutController.php`

```php
// Create stock out and decrement item quantity (enforced minimum allowed remaining stock)
$validated = $request->validate([... 'sku' => 'required|string|exists:items,sku', 'quantity' => 'required|integer|min:1', ...]);

$item = Item::where('sku', $validated['sku'])->first();
if ($item->quantity < $validated['quantity']) { return response()->json(['error' => 'Insufficient stock'], 400); }
$remaining = $item->quantity - $validated['quantity'];
if ($remaining <= 20) { return response()->json(['error' => "Cannot create stock out: remaining stock would be {$remaining}"], 422); }

DB::transaction(function () use ($validated, &$created) {
    $created = StockOut::create($validated);
    $item = Item::where('sku', $validated['sku'])->first();
    $item->decrement('quantity', $validated['quantity']);
});
```

Notes: Updating/deleting stock-out records will adjust item quantities accordingly (increment on delete, handle SKU changes on update).

---

## Asset Management Module (ICS, IAR, PAR) ✅

The system can create Inventory Custodian Slips (ICS), Requisition & Issue Slips (RIS), Property Acknowledgement Receipts (PAR), and Inspection & Acceptance Reports (IAR) during PO creation.

File: `app/Http/Controllers/Api/PurchaseOrderController.php`

### Insert Inventory Custodian Slip (ICS)

```php
// inside controller when creating PO
$ics = \App\Models\InventoryCustodianSlip::create([
    'purchase_order_id' => $purchaseOrder->id,
    'ics_no' => $formData['ics_no'],
    'entity_name' => $formData['entity_name'] ?? $purchaseOrder->entity_name,
    'items' => $icsItems,
    'grand_total' => $icsTotal,
    'status' => 'Active',
    // other fields
]);
```

### Insert Property Acknowledgement Receipt (PAR)

```php
$par = \App\Models\PropertyAcknowledgementReceipt::create([
    'purchase_order_id' => $purchaseOrder->id,
    'par_no' => $formData['par_no'],
    'items' => $parItems,
    'grand_total' => $parTotal,
    'status' => 'Active',
]);
```

### Insert Inspection and Acceptance Report (IAR)

```php
$iar = \App\Models\InspectionAcceptanceReport::create([
    'purchase_order_id' => $purchaseOrder->id,
    'iar_no' => $formData['iar_no'],
    'items' => $iarItems,
    'status' => 'Active',
    // and other fields
]);
```

Notes: These insertions all create records and log Activity::create entries for auditing.

---

## Notifications Module ✅

Two approaches exist in the codebase:

### 1) Frontend / client-side (local notifications)

File: `resources/js/dashboard.js`

```js
function createNotification({
  title = '',
  message = '',
  type = 'info',
  icon = 'bell',
  meta = {},
  silent = false,
} = {}) {
  const n = {
    id: generateNotificationId(),
    title,
    message,
    type,
    icon,
    read: false,
    timestamp: new Date().toISOString(),
    meta,
  }
  AppState.notifications = AppState.notifications || []
  AppState.notifications.unshift(n)
  saveNotifications() // persists to localStorage
  // optionally show browser notification
  return n
}

function saveNotifications() {
  localStorage.setItem(
    'AppNotifications',
    JSON.stringify(AppState.notifications)
  )
}
```

Notes: This is used widely by UI interactions to persist browser/local notifications. Server-side `NotificationController` exists but has empty methods (a placeholder): `app/Http/Controllers/Api/NotificationController.php`.

If you want server-side persistence you can implement the `store` method and use the model `App\Models\Notification` to persist and broadcast notifications.

---

## Activity Logs Module ✅

Insert logs across the app is performed with a simple, consistent pattern using `Activity::create()`.

Examples:

```php
// record login
Activity::create([
    'action' => 'User logged in: ' . ($user->email ?? $user->name ?? 'Unknown'),
    'meta' => json_encode(['user_id' => $user->id ?? null]),
]);

// record PO creation
Activity::create([
    'action' => 'Purchase Order Created',
    'meta' => json_encode(['po_number' => $purchaseOrder->po_number, 'total' => $purchaseOrder->grand_total]),
]);
```

The `Activity` model is `app/Models/Activity.php` and casts `meta` to array.

---

## Where these snippets appear

- Authentication: `app/Http/Controllers/AccessController.php`, `AccountSetupController.php`, `PasswordResetController.php`
- PR: `app/Http/Controllers/Api/PurchaseRequestController.php`
- PO: `app/Http/Controllers/Api/PurchaseOrderController.php` and `app/Http/Controllers/PurchaseOrderController.php` (PDF via DomPDF)
- Inventory: `app/Http/Controllers/Api/ItemController.php`, `Api/StockOutController.php`
- Assets: `app/Http/Controllers/Api/PurchaseOrderController.php` (creates ICS, RIS, PAR, IAR)
- Notifications: `resources/js/dashboard.js` (createNotification + local persistence) and placeholder `app/Http/Controllers/Api/NotificationController.php`
- Activities: App-wide `Activity::create()` calls (many controllers)

---

If you'd like, I can:

- Add server-side endpoints for inserting notifications and recording them to the `notifications` table (I can implement `NotificationController@store`), and/or
- Add unit tests/examples for these flows, or adapt the code snippets into documentation for APIs.

Tell me what you'd like next: add server-side notifications, create tests, or generate a small README for developers referencing these snippets.
