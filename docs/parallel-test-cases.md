````markdown
# Parallel Test Cases — SupplySystem (All System Features)

This file contains test case mappings covering all system features present in SupplySystem. Each entry maps a test scenario to its corresponding `tests/Feature` file and is organized for parallel execution.

Test Case ID Feature Test Scenario Pre-conditions Test Steps Expected Result Type Test File

---

## Per-Feature Test Cases

### Authentication

| Test Case ID | Scenario         | Pre-conditions | Test Steps                                   | Expected Result                                        | Type                | Test File                                       |
| ------------ | ---------------- | -------------- | -------------------------------------------- | ------------------------------------------------------ | ------------------- | ----------------------------------------------- |
| AUTH-001     | Login Success    | User exists    | 1. POST `/login` with valid credentials      | Response 200 / redirect; user authenticated            | Security (Parallel) | tests/Feature/AuthenticationTest.php (existing) |
| AUTH-002     | Login Failure    | User exists    | 1. POST `/login` with invalid credentials    | Response 422/validation error or error message         | Security (Parallel) | tests/Feature/AuthenticationTest.php (existing) |
| AUTH-003     | Rate Limit Block | User exists    | 1. Attempt >5 login attempts within 1 minute | Requests throttled; 429 response or rate limit message | Security (Parallel) | tests/Feature/AuthenticationTest.php (existing) |
| AUTH-004     | Logout           | Authenticated  | 1. POST `/logout` after login                | Session invalidated; redirect to login page or 200     | Security (Parallel) | tests/Feature/AuthenticationTest.php (existing) |

### Account Setup

| Test Case ID | Scenario             | Pre-conditions                             | Test Steps                                                 | Expected Result                             | Type                  | Test File                                                    |
| ------------ | -------------------- | ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------- | --------------------- | ------------------------------------------------------------ |
| ACC-001      | Accept Account Setup | Unconfigured invited user with valid token | 1. Visit `/account/setup/{token}` 2. Submit form 3. Log in | Account activated; can login                | Functional (Parallel) | tests/Feature/AccountSetup/AccountSetupTest.php (scaffolded) |
| ACC-002      | Invalid Token        | Invalid or expired token                   | 1. Visit `/account/setup/{invalid_token}` 2. Submit form   | Error message; form rejected; no activation | Negative (Parallel)   | tests/Feature/AccountSetup/AccountSetupTest.php (scaffolded) |

### Password Reset

| Test Case ID | Scenario              | Pre-conditions              | Test Steps                                                           | Expected Result                                     | Type                | Test File                                                      |
| ------------ | --------------------- | --------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- | ------------------- | -------------------------------------------------------------- |
| PW-001       | Request Reset         | User exists                 | 1. POST `/forgot-password` 2. Receive token via email                | Reset token sent to email; 200 response             | Security (Parallel) | tests/Feature/PasswordReset/PasswordResetTest.php (scaffolded) |
| PW-002       | Perform Reset         | Valid reset token           | 1. POST `/reset-password` with token & new password 2. Attempt login | Password updated; login succeeds                    | Security (Parallel) | tests/Feature/PasswordReset/PasswordResetTest.php (scaffolded) |
| PW-003       | Expired/Invalid Token | Expired/invalid reset token | 1. POST `/reset-password` with expired/invalid token                 | 400/422 response; password unchanged; error message | Negative (Parallel) | tests/Feature/PasswordReset/PasswordResetTest.php (scaffolded) |

### Users API

| Test Case ID | Scenario           | Pre-conditions               | Test Steps                                      | Expected Result                             | Type                   | Test File                                            |
| ------------ | ------------------ | ---------------------------- | ----------------------------------------------- | ------------------------------------------- | ---------------------- | ---------------------------------------------------- |
| USER-001     | Create User        | Admin account; valid payload | 1. POST `/api/users` with payload               | 201 created; user returned                  | Integration (Parallel) | tests/Feature/Api/ApiUserCreateTest.php (existing)   |
| USER-002     | Update User & Role | Admin account; user exists   | 1. PATCH `/api/users/{id}`; update role & perms | 200; roles updated and permissions enforced | Integration (Parallel) | tests/Feature/Api/ApiUserUpdateTest.php (existing)   |
| USER-003     | Delete User        | Admin account; user exists   | 1. DELETE `/api/users/{id}`                     | 204; user removed and cannot login          | Integration (Parallel) | tests/Feature/Api/ApiUserDeleteTest.php (scaffolded) |

