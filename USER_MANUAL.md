# Supply and Property Management System (SPMO)

## User Manual

**Version**: 1.0  
**Last Updated**: November 17, 2025  
**Organization**: Camarines Norte State College  
**Department**: Supply and Property Management Office

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [Dashboard Overview](#4-dashboard-overview)
5. [User Guide](#5-user-guide)
6. [Admin Guide](#6-admin-guide)
7. [Document Management](#7-document-management)
8. [Reports and Analytics](#8-reports-and-analytics)
9. [Support and Troubleshooting](#9-support-and-troubleshooting)
10. [Frequently Asked Questions (FAQ)](#10-frequently-asked-questions-faq)
11. [Appendix](#11-appendix)

---

## 1. Introduction

### 1.1 About the System

The Supply and Property Management System (SPMO) is a web-based application designed to streamline and automate the inventory management and procurement workflows for Camarines Norte State College. The system provides a comprehensive solution for managing:

- **Inventory Management**: Track products, stock levels, and warehouse operations
- **Procurement Process**: Create and manage purchase requests and purchase orders
- **Document Generation**: Generate official documents (PO, RIS, ICS, IAR, PAR)
- **Activity Tracking**: Monitor all system activities and user actions
- **Supplier Management**: Maintain supplier information and relationships
- **Reporting**: Generate various reports for decision-making

### 1.2 System Requirements

**Supported Browsers:**

- Google Chrome (recommended, version 90+)
- Mozilla Firefox (version 88+)
- Microsoft Edge (version 90+)
- Safari (version 14+)

**Internet Connection:**

- Stable internet connection recommended
- Minimum speed: 2 Mbps

**Display Resolution:**

- Minimum: 1280 x 720 pixels
- Recommended: 1920 x 1080 pixels

### 1.3 Key Features

✅ **User-Friendly Interface**: Intuitive dashboard with easy navigation  
✅ **Real-Time Updates**: Live notifications and activity feed  
✅ **Document Generation**: Automatic PDF generation for official forms  
✅ **Role-Based Access**: Secure access control for different user types  
✅ **Activity Logging**: Complete audit trail of all system activities  
✅ **Email Notifications**: Automated email alerts for important events

---

## 2. Getting Started

### 2.1 Accessing the System

1. Open your web browser
2. Navigate to the system URL provided by your administrator
3. You will be redirected to the login page

### 2.2 First-Time Login (Account Setup)

If you're a new user, you'll receive an account setup email:

1. **Check Your Email**: Look for an email with subject "Set Up Your Account"
2. **Click the Setup Link**: Click the "Set Up Account" button in the email
3. **Create Your Password**:
   - Enter a secure password
   - Confirm the password by entering it again
   - Click "Complete Setup"
4. **Success**: You'll be redirected to the login page

**Important Notes:**

- The setup link expires after 60 minutes
- Keep your password secure and don't share it with others

### 2.3 Standard Login Process

1. Navigate to the login page
2. Enter your **Email Address**
3. Enter your **Password**
4. Click **"Access System"**
5. You'll be redirected to your dashboard

**Security Features:**

- Maximum 5 login attempts per minute
- Account lockout after multiple failed attempts
- Automatic session timeout after inactivity

### 2.4 Password Recovery

**Forgot Your Password?**

1. Click **"Forgot Password?"** on the login page
2. Enter your registered email address
3. Click **"Send Reset Link"**
4. Check your email for the password reset link
5. Click the link and enter your new password
6. Confirm the new password
7. Click **"Reset Password"**

**Important:**

- Reset links expire after 60 minutes
- You can only request 3 reset links per minute
- If you don't receive the email, check your spam folder

### 2.5 Logging Out

To log out securely:

1. Click on your profile icon in the top-right corner
2. Select **"Logout"** from the dropdown menu
3. You'll be redirected to the login page

**Best Practice**: Always log out when you're finished, especially on shared computers.

---

## 3. User Roles and Permissions

### 3.1 User Roles

The system has two primary user roles:

#### **Regular User**

- Submit purchase requests
- View their own requests and orders
- Track request status
- Access contact support
- View notifications

#### **Administrator**

- All regular user permissions, plus:
- Approve/reject purchase requests
- Create and manage purchase orders
- Manage inventory (categories, products, stock)
- Manage suppliers
- Manage user accounts
- Generate all types of documents
- Access all reports and analytics
- View all system activities

### 3.2 Permission Matrix

| Feature                 | Regular User | Administrator |
| ----------------------- | ------------ | ------------- |
| Submit Purchase Request | ✅           | ✅            |
| View Own Requests       | ✅           | ✅            |
| View All Requests       | ❌           | ✅            |
| Approve/Reject Requests | ❌           | ✅            |
| Create Purchase Orders  | ❌           | ✅            |
| Manage Inventory        | ❌           | ✅            |
| Manage Suppliers        | ❌           | ✅            |
| Manage Users            | ❌           | ✅            |
| Generate Documents      | ❌           | ✅            |
| View All Activities     | ❌           | ✅            |
| Access Reports          | Limited      | ✅            |

---

## 4. Dashboard Overview

### 4.1 Dashboard Layout

The dashboard is divided into several sections:

```
┌─────────────────────────────────────────────────┐
│  Header (Logo, Search, Notifications, Profile) │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  Side    │        Main Content Area            │
│  Bar     │        (Cards, Tables, Charts)       │
│  Menu    │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### 4.2 Header Elements

**Logo**: Click to return to the dashboard home  
**Search Bar**: Quick search for products, requests, or orders  
**Notification Bell**: View recent notifications (click to see all)  
**Profile Menu**: Access account settings and logout

### 4.3 Sidebar Navigation

The sidebar contains the main navigation menu:

**Dashboard Home** 🏠: Overview and statistics  
**Purchase Requests** 📝: Manage purchase requests  
**Purchase Orders** 📋: View and create purchase orders  
**Inventory** 📦: Product and stock management

- Categories
- Products
- Stock In
- Stock Out  
  **Suppliers** 🏢: Supplier management  
  **Users** 👥: User account management (Admin only)  
  **Documents** 📄: Document library  
  **Activities** 📊: Activity log  
  **Reports** 📈: Various reports  
  **Support** 💬: Contact support

### 4.4 Main Content Area

The main content area displays:

- **Dashboard Cards**: Key metrics and statistics
- **Recent Activity Feed**: Latest system activities
- **Quick Actions**: Common tasks and shortcuts
- **Data Tables**: Lists of requests, orders, products, etc.
- **Forms**: Input forms for creating/editing records

### 4.5 Notification Center

Click the bell icon to view notifications:

- **Unread Notifications**: Highlighted in bold
- **Notification Types**:
  - Purchase request status changes
  - New purchase orders
  - Stock alerts
  - System announcements
- **Actions**: Click to mark as read or view details

---

## 5. User Guide

### 5.1 Creating a Purchase Request

**Step 1: Navigate to Purchase Requests**

1. Click **"Purchase Requests"** in the sidebar
2. Click **"New Request"** button

**Step 2: Enter Requester Information**

- **Requester Name**: Your full name
- **Email**: Your email address (pre-filled)
- **Department**: Select your department from dropdown
- **Date**: Request date (auto-filled with current date)

**Step 3: Add Items**

1. Click **"Add Item"** button
2. Fill in item details:
   - **Item/Description**: Name or description of the item
   - **Unit**: Unit of measure (e.g., piece, box, ream)
   - **Quantity**: Number of units needed
   - **Unit Cost**: Estimated cost per unit
   - **Total Cost**: Automatically calculated (Quantity × Unit Cost)
3. Click **"Save Item"**
4. Repeat to add more items

**Step 4: Review and Submit**

1. Review all items in the list
2. Check the **Grand Total**
3. Click **"Submit Request"**
4. Confirm submission in the dialog box

**Step 5: Confirmation**

- You'll receive a confirmation message
- A reference number will be generated (e.g., PR-2025-001)
- You'll receive an email notification

**Request Status:**

- **Incoming**: Just submitted, awaiting review
- **Approved**: Approved by administrator
- **Rejected**: Not approved (you'll receive feedback)
- **Completed**: Purchase order created and processed

### 5.2 Viewing Your Purchase Requests

**View All Your Requests:**

1. Go to **"Purchase Requests"** in the sidebar
2. View the table with all your requests
3. Use filters to narrow down results:
   - By status (Incoming, Approved, Rejected, Completed)
   - By date range
   - By search term

**View Request Details:**

1. Click on any request in the table
2. View complete details:
   - Request ID and date
   - Requester information
   - List of items with costs
   - Current status
   - Status history
   - Related documents (if applicable)

**Actions Available:**

- **View**: See full details
- **Print**: Print request summary
- **Download PDF**: Download as PDF document

### 5.3 Tracking Request Status

**Status Indicators:**

🟡 **Incoming** (Yellow badge)

- Request has been submitted
- Waiting for admin review
- No action required from you

🟢 **Approved** (Green badge)

- Request has been approved
- Purchase order will be created
- You'll be notified when ready

🔴 **Rejected** (Red badge)

- Request was not approved
- Check rejection reason in details
- You may submit a new request

🔵 **Completed** (Blue badge)

- Purchase order has been created
- Documents are available for download
- Process is complete

**Email Notifications:**
You'll receive automatic emails when:

- Your request is received
- Status changes (approved/rejected)
- Purchase order is created
- Documents are ready

### 5.4 Viewing Purchase Orders

**View Orders Related to Your Requests:**

1. Go to **"Purchase Orders"** in the sidebar
2. View all purchase orders created from your requests
3. Click on an order to view details

**Order Information Includes:**

- PO Number (e.g., PO-2025-001)
- Date created
- Supplier information
- Items ordered
- Total amount
- Status

**Download Documents:**

- Purchase Order (PO)
- Requisition Issue Slip (RIS)
- Inventory Custodian Slip (ICS)
- Inspection and Acceptance Report (IAR)
- Property Acknowledgement Receipt (PAR)

### 5.5 Contacting Support

**Submit a Support Ticket:**

1. Click **"Support"** in the sidebar
2. Fill in the support form:
   - **Subject**: Brief description of your issue
   - **Category**: Select issue type (Technical, Request, General)
   - **Priority**: Choose priority level (Low, Medium, High, Urgent)
   - **Description**: Detailed explanation of your issue
   - **Attachments**: Upload relevant files (optional)
3. Click **"Submit Ticket"**

**Track Your Tickets:**

- View all your support tickets
- Check status and responses
- Add follow-up comments

---

## 6. Admin Guide

### 6.1 Managing Purchase Requests

**Review Incoming Requests:**

1. Go to **"Purchase Requests"** in the sidebar
2. Filter by status: **"Incoming"**
3. Click on a request to review details

**Approve a Request:**

1. Open the request details
2. Review all items and information
3. Click **"Approve"** button
4. Add approval notes (optional)
5. Confirm approval
6. Requester receives email notification

**Reject a Request:**

1. Open the request details
2. Click **"Reject"** button
3. Enter rejection reason (required)
4. Confirm rejection
5. Requester receives email with reason

**Best Practices:**

- Review requests within 24 hours
- Provide clear rejection reasons
- Verify budget availability before approval
- Check item specifications and quantities

### 6.2 Creating Purchase Orders

**Create PO from Approved Request:**

1. Navigate to approved purchase request
2. Click **"Create Purchase Order"** button
3. The system opens the PO creation wizard

**Step 1: Basic Information**

- **PO Number**: Auto-generated (e.g., PO-2025-001)
- **Date**: Current date (editable)
- **Mode of Procurement**: Select from dropdown
- **Delivery Period**: Number of days
- **Terms of Payment**: Payment terms

**Step 2: Supplier Information**

- **Supplier Name**: Select from existing suppliers or add new
- **Address**: Supplier's complete address
- **TIN**: Tax Identification Number
- **Contact Details**: Phone and email

**Step 3: Items**

- Items are auto-populated from the purchase request
- You can:
  - Edit quantities
  - Update unit costs
  - Add or remove items
  - Adjust specifications

**Step 4: Review and Create**

1. Review all information
2. Verify the grand total
3. Click **"Create Purchase Order"**
4. Confirm creation

**Post-Creation Actions:**

- PO is saved to the system
- Requester is notified
- Documents become available for download
- Request status changes to "Completed"

### 6.3 Document Generation

**Available Documents:**

1. **Purchase Order (PO)**

   - Official purchase order document
   - Contains supplier and item details
   - Includes terms and conditions

2. **Requisition and Issue Slip (RIS)**

   - Stock requisition form
   - Tracks item issuance
   - Records receiver information

3. **Inventory Custodian Slip (ICS)**

   - Property assignment form
   - Records inventory custodian
   - For non-consumable items

4. **Inspection and Acceptance Report (IAR)**

   - Delivery inspection form
   - Quality acceptance documentation
   - Inspector signatures

5. **Property Acknowledgement Receipt (PAR)**
   - Property transfer form
   - Employee acknowledgement
   - For equipment and furniture

**How to Generate Documents:**

**Method 1: From Purchase Order Details**

1. Open the purchase order
2. Click the document type button (e.g., "RIS")
3. Review the preview
4. Click **"Download PDF"**

**Method 2: Bulk Generation**

1. Go to **"Documents"** in the sidebar
2. Select the document type
3. Choose the PO number
4. Click **"Generate"**

**Document Preview:**

- Click **"Preview"** to view before downloading
- Review all information for accuracy
- Make corrections to the PO if needed
- Then generate the final document

### 6.4 Inventory Management

#### 6.4.1 Managing Categories

**View Categories:**

1. Go to **"Inventory"** → **"Categories"**
2. View list of all product categories

**Add New Category:**

1. Click **"Add Category"** button
2. Fill in details:
   - **Category Name**: Descriptive name
   - **Code**: Unique category code (e.g., OFF-001)
   - **Description**: Optional details
3. Click **"Save"**

**Edit Category:**

1. Click the edit icon next to a category
2. Modify information
3. Click **"Update"**

**Delete Category:**

1. Click the delete icon
2. Confirm deletion
3. **Note**: Cannot delete categories with associated products

#### 6.4.2 Managing Products

**View Products:**

1. Go to **"Inventory"** → **"Products"**
2. View all products with:
   - SKU (Stock Keeping Unit)
   - Name
   - Category
   - Quantity in stock
   - Unit cost
   - Total value

**Add New Product:**

1. Click **"Add Product"** button
2. Enter product information:
   - **SKU**: Unique product code
   - **Name**: Product name
   - **Category**: Select from dropdown
   - **Description**: Detailed description
   - **Unit**: Unit of measure
   - **Initial Quantity**: Starting stock level
   - **Unit Cost**: Cost per unit
   - **Date**: Date added
3. Click **"Save Product"**

**Edit Product:**

1. Click the edit icon next to a product
2. Modify information
3. Click **"Update"**
4. Changes are logged in activity history

**Delete Product:**

1. Click the delete icon
2. Confirm deletion
3. **Warning**: This action cannot be undone

**Product Details View:**

- Click on a product to view:
  - Complete specifications
  - Stock history
  - Related transactions
  - Activity log

#### 6.4.3 Stock In (Receiving Stock)

**Record New Stock Receipt:**

1. Go to **"Inventory"** → **"Stock In"**
2. Click **"New Stock In"** button
3. Fill in the form:
   - **Product**: Select from dropdown
   - **Supplier**: Choose supplier
   - **Quantity**: Number of units received
   - **Unit Cost**: Cost per unit
   - **Reference Number**: Delivery receipt or invoice number
   - **Received By**: Person who received the stock
   - **Received Date**: Date of receipt
4. Click **"Save"**

**Effect on Inventory:**

- Product quantity is automatically increased
- Total value is recalculated
- Transaction is logged
- Supplier history is updated

**View Stock In History:**

- See all stock receipt transactions
- Filter by date, product, or supplier
- Export to Excel for reporting

#### 6.4.4 Stock Out (Issuing Stock)

**Record Stock Issuance:**

1. Go to **"Inventory"** → **"Stock Out"**
2. Click **"New Stock Out"** button
3. Fill in the form:
   - **Product**: Select from dropdown
   - **Quantity**: Number of units to issue
   - **Issued To**: Department or person receiving
   - **Issued By**: Person issuing the stock
   - **Issue Date**: Date of issuance
   - **Purpose**: Reason for issuance
   - **Transaction ID**: Reference number
4. Click **"Save"**

**Effect on Inventory:**

- Product quantity is automatically decreased
- Transaction is logged
- Low stock alerts may be triggered
- Cannot issue more than available quantity

**View Stock Out History:**

- See all issuance transactions
- Track where stock was distributed
- Monitor usage patterns
- Generate consumption reports

### 6.5 Supplier Management

**View Suppliers:**

1. Go to **"Suppliers"** in the sidebar
2. View all registered suppliers

**Add New Supplier:**

1. Click **"Add Supplier"** button
2. Enter supplier information:
   - **Company Name**: Official business name
   - **Contact Person**: Primary contact
   - **Email**: Business email
   - **Phone**: Contact number
   - **Address**: Complete business address
   - **TIN**: Tax Identification Number
   - **Coordinates**: Latitude/Longitude (optional, for mapping)
3. Click **"Save Supplier"**

**Edit Supplier:**

1. Click the edit icon next to a supplier
2. Update information
3. Click **"Update"**

**View Supplier Details:**

- Click on a supplier to view:
  - Complete information
  - Purchase history
  - Delivery performance
  - Related purchase orders

**Delete Supplier:**

1. Click the delete icon
2. Confirm deletion
3. **Note**: Cannot delete suppliers with existing purchase orders

### 6.6 User Management

**View All Users:**

1. Go to **"Users"** in the sidebar
2. View list of all system users

**Add New User:**

1. Click **"Add User"** button
2. Enter user information:
   - **Name**: Full name
   - **Email**: Valid email address
   - **Role**: Select role (User or Admin)
   - **Department**: User's department
   - **Status**: Active or Inactive
3. Click **"Create User"**
4. System sends account setup email to the user

**Edit User:**

1. Click the edit icon next to a user
2. Modify information
3. Click **"Update"**

**Change User Role:**

1. Open user details
2. Select new role from dropdown
3. Confirm role change
4. User's permissions update immediately

**Deactivate User:**

1. Click on the user
2. Change status to **"Inactive"**
3. Click **"Save"**
4. User cannot log in when inactive

**Reactivate User:**

1. Filter for inactive users
2. Select the user
3. Change status to **"Active"**
4. Click **"Save"**

**Password Reset for Users:**

1. Open user details
2. Click **"Send Password Reset"**
3. User receives reset email

### 6.7 Activity Monitoring

**View System Activities:**

1. Go to **"Activities"** in the sidebar
2. View comprehensive activity log

**Activity Information Includes:**

- **User**: Who performed the action
- **Action**: What was done (Created, Updated, Deleted, etc.)
- **Entity**: What was affected (Product, Request, Order, etc.)
- **Timestamp**: When it occurred
- **Details**: Additional information

**Filter Activities:**

- By date range
- By user
- By action type
- By entity type
- By search term

**Common Activity Types:**

- Purchase request created
- Purchase request approved/rejected
- Purchase order created
- Product added/updated
- Stock in/out transactions
- User login/logout
- Document generated

**Use Cases:**

- Audit trails for compliance
- Troubleshooting issues
- Monitoring user actions
- Identifying system usage patterns

---

## 7. Document Management

### 7.1 Document Types

**1. Purchase Request (PR)**

- **Purpose**: Initial request for procurement
- **Generated By**: User (when creating request)
- **Contains**: Items needed, quantities, estimated costs
- **Format**: PDF
- **File Name**: PR-[YEAR]-[NUMBER].pdf

**2. Purchase Order (PO)**

- **Purpose**: Official order to supplier
- **Generated By**: Admin (after request approval)
- **Contains**: Supplier info, items, terms, total amount
- **Format**: PDF
- **File Name**: PO-[YEAR]-[NUMBER].pdf

**3. Requisition and Issue Slip (RIS)**

- **Purpose**: Request stock from warehouse
- **Generated By**: Admin (from purchase order)
- **Contains**: Items to be issued, recipient info
- **Format**: PDF
- **File Name**: RIS-[PO-NUMBER].pdf

**4. Inventory Custodian Slip (ICS)**

- **Purpose**: Assign inventory to custodian
- **Generated By**: Admin (from purchase order)
- **Contains**: Non-consumable items, custodian details
- **Format**: PDF
- **File Name**: ICS-[PO-NUMBER].pdf

**5. Inspection and Acceptance Report (IAR)**

- **Purpose**: Record delivery inspection
- **Generated By**: Admin (upon delivery)
- **Contains**: Delivered items, inspection results
- **Format**: PDF
- **File Name**: IAR-[PO-NUMBER].pdf

**6. Property Acknowledgement Receipt (PAR)**

- **Purpose**: Acknowledge property receipt
- **Generated By**: Admin (for equipment/furniture)
- **Contains**: Property details, recipient signature
- **Format**: PDF
- **File Name**: PAR-[PO-NUMBER].pdf

### 7.2 Downloading Documents

**From Purchase Order:**

1. Open the purchase order details
2. Look for document buttons:
   - 📄 Download PO
   - 📄 Download RIS
   - 📄 Download ICS
   - 📄 Download IAR
   - 📄 Download PAR
3. Click the desired document button
4. PDF downloads automatically

**From Documents Library:**

1. Go to **"Documents"** in sidebar
2. Select document type
3. Browse or search for the document
4. Click **"Download"** button

**Bulk Download:**

1. Select multiple documents using checkboxes
2. Click **"Download Selected"**
3. Documents download as a ZIP file

### 7.3 Printing Documents

**Print from Browser:**

1. Download or preview the PDF
2. Use browser's print function (Ctrl+P or Cmd+P)
3. Select printer
4. Adjust settings if needed
5. Click **"Print"**

**Print Settings Recommendations:**

- **Paper Size**: Letter (8.5" × 11") or A4
- **Orientation**: Portrait (most documents) or Landscape (wide tables)
- **Margins**: Default
- **Quality**: High quality for official copies

**Official Copies:**

- Print on official letterhead (if required)
- Get appropriate signatures before filing
- Keep both digital and physical copies

### 7.4 Document Versioning

**Version Control:**

- System maintains version history
- Each edit creates a new version
- Previous versions are archived

**View Document History:**

1. Open document details
2. Click **"Version History"**
3. View all versions with timestamps
4. Download any previous version if needed

**Best Practices:**

- Always download the latest version
- Note the document date when printing
- Keep track of which version was officially submitted

---

## 8. Reports and Analytics

### 8.1 Dashboard Analytics

**Key Metrics Displayed:**

**📊 Total Requests**

- Count of all purchase requests
- Breakdown by status
- Trend over time

**📈 Total Orders**

- Number of purchase orders
- Completed vs pending
- Monthly comparison

**📦 Inventory Value**

- Total value of all stock
- By category breakdown
- Depreciation tracking

**🏢 Active Suppliers**

- Number of registered suppliers
- Most used suppliers
- Supplier performance metrics

**Activity Trends:**

- Line charts showing activity over time
- Comparison with previous periods
- Peak usage times

### 8.2 Purchase Request Reports

**Generate PR Report:**

1. Go to **"Reports"** → **"Purchase Requests"**
2. Select parameters:
   - Date range
   - Status filter
   - Department filter
   - Requester filter
3. Click **"Generate Report"**

**Report Contents:**

- Total number of requests
- Requests by status
- Requests by department
- Average processing time
- Total amount requested
- Approval rate

**Export Options:**

- PDF format
- Excel spreadsheet
- CSV file

### 8.3 Purchase Order Reports

**Generate PO Report:**

1. Go to **"Reports"** → **"Purchase Orders"**
2. Select parameters:
   - Date range
   - Supplier filter
   - Status filter
   - Amount range
3. Click **"Generate Report"**

**Report Contents:**

- Total purchase orders
- Total amount spent
- Orders by supplier
- Average order value
- Top purchased items
- Payment status

**Visualizations:**

- Bar charts for spending by supplier
- Pie charts for category distribution
- Line graphs for spending trends

### 8.4 Inventory Reports

**Stock Level Report:**

1. Go to **"Reports"** → **"Inventory"** → **"Stock Levels"**
2. View current stock for all products
3. Filter by category
4. Export to Excel

**Low Stock Alert:**

- Products below minimum quantity
- Suggested reorder quantities
- Lead times for restocking

**Stock Movement Report:**

1. Select date range
2. Choose product or category
3. View all stock in/out transactions
4. See net change in inventory

**Inventory Valuation:**

- Total inventory value
- Value by category
- Value by location (if applicable)
- Historical valuation trends

### 8.5 Supplier Reports

**Supplier Performance:**

1. Go to **"Reports"** → **"Suppliers"**
2. View metrics:
   - Delivery performance
   - Order fulfillment rate
   - Average delivery time
   - Quality ratings

**Supplier Spending:**

- Total spent per supplier
- Payment history
- Outstanding balances
- Payment terms compliance

**Top Suppliers:**

- Ranked by transaction volume
- Ranked by total spending
- Ranked by performance score

### 8.6 Activity Reports

**User Activity Report:**

1. Go to **"Reports"** → **"Activities"**
2. Select user and date range
3. View all actions performed
4. Export for audit purposes

**System Usage:**

- Login frequency
- Peak usage hours
- Most active users
- Most performed actions

**Compliance Report:**

- All procurement activities
- Approval chains
- Document trail
- Timestamps and users

### 8.7 Custom Reports

**Create Custom Report:**

1. Go to **"Reports"** → **"Custom"**
2. Select data sources:
   - Purchase requests
   - Purchase orders
   - Inventory
   - Suppliers
3. Choose fields to include
4. Apply filters and grouping
5. Generate and save template

**Scheduled Reports:**

- Set up automatic report generation
- Choose frequency (daily, weekly, monthly)
- Email recipients
- Auto-export format

---

## 9. Support and Troubleshooting

### 9.1 Common Issues and Solutions

#### Issue: Cannot Log In

**Symptoms:**

- "Invalid credentials" error
- Account locked message

**Solutions:**

1. Verify your email address is correct
2. Check if your password meets the minimum requirements (8 characters)
3. Use the "Forgot Password?" link to reset
4. Contact administrator if account is locked
5. Clear browser cache and try again

#### Issue: Not Receiving Emails

**Symptoms:**

- No email notifications
- Missing account setup email
- Missing password reset email

**Solutions:**

1. Check your spam/junk folder
2. Verify email address in your profile
3. Add system email to contacts/safe senders
4. Contact administrator to resend
5. Try a different email address

#### Issue: Cannot Submit Purchase Request

**Symptoms:**

- Submit button not working
- Validation errors
- Form not saving

**Solutions:**

1. Check all required fields are filled
2. Verify item quantities are greater than 0
3. Ensure unit costs are valid numbers
4. Refresh the page and try again
5. Try a different browser
6. Contact support if issue persists

#### Issue: Document Won't Download

**Symptoms:**

- Download button not responding
- PDF shows blank page
- Download interrupted

**Solutions:**

1. Check your internet connection
2. Disable pop-up blockers
3. Try a different browser
4. Clear browser cache
5. Right-click and "Save As"
6. Contact support for alternative download

#### Issue: Slow Performance

**Symptoms:**

- Pages load slowly
- Actions take long time
- System freezes

**Solutions:**

1. Check your internet speed
2. Close unnecessary browser tabs
3. Clear browser cache and cookies
4. Disable browser extensions temporarily
5. Try a different browser
6. Contact support if widespread

#### Issue: Data Not Updating

**Symptoms:**

- Changes not saving
- Old data still showing
- Status not changing

**Solutions:**

1. Refresh the page (F5 or Ctrl+R)
2. Hard refresh (Ctrl+Shift+R)
3. Clear browser cache
4. Log out and log back in
5. Wait a few minutes and try again
6. Contact support if data loss occurs

### 9.2 Browser-Specific Issues

**Google Chrome:**

- Clear cache: Settings → Privacy → Clear browsing data
- Disable extensions: Settings → Extensions
- Incognito mode: Ctrl+Shift+N

**Firefox:**

- Clear cache: Options → Privacy → Clear Data
- Safe mode: Help → Restart with Add-ons Disabled

**Microsoft Edge:**

- Clear cache: Settings → Privacy → Clear browsing data
- InPrivate mode: Ctrl+Shift+P

**Safari:**

- Clear cache: Safari → Clear History
- Private browsing: Command+Shift+N

### 9.3 Getting Help

**Contact Support:**

**Option 1: In-System Support**

1. Click **"Support"** in sidebar
2. Fill in support form
3. Submit ticket
4. Track ticket status

**Option 2: Email**

- Send email to: [support email]
- Include:
  - Your name and email
  - Detailed description of issue
  - Screenshots (if applicable)
  - Steps to reproduce
  - Browser and OS information

**Option 3: Phone**

- Call support hotline: [phone number]
- Available hours: [business hours]
- Have your user ID ready

**Support Ticket Priorities:**

🔴 **Urgent**: System down, cannot access

- Response time: Within 1 hour
- Resolution time: Within 4 hours

🟠 **High**: Major feature broken

- Response time: Within 4 hours
- Resolution time: Within 1 business day

🟡 **Medium**: Minor issue, workaround available

- Response time: Within 1 business day
- Resolution time: Within 3 business days

🟢 **Low**: Question or enhancement request

- Response time: Within 2 business days
- Resolution time: As scheduled

### 9.4 Reporting Bugs

**When Reporting a Bug, Include:**

1. **What happened**: Describe the issue
2. **Expected behavior**: What should have happened
3. **Steps to reproduce**: Exact steps to recreate
4. **Screenshots**: Visual evidence
5. **Browser**: Which browser and version
6. **Time**: When did it occur
7. **Frequency**: One time or recurring

**Example Bug Report:**

```
Subject: Cannot download Purchase Order PDF

What happened:
When I click the "Download PO" button on PO-2025-001,
nothing happens. No download starts.

Expected behavior:
PDF should download automatically.

Steps to reproduce:
1. Go to Purchase Orders
2. Click on PO-2025-001
3. Click "Download PO" button
4. Wait... nothing happens

Screenshots: [Attached]

Browser: Chrome 120.0.6099.129
Time: November 17, 2025, 2:30 PM
Frequency: Happens every time I try
```

### 9.5 Feature Requests

**Submit a Feature Request:**

1. Go to Support
2. Select "Feature Request" category
3. Describe the feature
4. Explain the benefit
5. Submit for review

**Feature Request Guidelines:**

- Be specific about the functionality
- Explain how it would help your work
- Provide examples if possible
- Consider impact on other users

---

## 10. Frequently Asked Questions (FAQ)

### General Questions

**Q: How do I change my password?**
A: Use the "Forgot Password?" link on the login page to reset your password. You'll receive a reset email with instructions.

**Q: Can I access the system from my phone?**
A: Yes, the system is mobile-responsive and can be accessed from smartphones and tablets.

**Q: How long can I stay logged in?**
A: Sessions timeout after 30 minutes of inactivity for security. You'll need to log in again.

**Q: Can I have multiple accounts?**
A: No, each user should have only one account. Contact your administrator if you need role changes.

**Q: Is my data secure?**
A: Yes, the system uses encryption, secure sessions, and follows data protection best practices.

### Purchase Requests

**Q: How long does it take for a request to be approved?**
A: Administrators typically review requests within 24 hours during business days.

**Q: Can I edit a request after submission?**
A: No, you cannot edit a submitted request. If changes are needed, contact your administrator or submit a new request.

**Q: Can I cancel a request?**
A: Contact your administrator to cancel a pending request. Approved requests cannot be cancelled.

**Q: Why was my request rejected?**
A: Check the request details for the rejection reason provided by the administrator. You can contact them for clarification.

**Q: How many items can I add to one request?**
A: There's no limit, but group related items in one request for efficiency.

### Purchase Orders

**Q: Who can create purchase orders?**
A: Only administrators can create purchase orders from approved requests.

**Q: Can I download documents for any purchase order?**
A: You can download documents for purchase orders related to your requests. Admins can download all documents.

**Q: What's the difference between RIS, ICS, IAR, and PAR?**
A: See Section 7.1 for detailed descriptions of each document type.

**Q: How do I get a signed copy of documents?**
A: Download the PDF, print it, and obtain required signatures manually. Upload signed copies if needed.

### Inventory

**Q: Can regular users view inventory?**
A: Users can view inventory levels but cannot modify them. Only admins can manage inventory.

**Q: How often is inventory updated?**
A: Inventory updates in real-time when stock in/out transactions are recorded.

**Q: What happens when stock is low?**
A: The system shows low stock alerts on the dashboard, and administrators are notified.

**Q: Can I export inventory data?**
A: Yes, administrators can export inventory reports to Excel or CSV format.

### Documents

**Q: Are documents legally binding?**
A: Digital documents serve as official records. Signed printed copies may be required for some transactions.

**Q: How long are documents stored?**
A: Documents are stored indefinitely in the system. Follow your organization's retention policy for physical copies.

**Q: Can I regenerate a document?**
A: Yes, you can regenerate PDFs anytime. The data comes from the current database record.

**Q: What if a PDF won't open?**
A: Ensure you have a PDF reader installed (Adobe Acrobat Reader is recommended). Try a different browser.

### Technical

**Q: Which browsers are supported?**
A: Chrome (recommended), Firefox, Edge, and Safari. Always use the latest version.

**Q: Do I need to install any software?**
A: No, it's a web-based system. You only need a browser and PDF reader.

**Q: Can I use the system offline?**
A: No, an internet connection is required to access the system.

**Q: How do I clear my browser cache?**
A: See Section 9.2 for browser-specific instructions.

**Q: Is there a mobile app?**
A: Not currently, but the web interface works well on mobile browsers.

---

## 11. Appendix

### 11.1 Glossary of Terms

**Administrator (Admin)**: User with elevated permissions to manage the system

**Category**: Classification or grouping of products (e.g., Office Supplies, Equipment)

**Dashboard**: Main overview page showing key metrics and quick actions

**Entity**: A database object such as a product, request, or order

**Grand Total**: Sum of all item costs in a request or order

**IAR**: Inspection and Acceptance Report - document for recording delivery inspection

**ICS**: Inventory Custodian Slip - document for assigning inventory to custodian

**Incoming**: Status for newly submitted purchase requests awaiting review

**PAR**: Property Acknowledgement Receipt - document for acknowledging property receipt

**PO**: Purchase Order - official order document sent to suppliers

**PR**: Purchase Request - initial request for procurement

**RIS**: Requisition and Issue Slip - document for requesting stock from warehouse

**SKU**: Stock Keeping Unit - unique identifier for each product

**SPMO**: Supply and Property Management Office

**Stock In**: Transaction for receiving new inventory

**Stock Out**: Transaction for issuing inventory

**Supplier**: Vendor or company that provides products/services

**TIN**: Tax Identification Number

**Unit**: Standard measure for quantities (e.g., piece, box, ream, liter)

**Unit Cost**: Price per single unit of an item

### 11.2 Keyboard Shortcuts

| Shortcut         | Action                               |
| ---------------- | ------------------------------------ |
| Ctrl + S         | Save current form (where applicable) |
| Ctrl + P         | Print current page                   |
| Ctrl + F         | Find on page                         |
| Esc              | Close modal/dialog                   |
| Tab              | Navigate between fields              |
| Shift + Tab      | Navigate backward between fields     |
| Enter            | Submit form (when in input field)    |
| F5               | Refresh page                         |
| Ctrl + R         | Refresh page                         |
| Ctrl + Shift + R | Hard refresh (clear cache)           |
| Ctrl + +         | Zoom in                              |
| Ctrl + -         | Zoom out                             |
| Ctrl + 0         | Reset zoom                           |

### 11.3 Status Indicators

**Purchase Request Status:**

- 🟡 **Incoming**: Submitted, awaiting review
- 🟢 **Approved**: Approved by administrator
- 🔴 **Rejected**: Not approved
- 🔵 **Completed**: Purchase order created

**User Account Status:**

- 🟢 **Active**: Can log in and use system
- 🔴 **Inactive**: Cannot log in
- 🟠 **Pending**: Account setup not completed

**Stock Status:**

- 🟢 **In Stock**: Adequate quantity available
- 🟡 **Low Stock**: Below minimum level
- 🔴 **Out of Stock**: Zero quantity

**Support Ticket Status:**

- 🟠 **Open**: Ticket submitted, not yet reviewed
- 🟡 **In Progress**: Being worked on
- 🟢 **Resolved**: Issue fixed
- 🔴 **Closed**: Ticket closed

### 11.4 System Limits

**File Upload:**

- Maximum file size: 10 MB
- Allowed formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- Maximum attachments per support ticket: 5 files

**Data Entry:**

- Maximum items per purchase request: 100
- Maximum characters in description fields: 1000
- Email length: 255 characters
- Password length: Minimum 8 characters

**Rate Limits:**

- Login attempts: 5 per minute
- Password reset requests: 3 per minute
- API requests: 60 per minute

### 11.5 Best Practices

**For All Users:**
✅ Log out when finished, especially on shared computers  
✅ Keep your password secure and don't share it  
✅ Use a strong, unique password  
✅ Check email notifications regularly  
✅ Report issues promptly to support  
✅ Keep your profile information up to date  
✅ Use descriptive names when creating requests  
✅ Add detailed item descriptions  
✅ Review all data before submitting  
✅ Download and save important documents

**For Administrators:**
✅ Review purchase requests within 24 hours  
✅ Provide clear rejection reasons  
✅ Verify all information before creating purchase orders  
✅ Keep supplier information current  
✅ Monitor inventory levels regularly  
✅ Generate regular reports for management  
✅ Conduct periodic user access reviews  
✅ Back up important documents  
✅ Document system changes and customizations  
✅ Train new users properly

**Security Best Practices:**
✅ Never share your login credentials  
✅ Log out after each session  
✅ Use a secure network connection  
✅ Avoid using public computers for sensitive transactions  
✅ Report suspicious activity immediately  
✅ Keep your email password secure  
✅ Review your activity log periodically  
✅ Be cautious of phishing emails  
✅ Lock your computer when stepping away  
✅ Update your password regularly

### 11.6 Document Templates

**Standard Naming Conventions:**

Purchase Requests: `PR-YYYY-NNN`

- Example: PR-2025-001

Purchase Orders: `PO-YYYY-NNN`

- Example: PO-2025-045

Product SKUs: `CAT-XXXX`

- Example: OFF-0012 (Office Supplies)

Supplier Codes: `SUP-XXX`

- Example: SUP-001

**File Naming for Downloads:**

- Purchase Order: `PO-2025-001.pdf`
- RIS Document: `RIS-PO-2025-001.pdf`
- ICS Document: `ICS-PO-2025-001.pdf`
- IAR Document: `IAR-PO-2025-001.pdf`
- PAR Document: `PAR-PO-2025-001.pdf`

### 11.7 Contact Information

**Technical Support:**

- Email: [insert support email]
- Phone: [insert phone number]
- Hours: Monday-Friday, 8:00 AM - 5:00 PM

**System Administrator:**

- Email: [insert admin email]
- Phone: [insert admin phone]

**Supply and Property Management Office:**

- Office: [insert office location]
- Phone: [insert office phone]
- Email: [insert office email]

**Training and Orientation:**

- Contact: [insert training coordinator]
- Email: [insert training email]
- Schedule: [insert training schedule]

### 11.8 Revision History

| Version | Date              | Changes         | Author             |
| ------- | ----------------- | --------------- | ------------------ |
| 1.0     | November 17, 2025 | Initial release | Supply System Team |

---

## Document Information

**Document Title**: Supply and Property Management System - User Manual  
**Organization**: Camarines Norte State College  
**Department**: Supply and Property Management Office  
**Version**: 1.0  
**Status**: Published  
**Classification**: Internal Use  
**Last Review**: November 17, 2025  
**Next Review**: May 17, 2026

---

## Feedback and Suggestions

We value your feedback! If you have suggestions for improving this user manual or the system itself, please contact us:

- Submit feedback through the in-system support form
- Email suggestions to [insert email]
- Participate in user surveys when available

Your input helps us make the system better for everyone.

---

**Thank you for using the Supply and Property Management System!**

For the latest updates and announcements, check the system dashboard or contact your administrator.
