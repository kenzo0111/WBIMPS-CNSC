# System Architecture

## Overview

The Supply and Property Management System (SPMO) is built on Laravel 12 with a modern frontend stack, designed to handle inventory management and procurement workflows for Camarines Norte State College.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "Presentation Layer"
        Blade[Blade Templates]
        Vite[Vite Asset Pipeline]
        CSS[Tailwind CSS]
        JS[JavaScript/ES Modules]
    end

    subgraph "Application Layer"
        Routes[Routes<br/>web.php, api.php]
        Auth[Authentication<br/>Middleware]
        Controllers[Controllers]
        API[REST API<br/>Endpoints]
    end

    subgraph "Business Logic Layer"
        Models[Eloquent Models]
        Observers[Model Observers]
        Policies[Authorization<br/>Policies]
        Services[Business Services]
    end

    subgraph "Data Layer"
        MySQL[(MySQL Database)]
        Cache[(Cache<br/>Database)]
        Queue[(Queue Jobs<br/>Database)]
        Storage[File Storage]
    end

    subgraph "External Services"
        SMTP[Email Service<br/>SMTP/TLS]
        PDF[PDF Generator<br/>DomPDF]
    end

    Browser --> Blade
    Mobile --> Blade
    Blade --> Vite
    Vite --> CSS
    Vite --> JS
    Blade --> Routes
    JS --> API
    Routes --> Auth
    Auth --> Controllers
    Controllers --> Models
    Controllers --> API
    Models --> Observers
    Models --> Policies
    Models --> MySQL
    Controllers --> Services
    Services --> PDF
    Observers --> SMTP
    Controllers --> Cache
    Controllers --> Queue
    Controllers --> Storage
    Queue --> MySQL
    Cache --> MySQL
```

---

## System Components

### 1. Client Layer

- **Web Browser**: Desktop users accessing the admin dashboard
- **Mobile Browser**: Mobile-responsive interface for on-the-go access

### 2. Presentation Layer

- **Blade Templates**: Server-side rendering with Laravel Blade
- **Vite**: Modern asset bundling and hot module replacement
- **Tailwind CSS**: Utility-first CSS framework (v4.x)
- **JavaScript**: Modern ES modules, Axios, XLSX, html2canvas, jsPDF

### 3. Application Layer

- **Routes**: Web routes and API routes with middleware
- **Authentication**: PIN-based login with rate limiting
- **Controllers**: Handle HTTP requests and responses
- **REST API**: JSON API for AJAX operations

### 4. Business Logic Layer

- **Models**: Eloquent ORM models with relationships
- **Observers**: Event listeners for model lifecycle
- **Policies**: Authorization rules for resources
- **Services**: Reusable business logic

### 5. Data Layer

- **MySQL**: Primary relational database
- **Cache**: Database-backed cache storage
- **Queue**: Asynchronous job processing
- **File Storage**: Document and attachment storage

### 6. External Services

- **Email Service**: SMTP with TLS encryption
- **PDF Generator**: DomPDF for document generation

---

## Procurement Workflow Architecture

```mermaid
flowchart TD
    Start([User Initiates Request]) --> PR[Create Purchase Request]
    PR --> PRValidation{Validation}
    PRValidation -->|Invalid| PRError[Show Validation Errors]
    PRValidation -->|Valid| PRSave[Save to Database]
    PRSave --> PRNotify[Send Email Notification]
    PRNotify --> PRActivity[Log Activity]
    PRActivity --> PRPending[Status: Incoming]

    PRPending --> Review{Admin Reviews}
    Review -->|Reject| Rejected[Status: Rejected]
    Review -->|Approve| Approved[Status: Approved]

    Approved --> CreatePO[Create Purchase Order]
    CreatePO --> POValidation{Validation}
    POValidation -->|Invalid| POError[Show Validation Errors]
    POValidation -->|Valid| POSave[Save PO]
    POSave --> PODocs[Generate Documents]

    PODocs --> RIS[RIS - Requisition<br/>Issue Slip]
    PODocs --> ICS[ICS - Inventory<br/>Custodian Slip]
    PODocs --> IAR[IAR - Inspection<br/>Acceptance Report]
    PODocs --> PAR[PAR - Property<br/>Acknowledgement Receipt]

    RIS --> PDFGen[PDF Generation]
    ICS --> PDFGen
    IAR --> PDFGen
    PAR --> PDFGen

    PDFGen --> Download[Download/Preview]
    Download --> Complete[Status: Completed]
    Complete --> StockUpdate[Update Inventory]
    StockUpdate --> End([Process Complete])

    Rejected --> End
