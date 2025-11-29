// filepath: c:\xampp\htdocs\SupplySystem\TODOLIST.md

# Web-based supply and property management system TO-DO-LIST

**Project Completion Status: 100% (5/5 tasks completed)**

- [x] Develop and Configure System Notifications
- [x] Integrate and Display Recent Activity Feed
- [x] Implement Account Setup Link for New Users (Option A)
- [x] Set Up Conditional Requisition Data Retrieval (Based on Item Form Check)
- [x] Complete Database Implementation for the Dashboard

## Recent Updates (November 21, 2025)

### UI Fixes (November 25, 2025)

- [x] Make fields in Step 1 (Purchase Request wizard) expand to full width in the user request form (`resources/views/user/user-request.blade.php`).
- [x] Add "View Form" preview button on Step 3 (Review & Submit) so users can open and print a preview of the filled request (`resources/views/user/user-request.blade.php`).

### Status Management Consolidation

- [x] Consolidated separate status management pages (Incoming, Received, Finished, Cancelled, Rejected, Returned) into a single "Status Management" page
- [x] Moved the consolidated Status Management page into the Requisition section of the sidebar navigation
- [x] Updated dashboard.blade.php to reflect the new navigation structure
- [x] Modified dashboard.js to handle the new "status-management" page and removed unused status page cases
- [x] Rebuilt frontend assets to apply changes

**Details**: Status management is now accessible from the Requisition submenu as a single page showing all request statuses with filtering capabilities, instead of separate pages for each status type.

## Recent Updates (November 5, 2025)

### PAR and IAR PDF Download Feature

- [x] Added downloadPDF method to PropertyAcknowledgementReceiptController
- [x] Added downloadPDF method to InspectionAcceptanceReportController
- [x] Added download routes for PAR and IAR: `/{id}/pdf`
- [x] Updated JavaScript download forms chooser to use GET requests for PAR and IAR
- [x] Made PAR and IAR forms downloadable on the completed request page
- [x] Added activity logging for PAR and IAR downloads

**Details**: PAR and IAR forms can now be downloaded from the completed request page using the download button, similar to other forms (PO, ICS, RIS).

### RIS (Requisition Issue Slip) Refactoring

- [x] Removed RequisitionIssueSlipSeeder (no longer needed)
- [x] Refactored RequisitionIssueSlipController to match Purchase Order pattern
- [x] Added downloadPDF method for RIS (similar to PO)
- [x] Simplified preview method for RIS
- [x] Added download route: `/requisition-issue-slip/{id}/pdf`
- [x] Cleaned up unnecessary helper methods

**Details**: See `RIS_REFACTOR_SUMMARY.md` for complete documentation.

### Purchase Order — Form Data Retention

- [x] Added client-side PO draft persistence so the wizard restores user inputs if they navigate away and come back (per-user localStorage key)

### New Request — Delete button

- [x] Make the Delete button on the New Request page perform server-side deletion (if saved) and remove the request from the UI

## Recent Updates (Nov 23, 2025)

### Supplier modal — stricter input, PH TIN validation, and global alerts

- [x] Enforced stronger client-side validation on the Supplier modal (name required, contact format, latitude/longitude range)
- [x] Made TIN PH-specific: accepts 9 or 12 digits and accepts hyphenated formats (e.g., 123-456-789 or 123-456-789-000)
- [x] Added client-side TIN input auto-formatting for usability
- [x] Replaced native alerts in the Supplier modal with the app's Global Alert style (showAlert)
- [x] Added backend validation for PH TIN format (API) and new tests ensuring invalid TINs are rejected

Manual verification: open the Suppliers page in the dashboard, click Add Supplier, try entering invalid/valid TINs and check the UI uses the global toast alerts; run API tests to confirm server-side checks.

## Recommendations

### Product Management

- [x] Rename "Product" to "Item" throughout the system
- [ ] Implement item name change functionality within category management
- [x] Add price field to item (using coins/pesos instead of dollars)
- [ ] Implement dropdown for items in item selection
- [x] Add rows-per-page selector for Items page (client-side pagination)
- [ ] Add role-based access control for Head Officer and Employees to access the system

### Requisition System

- [x] Rename "Requisition System" to "Requisition"
- [x] Remove status from requisition (hindi na status dapat nasa requisition)
- [x] Consolidate all status and request into one unified interface (status management moved into requisition)
- [ ] Implement reports form functionality
- [x] Make P.O. number sequential (may sinusundan)
- [x] Add fund cluster dropdown
- [x] Implement automated processes
- [ ] Create employee accounts system
- [ ] Add necessary dropdowns throughout the system