### Roles & Permissions

| Test Case ID | Scenario             | Pre-conditions                   | Test Steps                                            | Expected Result                               | Type                   | Test File                                                                                     |
| ------------ | -------------------- | -------------------------------- | ----------------------------------------------------- | --------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| ROLE-001     | Create & Assign Role | Admin account; permissions exist | 1. Create role 2. Assign permission 3. Attempt access | Role/permission applied; unauthorized blocked | Integration (Parallel) | tests/Feature/RolePermissionTest.php / tests/Feature/DynamicRolePermissionTest.php (existing) |
| ROLE-002     | Unauthorized Access  | Non-admin user; no permission    | 1. Attempt to access admin-only route                 | 403 Forbidden or redirect; access denied      | Security (Parallel)    | tests/Feature/RolePermissionTest.php (existing)                                               |

### Categories

| Test Case ID | Scenario           | Pre-conditions               | Test Steps                                  | Expected Result                         | Type                   | Test File                                        |
| ------------ | ------------------ | ---------------------------- | ------------------------------------------- | --------------------------------------- | ---------------------- | ------------------------------------------------ |
| CAT-001      | CRUD Category      | Admin token; valid payload   | 1. POST / GET / PATCH / DELETE              | CRUD success; valid responses           | Integration (Parallel) | tests/Feature/Api/CategoryApiTest.php (existing) |
| CAT-002      | Validation Failure | Admin token; invalid payload | 1. POST `/api/categories` with invalid data | 422 validation errors; create prevented | Negative (Parallel)    | tests/Feature/Api/CategoryApiTest.php (existing) |

### Items

| Test Case ID | Scenario               | Pre-conditions                  | Test Steps                                        | Expected Result                              | Type                   | Test File                                    |
| ------------ | ---------------------- | ------------------------------- | ------------------------------------------------- | -------------------------------------------- | ---------------------- | -------------------------------------------- |
| ITEM-001     | CRUD Items             | Admin token; valid item payload | 1. POST / GET / PATCH / DELETE 2. Check low stock | CRUD success; low-stock endpoint lists items | Integration (Parallel) | tests/Feature/Api/ItemApiTest.php (existing) |
| ITEM-002     | Duplicate SKU Rejected | Admin token; existing SKU       | 1. POST `/api/items` with existing SKU            | 422 validation error; item not created       | Negative (Parallel)    | tests/Feature/Api/ItemApiTest.php (existing) |

### Suppliers

| Test Case ID | Scenario                    | Pre-conditions                      | Test Steps                                 | Expected Result                         | Type                   | Test File                                        |
| ------------ | --------------------------- | ----------------------------------- | ------------------------------------------ | --------------------------------------- | ---------------------- | ------------------------------------------------ |
| SUP-001      | Supplier CRUD               | Admin token; valid supplier payload | 1. POST / GET / PATCH / DELETE             | CRUD success; validations enforced      | Integration (Parallel) | tests/Feature/Api/SupplierApiTest.php (existing) |
| SUP-002      | Supplier Validation Failure | Admin token; invalid payload        | 1. POST `/api/suppliers` with invalid data | 422 validation errors; create prevented | Negative (Parallel)    | tests/Feature/Api/SupplierApiTest.php (existing) |

### Stock In/Out & Inventory

| Test Case ID | Scenario             | Pre-conditions              | Test Steps                                                          | Expected Result                                           | Type                   | Test File                                                                                                                    |
| ------------ | -------------------- | --------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| STOCK-001    | Stock-In & Stock-Out | Item exists; qty > 0        | 1. POST stock-in 2. POST stock-out                                  | Inventory updated; activities recorded; no negative stock | Integration (Parallel) | tests/Feature/Api/StockApiTest.php, tests/Feature/StockInActivityTest.php, tests/Feature/StockOutActivityTest.php (existing) |
| STOCK-002    | Stock Audit Recorded | Stock-in/stock-out occurred | 1. Perform stock-in 2. Trigger stock audit (or check activity list) | Audit activity recorded for the stock change              | Integration (Parallel) | tests/Feature/StockAuditTest.php (scaffolded)                                                                                |

### Activity Logs