```

---

## Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PURCHASE_REQUESTS : creates
    USERS ||--o{ ACTIVITIES : generates
    USERS ||--o{ USER_LOGS : tracks
    USERS ||--o{ SUPPORT_TICKETS : submits

    CATEGORIES ||--o{ ITEMS : contains

    ITEMS ||--o{ STOCK_IN : receives
    ITEMS ||--o{ STOCK_OUT : issues

    SUPPLIERS ||--o{ STOCK_IN : supplies

    PURCHASE_REQUESTS ||--|| PURCHASE_ORDERS : "generates"

    PURCHASE_ORDERS ||--|| REQUISITION_ISSUE_SLIPS : has
    PURCHASE_ORDERS ||--|| INVENTORY_CUSTODIAN_SLIPS : has
    PURCHASE_ORDERS ||--|| INSPECTION_ACCEPTANCE_REPORTS : has
    PURCHASE_ORDERS ||--|| PROPERTY_ACKNOWLEDGEMENT_RECEIPTS : has

    SUPPORT_TICKETS ||--o{ SUPPORT_ATTACHMENTS : includes

    USERS {
        int id PK
        string name
        string email UK
        string password
        string role
        boolean is_admin
        string status
        timestamp created_at
    }

    CATEGORIES {
        int id PK
        string name
        string code UK
        text description
    }

    ITEMS {
        int id PK
        int category_id FK
        string sku UK
        string name
        text description
        int quantity
        string unit
        decimal unit_cost
        decimal total_value
        date date
    }

    SUPPLIERS {
        int id PK
        string name
        string contact_person
        string email
        string phone
        text address
        decimal latitude
        decimal longitude
    }

    STOCK_IN {
        int id PK
        int item_id FK
        int supplier_id FK
        int quantity
        decimal unit_cost
        string reference_number
        string received_by
        date received_date
    }

    STOCK_OUT {
        int id PK
        int item_id FK
        int quantity
        string transaction_id
        string issued_to
        string issued_by
        date issue_date
        string purpose
    }

    PURCHASE_REQUESTS {
        int id PK
        string request_id UK
        string email
        string requester
        string department
        json items
        string status
        timestamp created_at
    }

    PURCHASE_ORDERS {
        int id PK
        string po_number UK
        string supplier
        text supplier_address
        json items
        decimal grand_total
        string status
        timestamp created_at
    }

    ACTIVITIES {
        int id PK
        int user_id FK
        string action
        string entity_type
        int entity_id
        text description
        json metadata
        timestamp created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string type
        text message
        boolean is_read
        timestamp created_at
    }
```

---

## API Architecture

