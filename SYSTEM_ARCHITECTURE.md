# System Architecture

## 1. System Overview

The **Supply and Property Management System** is a web-based application designed to manage inventory, procurement, and asset tracking processes. It facilitates the lifecycle of supplies from requisition to issuance and disposal, ensuring accountability and transparency through digital record-keeping and automated document generation.

## 2. Architectural Pattern

The system follows the **Model-View-Controller (MVC)** architectural pattern, which separates the application logic into three interconnected elements:

- **Model**: Represents the data and business logic (e.g., `PurchaseRequest`, `Item`, `InventoryCustodianSlip`).
- **View**: Handles the presentation layer using Laravel Blade templates and Tailwind CSS.
- **Controller**: Manages user input, interacts with models, and returns the appropriate views (e.g., `Http/Controllers`).

## 3. Technology Stack

### Backend

- **Language**: PHP 8.2+
- **Framework**: Laravel 12.0
- **Database**: MySQL / MariaDB
- **Key Libraries**:
  - `spatie/laravel-permission`: Role-Based Access Control (RBAC).
  - `spatie/laravel-activitylog`: System activity tracking.
  - `barryvdh/laravel-dompdf`: Server-side PDF generation.

### Frontend

- **Templating**: Laravel Blade
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Scripting**: JavaScript (ES6+)
- **Key Libraries**:
  - `axios`: HTTP requests.
  - `fusioncharts`: Data visualization and dashboards.
  - `jspdf` & `html2canvas`: Client-side document handling.
  - `exceljs`: Spreadsheet manipulation.

### Testing

- **Framework**: Pest PHP

## 4. Core Modules & Components

### 4.1. Authentication & Authorization

- Uses Laravel's built-in authentication system.
- Implements **Role-Based Access Control (RBAC)** via `spatie/laravel-permission`.
- Roles likely include Admin, Supply Officer, Requisitioner, etc.

### 4.2. Inventory Management

- **Items & Categories**: Management of supply items and their classifications.
- **Stock Tracking**: Monitoring quantity on hand and stock levels.

### 4.3. Procurement & Requisition

- **Purchase Request (PR)**: Initial request for goods.
- **Purchase Order (PO)**: Official order issued to suppliers.
- **Inspection Acceptance Report (IAR)**: Verification of delivered goods.

### 4.4. Asset & Issuance Management

- **Requisition and Issue Slip (RIS)**: Issuance of supplies to end-users.
- **Inventory Custodian Slip (ICS)**: Tracking of semi-expendable property.
- **Property Acknowledgement Receipt (PAR)**: Tracking of long-term assets/equipment.

### 4.5. Reporting & Notifications

- **PDF Generation**: Automated creation of government-standard forms (RIS, ICS, PAR, PO) using `dompdf`.
- **Activity Logging**: Audit trails for all critical actions using `activity_helper` and Spatie Activitylog.
- **Notifications**: System alerts for status changes (e.g., `StatusChangedMail`, `PurchaseRequestSubmitted`).

## 5. Directory Structure Highlights

```
/app
  /Helpers       # Custom helper functions (e.g., activity_helper.php)
  /Http          # Controllers, Middleware, Requests
  /Mail          # Mailable classes for email notifications
  /Models        # Eloquent models representing database tables
/config          # Configuration files (permissions, dompdf, etc.)
/database
  /migrations    # Database schema definitions
  /seeders       # Initial data population
/public          # Web root, assets
/resources
  /views         # Blade templates
  /css           # Tailwind source
/routes          # Web and API route definitions
/tests           # Pest test suites
```

## 6. Data Flow

1.  **Request**: User interacts with the UI (Blade View).
2.  **Routing**: `routes/web.php` directs the request to the appropriate Controller.
3.  **Processing**: Controller validates input, interacts with Models (Business Logic), and triggers events (Mails/Notifications).
4.  **Persistence**: Models save/retrieve data from the MySQL Database.
5.  **Response**: Controller returns a View (HTML) or JSON response to the user.

## 7. Architecture Diagram

```mermaid
graph TD
    User[User (Web Browser)]

    subgraph "Web Server"
        Entry[public/index.php]
        Router[Laravel Router]

        subgraph "Application Layer"
            Auth[Auth Middleware]
            Controller[Controllers]
            Service[Services/Helpers]
            Model[Eloquent Models]
            View[Blade Views]
        end
    end

    subgraph "Data & Storage"
        DB[(MySQL Database)]
        Storage[File Storage]
    end

    User -->|HTTP Request| Entry
    Entry --> Router
    Router --> Auth
    Auth --> Controller
    Controller --> Service
    Controller --> Model
    Model <-->|Read/Write| DB
    Controller -->|Generate PDF/Logs| Storage
    Controller -->|Render| View
    View -->|HTML Response| User
```