| Test Case ID | Scenario                   | Pre-conditions         | Test Steps                             | Expected Result                                | Type                   | Test File                                                                            |
| ------------ | -------------------------- | ---------------------- | -------------------------------------- | ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| ACT-001      | Create & Filter Activities | Activity model present | 1. POST activity 2. GET with filters   | Activity stored; filters return results        | Integration (Parallel) | tests/Feature/ActivityApiTest.php, tests/Feature/ActivitySentenceTest.php (existing) |
| ACT-002      | Actor & Timestamp Present  | Activity exists        | 1. POST activity 2. GET activity by ID | Activity contains actor, timestamp and subject | Integration (Parallel) | tests/Feature/ActivityApiTest.php (existing)                                         |

### Support Tickets

| Test Case ID | Scenario                      | Pre-conditions                          | Test Steps                                                 | Expected Result                                  | Type                   | Test File                                         |
| ------------ | ----------------------------- | --------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ | ---------------------- | ------------------------------------------------- |
| SUPPORT-001  | Create Ticket with Attachment | Authenticated user; attachments allowed | 1. POST support ticket 2. POST attachment 3. Update status | Ticket created, attachment saved, status updated | Integration (Parallel) | tests/Feature/Api/SupportApiTest.php (scaffolded) |
| SUPPORT-002  | View Ticket & Comments        | Authenticated user; existing ticket     | 1. GET `/support-tickets/{id}` 2. GET comments             | 200; ticket details and comments returned        | Integration (Parallel) | tests/Feature/Api/SupportApiTest.php (scaffolded) |

### Site Content

| Test Case ID | Scenario                     | Pre-conditions | Test Steps                                               | Expected Result                  | Type                   | Test File                                             |
| ------------ | ---------------------------- | -------------- | -------------------------------------------------------- | -------------------------------- | ---------------------- | ----------------------------------------------------- |
| SITE-001     | Get & Update Site Content    | Admin token    | 1. GET `/api/site-contents/{key}` 2. PUT updated content | Content updated & returned       | Integration (Parallel) | tests/Feature/Api/SiteContentApiTest.php (scaffolded) |
| SITE-002     | Unauthorized Update Rejected | Non-admin user | 1. PUT `/api/site-contents/{key}` as non-admin           | 403 Forbidden; content unchanged | Security (Parallel)    | tests/Feature/Api/SiteContentApiTest.php (scaffolded) |

### Purchase Request

| Test Case ID | Scenario                       | Pre-conditions                       | Test Steps                                                  | Expected Result                      | Type                   | Test File                                                                  |
| ------------ | ------------------------------ | ------------------------------------ | ----------------------------------------------------------- | ------------------------------------ | ---------------------- | -------------------------------------------------------------------------- |
| PR-001       | Create PR (API)                | API token; items exist               | 1. POST `/api/purchase-requests` with items                 | 201 created; PR stored with items    | Integration (Parallel) | tests/Feature/Api/PurchaseRequestApiTest.php (existing)                    |
| PR-002       | Create PR (UI)                 | Authenticated requester; items exist | 1. Navigate UI 2. Fill & submit form                        | PR created and appears in user list  | Functional (Parallel)  | tests/Feature/PurchaseRequest/CreatePurchaseRequestUITest.php (scaffolded) |
| PR-003       | Validate PR Required Fields    | Authenticated user                   | 1. Submit with missing fields                               | Validation messages; 422 response    | Negative (Parallel)    | tests/Feature/Api/PurchaseRequestApiTest.php (existing)                    |
| PR-004       | Generate PR PDF                | PR exists                            | 1. POST generate or GET preview                             | PDF content correct                  | Functional (Parallel)  | tests/Feature/PurchaseRequestPdfGenerationTest.php (existing)              |
| PR-005       | PR Status change notifications | PR exists; approvers exist           | 1. Update status 2. Assert notifications                    | Mail queued; notifications recorded  | Integration (Parallel) | tests/Feature/Notifications/PurchaseRequestSubmittedTest.php (scaffolded)  |
| PR-006       | Update PR & Items              | PR exists; requester                 | 1. PATCH `/purchase-requests/{id}` to change items/quantity | 200; PR updated; totals recalculated | Functional (Parallel)  | tests/Feature/Api/PurchaseRequestApiTest.php (existing)                    |

### Purchase Order

