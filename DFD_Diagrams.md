# Data Flow Diagrams (DFD) for Supply and Property Management System

## DFD Level 0 (Context Diagram)

```mermaid
graph TD
    %% Entities
    User[Employee / User]
    Admin[Admin / Supply Officer]
    Supplier[Supplier]
    Authority[Approving Authority]

    %% System
    System((0.0<br>Supply & Property<br>Management System))

    %% Flows
    User -->|Submit Purchase Request (PR)| System
    User -->|Submit Requisition Issue Slip (RIS)| System
    System -->|Issued Items & Acknowledgement Receipt (PAR/ICS)| User

    Admin -->|Manage Inventory & Users| System
    Admin -->|Generate Reports (IAR, PO, RIS)| System
    System -->|Notifications & Status Updates| Admin

    System -->|Purchase Order (PO)| Supplier
    Supplier -->|Delivery & Invoice| System

    System -->|Request for Approval (PR/PO)| Authority
    Authority -->|Approved PR/PO| System
```

## DFD Level 1 (System Decomposition)

```mermaid
graph TD
    %% Entities
    User[Employee / User]
    Admin[Admin / Supply Officer]
    Supplier[Supplier]
    Authority[Approving Authority]

    %% Processes
    P1((1.0<br>Manage User<br>Access))
    P2((2.0<br>Manage<br>Procurement))
    P3((3.0<br>Inspection &<br>Acceptance))
    P4((4.0<br>Manage<br>Inventory))
    P5((5.0<br>Manage<br>Issuance))

    %% Data Stores
    D1[(D1 Users)]
    D2[(D2 Purchase Requests)]
    D3[(D3 Purchase Orders)]
    D4[(D4 Items / Inventory)]
    D5[(D5 IAR Records)]
    D6[(D6 RIS / PAR / ICS)]

    %% Flow 1: User Access
    User -->|Login Credentials| P1
    Admin -->|Manage Roles| P1
    P1 -->|Auth Token| User
    P1 <-->|Read/Write| D1

    %% Flow 2: Procurement
    User -->|Submit PR| P2
    P2 -->|Save PR| D2
    P2 -->|Request Approval| Authority
    Authority -->|Approve PR| P2
    P2 -->|Generate PO| D3
    D3 -->|Send PO| Supplier

    %% Flow 3: Inspection
    Supplier -->|Deliver Items| P3
    P3 -->|Inspect & Create IAR| D5
    P3 -->|Update Stock| P4

    %% Flow 4: Inventory
    Admin -->|Add/Edit Items| P4
    P4 <-->|Update Quantity| D4
    P4 -->|Stock In| D4

    %% Flow 5: Issuance
    User -->|Submit RIS| P5
    P5 -->|Check Availability| D4
    P5 -->|Save RIS| D6
    Admin -->|Approve & Issue| P5
    P5 -->|Generate PAR/ICS| D6
    P5 -->|Stock Out| D4
    P5 -->|Release Item| User
```