```mermaid
graph LR
    subgraph "Client Applications"
        WebUI[Web Dashboard]
        MobileUI[Mobile Interface]
        ThirdParty[Third-party Apps]
    end

    subgraph "API Gateway"
        Router[Laravel Router]
        RateLimit[Rate Limiter]
        Auth[Authentication<br/>Middleware]
    end

    subgraph "API Controllers"
        CategoryAPI[Category API]
        ItemAPI[Item API]
        SupplierAPI[Supplier API]
        StockAPI[Stock API]
        PRAPI[Purchase Request API]
        POAPI[Purchase Order API]
        ActivityAPI[Activity API]
        SupportAPI[Support API]
    end

    subgraph "Resources"
        Models[Eloquent Models]
        Validation[Form Requests]
        Transforms[API Resources]
    end

    WebUI --> Router
    MobileUI --> Router
    ThirdParty --> Router

    Router --> RateLimit
    RateLimit --> Auth

    Auth --> CategoryAPI
    Auth --> ItemAPI
    Auth --> SupplierAPI
    Auth --> StockAPI
    Auth --> PRAPI
    Auth --> POAPI
    Auth --> ActivityAPI
    Auth --> SupportAPI

    CategoryAPI --> Models
    ItemAPI --> Models
    SupplierAPI --> Models
    StockAPI --> Models
    PRAPI --> Models
    POAPI --> Models
    ActivityAPI --> Models
    SupportAPI --> Models

    CategoryAPI --> Validation
    ItemAPI --> Validation
    SupplierAPI --> Validation

    CategoryAPI --> Transforms
    ItemAPI --> Transforms
    SupplierAPI --> Transforms
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        Input[User Input] --> CSRF[CSRF Protection]
        CSRF --> Validation[Input Validation]
        Validation --> Auth[Authentication<br/>PIN-based]
        Auth --> Authorization[Authorization<br/>Policies]
        Authorization --> RateLimit[Rate Limiting]
        RateLimit --> Encryption[Data Encryption]
    end

    subgraph "Security Features"
        A1[Session Management]
        A2[Password Hashing<br/>Bcrypt]
        A3[HTTPS/TLS]
        A4[XSS Protection]
        A5[SQL Injection<br/>Prevention]
        A6[File Upload<br/>Validation]
    end

    Encryption --> A1
    Encryption --> A2
    Encryption --> A3
    Encryption --> A4
    Encryption --> A5
    Encryption --> A6
```

---

## Deployment Architecture (Production)

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/Apache<br/>Load Balancer]
    end

    subgraph "Application Servers"
        APP1[Laravel App<br/>Instance 1]
        APP2[Laravel App<br/>Instance 2]
    end

    subgraph "Cache Layer"
        Redis[(Redis Cache)]
        SessionStore[(Session Store)]
    end

    subgraph "Database Layer"
        Master[(MySQL Master)]
        Replica[(MySQL Replica)]
    end

    subgraph "Queue Workers"
        Worker1[Queue Worker 1]
        Worker2[Queue Worker 2]
    end

    subgraph "Storage"
        S3[Cloud Storage<br/>AWS S3/Local]
    end

    subgraph "Monitoring"
        Logs[Log Aggregation]
        Metrics[Performance Metrics]
        Alerts[Error Tracking]
    end

    Users[Users] --> LB
    LB --> APP1
    LB --> APP2

    APP1 --> Redis
    APP2 --> Redis
    APP1 --> SessionStore
    APP2 --> SessionStore

    APP1 --> Master
    APP2 --> Master
    Master --> Replica

    APP1 --> Worker1
    APP2 --> Worker2

    Worker1 --> Master
    Worker2 --> Master

    APP1 --> S3
    APP2 --> S3

    APP1 --> Logs
    APP2 --> Logs
    APP1 --> Metrics
    APP2 --> Metrics
    APP1 --> Alerts
    APP2 --> Alerts