| Test Case ID | Scenario                             | Pre-conditions                     | Test Steps                                                  | Expected Result                            | Type                   | Test File                                                                                                             |
| ------------ | ------------------------------------ | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| PO-001       | Create PO (API)                      | API token for PO user; items exist | 1. POST `/api/purchase-orders`                              | 201 created; PO returned with items/totals | Integration (Parallel) | tests/Feature/Api/PurchaseOrderApiTest.php (existing)                                                                 |
| PO-002       | Create PO from PR (UI)               | Approved PR exists                 | 1. From PR, create PO; add supplier/costs                   | PO created; items carried                  | Functional (Parallel)  | tests/Feature/PurchaseOrder/CreatePurchaseOrderFromPRTest.php (scaffolded)                                            |
| PO-003       | Update PO to Received & Inventory    | PO with items                      | 1. Update PO status to received 2. Validate inventory & IAR | Inventory updated; IAR created             | Functional (Parallel)  | tests/Feature/Api/PurchaseOrderApiTest.php & tests/Feature/PurchaseOrder/POStatusInventoryUpdateTest.php (scaffolded) |
| PO-004       | Generate PO PDF                      | PO exists                          | 1. GET /purchase-order/{id}/pdf                             | PDF contains PO details                    | Functional (Parallel)  | tests/Feature/PurchaseOrder/PurchaseOrderPdfGenerationTest.php (scaffolded)                                           |
| PO-005       | Cancel PO Prevents Inventory Updates | PO exists; not received            | 1. POST `/purchase-orders/{id}/status` with cancelled       | 200; PO cancelled; inventory not affected  | Functional (Parallel)  | tests/Feature/Api/PurchaseOrderApiTest.php (existing)                                                                 |

### Inventory Custodian Slip (IAR)

| Test Case ID | Scenario                   | Pre-conditions             | Test Steps                                                                 | Expected Result                                    | Type                  | Test File                                                                                                                             |
| ------------ | -------------------------- | -------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| IAR-001      | Generate IAR for PO        | Received PO; items present | 1. Create IAR from PO 2. Fill custodian 3. Generate PDF                    | IAR created and PDF valid                          | Functional (Parallel) | tests/Feature/Api/PurchaseOrderApiTest.php (existing assertions), tests/Feature/Inventory/InventoryCustodianSlipTest.php (scaffolded) |
| IAR-002      | Edit IAR Updates Custodian | IAR exists                 | 1. PATCH `/inventory-custodian-slip/{id}` change custodian 2. Generate PDF | 200; custodian updated; PDF reflects new custodian | Functional (Parallel) | tests/Feature/Inventory/InventoryCustodianSlipTest.php (scaffolded)                                                                   |

### Property Acknowledgement Receipt (PAR)

| Test Case ID | Scenario                  | Pre-conditions          | Test Steps                                                    | Expected Result                            | Type                  | Test File                                                             |
| ------------ | ------------------------- | ----------------------- | ------------------------------------------------------------- | ------------------------------------------ | --------------------- | --------------------------------------------------------------------- |
| PAR-001      | Create PAR & Generate PDF | Items received/assigned | 1. Create PAR 2. Generate PDF                                 | PAR created; PDF valid                     | Functional (Parallel) | tests/Feature/PAR/PropertyAcknowledgementReceiptTest.php (scaffolded) |
| PAR-002      | Reassign/Change Custodian | PAR exists              | 1. PATCH `/property-acknowledgement-receipt/{id}` change user | 200; PAR updated; asset assignment updated | Functional (Parallel) | tests/Feature/PAR/PropertyAcknowledgementReceiptTest.php (scaffolded) |

### Inspection Acceptance Report

| Test Case ID | Scenario                               | Pre-conditions              | Test Steps                           | Expected Result                         | Type                  | Test File                                                   |
| ------------ | -------------------------------------- | --------------------------- | ------------------------------------ | --------------------------------------- | --------------------- | ----------------------------------------------------------- |
| IAR-002      | Generate IAR/Inspection Acceptance PDF | Received PO with inspection | 1. Create inspection 2. Generate PDF | PDF contains inspection results & items | Functional (Parallel) | tests/Feature/InspectionAcceptanceReportTest.php (existing) |

### Requisition Issue Slip (RIS)

