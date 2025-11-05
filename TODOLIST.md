// filepath: c:\xampp\htdocs\SupplySystem\TODOLIST.md

# Web-based inventory and procurement management system TO-DO-LIST

**Project Completion Status: 100% (5/5 tasks completed)**

- [x] Develop and Configure System Notifications
- [x] Integrate and Display Recent Activity Feed
- [x] Implement Account Setup Link for New Users (Option A)
- [x] Set Up Conditional Requisition Data Retrieval (Based on Item Form Check)
- [x] Complete Database Implementation for the Dashboard

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