```

---

## Technology Stack Details

### Backend

- **Framework**: Laravel 12.36.1
- **PHP Version**: 8.2.12
- **Database**: MySQL
- **ORM**: Eloquent
- **Queue**: Database driver (can be upgraded to Redis)
- **Cache**: Database driver (can be upgraded to Redis)
- **Session**: Database driver

### Frontend

- **Template Engine**: Blade
- **Build Tool**: Vite 7.2.2
- **CSS Framework**: Tailwind CSS 4.1.17
- **JavaScript**: Vanilla JS with ES modules
- **HTTP Client**: Axios 1.13.2
- **PDF Client**: jsPDF 3.0.3
- **Excel**: XLSX 0.18.5
- **Canvas**: html2canvas 1.4.1

### Third-party Services

- **PDF Generation**: barryvdh/laravel-dompdf 3.1.1
- **Email**: SMTP with TLS
- **Testing**: Pest PHP 3.8

### Development Tools

- **Package Manager**: Composer 2.8.12
- **Node Package Manager**: npm
- **Code Quality**: Laravel Pint
- **Testing**: Pest PHP
- **Database Migrations**: Laravel Migrations
- **Seeding**: Laravel Seeders/Factories

---

## Key Design Patterns

### 1. MVC (Model-View-Controller)

- **Models**: Eloquent ORM for database interaction
- **Views**: Blade templates for UI rendering
- **Controllers**: Handle business logic and HTTP flow

### 2. Repository Pattern

- Controllers interact with models
- Business logic separated from data access

### 3. Observer Pattern

- `PurchaseRequestObserver` for status change notifications
- Automatic email sending on model events

### 4. Policy Pattern

- Authorization logic separated from controllers
- Centralized access control

### 5. Factory Pattern

- Model factories for testing and seeding
- Consistent test data generation

### 6. Service Layer

- Reusable business logic
- PDF generation services
- Email notification services

---

## Scalability Considerations

### Current Setup (Single Server)

- Suitable for: 100-500 concurrent users
- Database: Single MySQL instance
- Cache: Database-backed
- Queue: Database-backed

### Medium Scale (Multi-Server)

- Suitable for: 500-2000 concurrent users
- Load balancer with 2-3 app servers
- Dedicated Redis for cache and sessions
- Dedicated queue workers
- Database replication (master-replica)

### Large Scale (Cloud-Native)

- Suitable for: 2000+ concurrent users
- Auto-scaling application servers
- Redis cluster for cache
- Managed database service (RDS)
- S3/Cloud storage for files
- CDN for static assets
- Microservices architecture (future consideration)

---

## Performance Optimization

### Application Level

- **OPcache**: Enabled for PHP bytecode caching
- **Config Caching**: `php artisan config:cache`
- **Route Caching**: `php artisan route:cache`
- **View Caching**: `php artisan view:cache`
- **Query Optimization**: Eager loading to prevent N+1 queries

### Database Level

- **Indexing**: Primary keys, foreign keys, frequently queried columns
- **Query Optimization**: Use of `select()` to limit columns
- **Connection Pooling**: Persistent connections

### Frontend Level

- **Asset Bundling**: Vite for optimized builds
- **Lazy Loading**: Images and components
- **Minification**: CSS and JavaScript
- **Browser Caching**: Versioned assets

### Caching Strategy

- **Config Cache**: Application configuration
- **Route Cache**: Route definitions
- **View Cache**: Compiled Blade templates
- **Query Cache**: Frequently accessed data (when using Redis)

---

## Monitoring & Logging

### Application Logs

- Location: `storage/logs/laravel.log`
- Channels: Single, Stack, Daily
- Levels: Debug, Info, Warning, Error, Critical

### Activity Tracking

- User actions logged to `activities` table
- Entity types: PurchaseRequest, PurchaseOrder, etc.
- Includes metadata and timestamps

### User Logging

- Login/logout events
- IP addresses and user agents
- Session tracking

### Error Tracking (Recommended)

- Sentry integration for production
- Real-time error notifications
- Stack trace analysis

---

## Security Measures

### Authentication

- PIN-based login system
- Session-based authentication
- Password hashing with Bcrypt (12 rounds)
- Account status verification

### Authorization

- Role-based access (admin/user)
- Policy-based authorization
- Route middleware protection

### Input Protection

- CSRF token validation
- XSS prevention (Blade auto-escaping)
- SQL injection prevention (Eloquent ORM)
- File upload validation

### Rate Limiting

- Login: 5 attempts per minute
- Password reset: 3 attempts per minute
- Account setup: 5 attempts per minute
- API: 60 requests per minute (configurable)

### Data Protection

- Session encryption (configurable)
- Secure cookie settings
- Environment variable protection
- Database connection encryption (configurable)

---

## Future Enhancements

### Short-term (3-6 months)

- [ ] Redis implementation for caching
- [ ] Queue worker with Supervisor
- [ ] API rate limiting per user
- [ ] Advanced search and filtering
- [ ] Export to Excel/CSV
- [ ] Barcode/QR code generation

### Medium-term (6-12 months)

- [ ] Mobile application (React Native)
- [ ] Real-time notifications (Pusher/WebSockets)
- [ ] Advanced reporting and analytics
- [ ] Automated backup system
- [ ] Multi-tenant support
- [ ] API versioning

### Long-term (12+ months)

- [ ] Microservices architecture
- [ ] Machine learning for demand forecasting
- [ ] Blockchain for audit trail
- [ ] Integration with accounting systems
- [ ] Multi-language support
- [ ] Advanced workflow automation

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Author**: Supply System Development Team