| Test Case ID | Scenario                  | Pre-conditions                    | Test Steps                                      | Expected Result                                    | Type                  | Test File                                                                                                                            |
| ------------ | ------------------------- | --------------------------------- | ----------------------------------------------- | -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| RIS-001      | Create RIS & Generate PDF | Items available; requester exists | 1. POST /requisition-issue-slip 2. Generate PDF | RIS created; inventory decremented; PDF valid      | Functional (Parallel) | tests/Feature/Api/PurchaseOrderApiTest.php (existing RIS asserts), tests/Feature/RequisitionIssueSlip/CreateRISTest.php (scaffolded) |
| RIS-002      | Cancel/Update RIS         | RIS exists; not yet issued        | 1. POST/DELETE to cancel RIS                    | 200; RIS cancelled; inventory adjustments reversed | Functional (Parallel) | tests/Feature/RequisitionIssueSlip/UpdateOrCancelRISTest.php (scaffolded)                                                            |

### Notifications

| Test Case ID | Scenario                      | Pre-conditions                | Test Steps                                              | Expected Result                                 | Type                   | Test File                                                                                                                                     |
| ------------ | ----------------------------- | ----------------------------- | ------------------------------------------------------- | ----------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| NOTIF-001    | Notification on Status Change | PR/PO exists; mail configured | 1. Change status on PR/PO 2. Assert Mail & Notification | Mail queued; notification record created        | Integration (Parallel) | tests/Feature/Notifications/PurchaseRequestSubmittedTest.php (scaffolded), tests/Feature/Notifications/StatusChangedMailTest.php (scaffolded) |
| NOTIF-002    | Notification Read/Unread      | Notification exists           | 1. GET notifications list 2. POST read status           | 200; notification read/unread toggled correctly | Integration (Parallel) | tests/Feature/Notifications/NotificationReadStatusTest.php (scaffolded)                                                                       |

### PDF Generation

| Test Case ID | Scenario             | Pre-conditions         | Test Steps                                          | Expected Result                     | Type                   | Test File                                                                                                                                  |
| ------------ | -------------------- | ---------------------- | --------------------------------------------------- | ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| PDF-001      | PR/PO PDF Generation | PR/PO exist            | 1. Generate or preview PDF 2. Validate content      | PDF includes correct fields & items | Performance (Parallel) | tests/Feature/PurchaseRequestPdfGenerationTest.php (existing), tests/Feature/PurchaseOrder/PurchaseOrderPdfGenerationTest.php (scaffolded) |
| PDF-002      | Bulk PDF Generation  | Multiple PRs/POs exist | 1. Trigger bulk PDF generation 2. Validate each PDF | All generated PDFs are valid        | Performance (Parallel) | tests/Feature/PDF/BulkPdfGenerationTest.php (scaffolded)                                                                                   |

### Geocoding

| Test Case ID | Scenario                 | Pre-conditions             | Test Steps                                          | Expected Result                                                          | Type                   | Test File                                                        |
| ------------ | ------------------------ | -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------- |
| SITE-002     | Geocode Proxy Endpoint   | Geocode service configured | 1. GET `/api/geocode?address=` 2. Validate response | API proxies geocode and returns normalized result                        | Integration (Parallel) | tests/Feature/Api/Geocode/GeocodeControllerTest.php (scaffolded) |
| SITE-003     | Invalid Address Handling | Geocode service configured | 1. GET `/api/geocode?address=not-a-real-address`    | 200 with empty results or 422/400 depending on validation; safe response | Negative (Parallel)    | tests/Feature/Api/Geocode/GeocodeControllerTest.php (scaffolded) |

---

## Notes & Recommendations

- The document now presents per-feature tables with clear, table-formatted test cases to simplify mapping and parallel execution.
- Existing tests are referenced where available; scaffolded tests are listed and grouped by feature for easier implementation.
- When running tests in parallel, ensure DB isolation using the `RefreshDatabase` trait, or unique DB per worker, and avoid shared global state.

Scaffolded placeholder tests (grouped by feature)

- Account Setup: `tests/Feature/AccountSetup/AccountSetupTest.php`
- Password Reset: `tests/Feature/PasswordReset/PasswordResetTest.php`
- Support API: `tests/Feature/Api/SupportApiTest.php`
- Site Content API: `tests/Feature/Api/SiteContentApiTest.php`
- Purchase Request: `tests/Feature/PurchaseRequest/CreatePurchaseRequestUITest.php`
- Purchase Order UI: `tests/Feature/PurchaseOrder/CreatePurchaseOrderFromPRTest.php`
- Purchase Order inventory flow: `tests/Feature/PurchaseOrder/POStatusInventoryUpdateTest.php`
- Purchase Order PDF: `tests/Feature/PurchaseOrder/PurchaseOrderPdfGenerationTest.php`
- Inventory Custodian Slip: `tests/Feature/Inventory/InventoryCustodianSlipTest.php`
- Property Acknowledgement Receipt: `tests/Feature/PAR/PropertyAcknowledgementReceiptTest.php`
- Requisition Issue Slip: `tests/Feature/RequisitionIssueSlip/CreateRISTest.php`
- Notifications: `tests/Feature/Notifications/StatusChangedMailTest.php`
- PDF Bulk: `tests/Feature/PDF/BulkPdfGenerationTest.php`
- Geocode: `tests/Feature/Api/Geocode/GeocodeControllerTest.php`

Suggested parallel run commands

```bash
./vendor/bin/pest --parallel
./vendor/bin/paratest --processes=4 --path=tests/Feature
php artisan test --parallel
```
````

---

## Notes & Recommendations

- The above table covers the system feature surface that the application exposes via API and UI. It includes API resources (Categories, Items, Suppliers, Stock In/Out, Users, Roles) and document generation flows (PR, PO, IAR, PAR, RIS, Inspection Acceptance Reports).
- Existing tests are referenced where available; missing or UI-specific flows are scaffolded as test placeholders to be implemented.
- When running tests in parallel, ensure DB isolation using the `RefreshDatabase` trait, or unique DB per worker, and avoid shared global state like localStorage or filesystem artifacts.
- Some features (Admin Dashboard UI, Support attachments, Site content updates) are primarily UI-based — consider using Laravel Dusk or similar to validate them if exact UI flows are required.

Suggested parallel run commands

```bash
# Pest parallel
./vendor/bin/pest --parallel
# PHPUnit + Paratest (example 4 workers)
./vendor/bin/paratest --processes=4 --path=tests/Feature
# Laravel artisan test (may use Pest or PHPUnit based on setup)
php artisan test --parallel
```

If you want, I can now:

- Create/implement real tests for the scaffolded placeholders (PR UI flow, PO UI flow, IAR/RIS UI assertions, StatusChangedMail, Support API, Site Content).
- Convert the mapping into a CSV for QA import.
- Add CI steps to run only these system feature tests in parallel and restrict PR test matrix to this file.

Scaffolded placeholder tests (proposed)

- `tests/Feature/AccountSetup/AccountSetupTest.php`
- `tests/Feature/PasswordReset/PasswordResetTest.php`
- `tests/Feature/Api/SupportApiTest.php`
- `tests/Feature/Api/SiteContentApiTest.php`
- `tests/Feature/PurchaseRequest/CreatePurchaseRequestUITest.php`
- `tests/Feature/PurchaseOrder/CreatePurchaseOrderFromPRTest.php`
- `tests/Feature/PurchaseOrder/POStatusInventoryUpdateTest.php`
- `tests/Feature/PurchaseOrder/PurchaseOrderPdfGenerationTest.php`
- `tests/Feature/Inventory/InventoryCustodianSlipTest.php`
- `tests/Feature/PAR/PropertyAcknowledgementReceiptTest.php`
- `tests/Feature/RequisitionIssueSlip/CreateRISTest.php`
- `tests/Feature/Notifications/StatusChangedMailTest.php`
- `tests/Feature/PDF/BulkPdfGenerationTest.php`
- `tests/Feature/Api/Geocode/GeocodeControllerTest.php`

Tip: The placeholder tests can be scaffolded using the existing `php artisan make:test` / Pest generator or copied from existing minimal tests in the `tests/Feature` directory to follow the same style and helper usage.

````
# Parallel Test Cases — SupplySystem (System Features Only)

This file contains test case mappings focused only on the system features of SupplySystem. Each entry maps a test scenario to its corresponding `tests/Feature` file and is organized for parallel execution.

Test Case ID Feature Test Scenario Pre-conditions Test Steps Expected Result Type Test File

---

## Master Feature Summary

| Test Case ID | Feature          | Test Scenario                                                 | Pre-conditions                                                     | Test Steps                                                                                                    | Expected Result                                                                                              | Type                   | Test File                                                                  |
| ------------ | ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------- |
| PR-001       | Purchase Request | Create Purchase Request (API)                                 | API token for authenticated user; at least one Item exists         | 1. POST `/api/purchase-requests` with valid fields and items.                                                 | Response 201 Created with request_id and stored items.                                                       | Integration (Parallel) | tests/Feature/Api/PurchaseRequestApiTest.php (existing)                    |
| PR-002       | Purchase Request | Create Purchase Request (UI)                                  | Authenticated user with "requester" role; at least one Item exists | 1. Go to Purchase Request module. 2. Fill requester details and add one or more items. 3. Submit the request. | The request is saved, PR number/request_id is generated, and the request appears in the user's request list. | Functional (Parallel)  | tests/Feature/PurchaseRequest/CreatePurchaseRequestUITest.php (scaffolded) |
| PR-003       | Purchase Request | Validate required fields on creation                          | Authenticated user; no optional constraints                        | 1. Submit PR creation form with missing required fields. 2. Submit API with missing required fields.          | UI shows validation messages; API returns 422 with validation errors.                                        | Negative (Parallel)    | tests/Feature/Api/PurchaseRequestApiTest.php (existing)                    |
| PR-004       | Purchase Request | Generate Purchase Request PDF                                 | There exists a saved Purchase Request                              | 1. Open PR detail page. 2. Click "Generate / Preview PDF".                                                    | A PDF preview appears (or a generated PDF download) containing PR details and items.                         | Functional (Parallel)  | tests/Feature/PurchaseRequestPdfGenerationTest.php (existing)              |
| PR-005       | Purchase Request | Status change sends notifications (email/notification record) | PR exists; approvers or admins in system                           | 1. Change PR status to 'approved' or 'rejected'.                                                              | Notification queued/sent and notification record created.                                                    | Integration (Parallel) | tests/Feature/Notifications/PurchaseRequestSubmittedTest.php (scaffolded)  |

| PO-001 | Purchase Order | Create Purchase Order (API) | API token for authorized PO user; Items exist | 1. POST `/api/purchase-orders` with valid payload. | Response 201 Created; PO returned with items and computed totals. | Integration (Parallel) | tests/Feature/Api/PurchaseOrderApiTest.php (existing) |
| PO-002 | Purchase Order | Create Purchase Order from PR (UI) | Approved purchase request exists; authorized PO user | 1. From an approved PR, create a Purchase Order via UI. 2. Populate supplier and costs, then save. | PO is created and implemented as a `PurchaseOrder` record; items carried over with costs. | Functional (Parallel) | tests/Feature/PurchaseOrder/CreatePurchaseOrderFromPRTest.php (scaffolded) |
| PO-003 | Purchase Order | Update PO Status to `received` and validate Inventory updates | Existing PO with items; Inventory model present | 1. Update PO status to 'received'. 2. Inspect Inventory / IAR updates. | PO status set to `received`; Inventory and IARs updated accordingly. | Functional (Parallel) | tests/Feature/Api/PurchaseOrderApiTest.php (existing) and tests/Feature/PurchaseOrder/POStatusInventoryUpdateTest.php (scaffolded) |
| PO-004 | Purchase Order | Generate Purchase Order PDF | PO created and saved | 1. Open PO. 2. Generate/Download PO PDF. | PDF contains PO number, supplier, items, quantities, cost breakdown. | Functional (Parallel) | tests/Feature/PurchaseOrder/PurchaseOrderPdfGenerationTest.php (scaffolded) |

| IAR-001 | Inventory Custodian Slip (IAR) | Generate IAR for a PO | Received PO with items; authorized user | 1. From PO, create IAR. 2. Fill custodian, verify items. 3. Generate PDF. | IAR record created; PDF includes item details and correct custodianship information. | Functional (Parallel) | tests/Feature/Api/PurchaseOrderApiTest.php (existing - IAR assertions) |

| RIS-001 | Requisition Issue Slip (RIS) | Create Requisition Issue Slip | Items available in Inventory | 1. Navigate to Requisition Issue Slip. 2. Populate requester, items, quantities. 3. Submit. | New RIS record created and inventory quantities reduced accordingly. | Functional (Parallel) | tests/Feature/Api/PurchaseOrderApiTest.php (existing - RIS assertions) |

| INV-001 | Stock / Inventory | Create stock-in and stock-out transactions | Item exists; qty > 0 | 1. POST stock-in / stock-out endpoints. 2. Inspect inventory quantities. | Inventory quantities updated; activities recorded. | Integration (Parallel) | tests/Feature/Api/StockApiTest.php (existing) |

| SUP-001 | Supplier | Create / Update / Delete Supplier | API token; supplier data valid | 1. POST / GET / PATCH / DELETE supplier endpoints. | CRUD operations succeed; validations enforced. | Integration (Parallel) | tests/Feature/Api/SupplierApiTest.php (existing) |

| ITEM-001 | Item / Product | Create / Update / Delete Item | API token; item data valid | 1. POST / GET / PATCH / DELETE item endpoints. | CRUD operations succeed; validations enforced. | Integration (Parallel) | tests/Feature/Api/ItemApiTest.php (existing) |

| AUTH-001 | Authentication & Permissions | Login / Logout / Rate limit / Password reset | User exists | 1. Login, logout, request password reset, attempt rate limited login. | Login and reset workflows function; rate limiting enforced. | Security (Parallel) | tests/Feature/AuthenticationTest.php (existing) |

| NOTIF-001 | Notifications | Send email and queue notifications on status change | PR or PO exists; mail configured | 1. Change status; check Mail::fake and Notification::assertX helpers. | Mail queued and Notification records created. | Integration (Parallel) | tests/Feature/Notifications/PurchaseRequestSubmittedTest.php (scaffolded) and suggested tests/Feature/Notifications/StatusChangedMailTest.php |

| PDF-001 | PDF Generation | Generate PDF / Preview for PR / PO | Multiple PRs/POs saved | 1. Trigger PDF generation or preview for PR / PO. 2. Validate PDF content. | PDFs generated with correct content for each record. | Performance (Parallel) | tests/Feature/PurchaseRequestPdfGenerationTest.php (existing), tests/Feature/PurchaseOrder/PurchaseOrderPdfGenerationTest.php (scaffolded), tests/Feature/PDF/BulkPdfGenerationTest.php (scaffolded) |

---

## Notes & Recommendations

- This file now contains only the test cases that relate to the core system features: Purchase Request, Purchase Order, Inventory/IAR, Requisition Issue Slip, Stock/Inventory, Suppliers, Items, Authentication, Notifications, and PDF generation.
- Non-core tests such as Activity logging, Admin dashboard UI checks, role assignment, and general example tests were removed per your request.
- When running tests in parallel, ensure DB isolation using the `RefreshDatabase` trait, or unique DB per worker, and avoid shared global state like localStorage or filesystem artifacts.

Suggested parallel run commands

```bash
# Pest parallel
./vendor/bin/pest --parallel
# PHPUnit + Paratest (example 4 workers)
./vendor/bin/paratest --processes=4 --path=tests/Feature
# Laravel artisan test (may use Pest or PHPUnit based on setup)
php artisan test --parallel
```

If you want, I can now:

- Create/implement real tests for the scaffolded placeholders (PR UI flow, PO UI flow, IAR/RIS UI assertions, StatusChangedMail); or
- Convert the mapping into a CSV for QA import; or
- Add CI steps to run only these system feature tests in parallel.

If you'd like, I can also:

- Add these as individual Pest test stubs in `tests/Feature` so they can be implemented as PHP tests.
- Export the MD file to a different location or format (CSV, Excel).

Scaffolded placeholder tests

- `tests/Feature/PurchaseRequest/CreatePurchaseRequestUITest.php` (placeholder)
- `tests/Feature/Notifications/PurchaseRequestSubmittedTest.php` (placeholder)
- `tests/Feature/PurchaseOrder/CreatePurchaseOrderFromPRTest.php` (placeholder)
- `tests/Feature/PurchaseOrder/POStatusInventoryUpdateTest.php` (placeholder)
- `tests/Feature/PurchaseOrder/PurchaseOrderPdfGenerationTest.php` (placeholder)
- `tests/Feature/PDF/BulkPdfGenerationTest.php` (placeholder)

Tip: The placeholder tests currently assert true and are intended as scaffolding. Replace their bodies with real assertions that replicate the flows above.
````
