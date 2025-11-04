# Purchase Order PDF Generation from Database

This guide explains how to generate PDF documents from Purchase Order records stored in the database.

## Overview

The Purchase Order system now supports generating PDFs directly from database records, allowing you to:

- View/preview purchase orders as PDFs in the browser
- Download purchase orders as PDF files
- Automatically populate PDF templates with database data

## Features Implemented

### 1. **View/Preview Purchase Order PDF**

- **Route**: `GET /purchase-order/view/{id}`
- **Method**: `PurchaseOrderController@preview`
- **Description**: Streams the PDF to the browser for preview
- **Example**: `http://localhost:8000/purchase-order/view/1`

### 2. **Download Purchase Order PDF**

- **Route**: `GET /purchase-order/{id}/pdf`
- **Method**: `PurchaseOrderController@downloadPDF`
- **Description**: Downloads the PDF file
- **Example**: `http://localhost:8000/purchase-order/1/pdf`

### 3. **Generate PDF from Form Data** (Existing)

- **Route**: `POST /purchase-order/generate`
- **Method**: `PurchaseOrderController@generatePDF`
- **Description**: Generates PDF from POST request data (form submission)

## Database Structure

The Purchase Order model (`purchase_orders` table) contains the following fields:

```
- id: Primary key
- po_number: Purchase order number (unique)
- supplier: Supplier name
- supplier_address: Supplier address
- date_of_purchase: Date of purchase
- tin_number: Tax Identification Number
- mode_of_procurement: Procurement mode
- place_of_delivery: Delivery location
- delivery_term: Delivery terms
- date_of_delivery: Expected delivery date
- payment_term: Payment terms
- items: JSON array of items
- grand_total: Total amount
- fund_cluster: Fund source
- ors_burs_no: ORS/BURS number
- funds_available: Available funds
- ors_burs_date: ORS/BURS date
- ors_burs_amount: ORS/BURS amount
- accountant_signature: Accountant signature
- entity_name: Organization name
- entity_address: Organization address
- status: Order status
- department: Department
- gentlemen: Gentlemen field
- notes: Additional notes
```

## Items Array Structure

The `items` field is a JSON array where each item contains:

```json
{
  "stockPropertyNumber": "1",
  "unit": "lot",
  "description": "Item description",
  "detailedDescription": "Detailed description",
  "quantity": 500,
  "unitCost": 250,
  "amount": 125000,
  "generateICS": 1,
  "generateRIS": 1,
  "generatePAR": 1,
  "generateIAR": 1
}
```

The system automatically maps these fields to the PDF template format:

- `stockPropertyNumber` → `stock_number`
- `unitCost` → `unit_cost`
- Other fields remain the same

## Usage Examples

### From Frontend (JavaScript/Fetch)

#### Preview PDF in Browser

```javascript
// Open in new window/tab
window.open('/purchase-order/view/1', '_blank')

// Or using fetch to get PDF blob
fetch('/purchase-order/view/1')
  .then((response) => response.blob())
  .then((blob) => {
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  })
```

#### Download PDF

```javascript
// Simple redirect to download
window.location.href = '/purchase-order/1/pdf'

// Or create download link
const link = document.createElement('a')
link.href = '/purchase-order/1/pdf'
link.download = 'purchase_order.pdf'
link.click()
```

### From Backend (PHP/Laravel)

#### Generate PDF from Controller

```php
use App\Http\Controllers\PurchaseOrderController;

// In a route or controller
public function myMethod($id)
{
    $controller = new PurchaseOrderController();

    // Preview/stream PDF
    return $controller->preview($id);

    // Or download PDF
    return $controller->downloadPDF($id);
}
```

#### Using Route Helper

```php
// Redirect to preview
return redirect()->route('purchaseOrderView', ['id' => 1]);

// Generate URL
$previewUrl = route('purchaseOrderView', ['id' => 1]);
$downloadUrl = route('purchase-order.download', ['id' => 1]);
```

### From API

#### Get Purchase Order Data

```bash
# Get purchase order details
curl http://localhost:8000/api/purchase-orders/1

# List all purchase orders
curl http://localhost:8000/api/purchase-orders
```

#### Then Generate PDF

```bash
# Preview PDF
curl http://localhost:8000/purchase-order/view/1 --output preview.pdf

# Download PDF
curl http://localhost:8000/purchase-order/1/pdf --output purchase_order.pdf
```

## PDF Template

The PDF template (`resources/views/pdf/purchase_order_pdf.blade.php`) uses the following data structure:

```php
[
    'supplier' => 'Supplier Name',
    'supplier_address' => 'Address',
    'po_number' => '2025-11-041',
    'date_of_purchase' => '2025-11-04',
    'tin_number' => '123-456-345',
    'mode_of_procurement' => 'Medium Value Procurement',
    'place_of_delivery' => 'CNSC',
    'delivery_term' => 'FOB Destination',
    'date_of_delivery' => '2025-11-15',
    'payment_term' => '30 days',
    'items' => [
        [
            'stock_number' => '1',
            'unit' => 'lot',
            'description' => 'Item description',
            'quantity' => 500,
            'unit_cost' => 250,
            'amount' => 125000
        ]
    ],
    'grand_total' => 125000,
    'fund_cluster' => '05 - Income Generated Fund',
    'ors_burs_no' => 'ORS-123',
    'funds_available' => 'Yes',
    'ors_burs_date' => '2025-11-04',
    'ors_burs_amount' => 125000,
    'accountant_signature' => '',
    'entity_name' => 'Camarines Norte State College',
    'entity_address' => 'lot 8, F. Pimentel'
]
```

## Activity Logging

When a PDF is downloaded, the system automatically logs the activity:

```php
[
    'action' => 'Downloaded Purchase Order PDF',
    'meta' => json_encode([
        'po_number' => '2025-11-041',
        'id' => 1
    ])
]
```

## Error Handling

- **404 Error**: If the purchase order ID doesn't exist, the system returns a 404 error
- **Empty Items**: If there are no items, the PDF displays "No items"
- **Missing Fields**: All fields have fallback values or empty strings

## Testing

### Manual Testing

1. Start the Laravel development server:

   ```bash
   php artisan serve
   ```

2. Access the URLs in your browser:
   - Preview: `http://localhost:8000/purchase-order/view/1`
   - Download: `http://localhost:8000/purchase-order/1/pdf`

### Programmatic Testing

```php
// Using tinker
php artisan tinker
>>> $po = \App\Models\PurchaseOrder::first();
>>> echo "PO ID: {$po->id}, Number: {$po->po_number}";
```

## Integration with Frontend

To integrate this with your frontend application:

1. **Fetch purchase orders list**:

   ```javascript
   fetch('/api/purchase-orders')
     .then((response) => response.json())
     .then((data) => {
       // Display list of purchase orders
       data.data.forEach((po) => {
         console.log(`PO #${po.po_number}: ${po.supplier}`)
       })
     })
   ```

2. **Add download/preview buttons**:

   ```html
   <button onclick="viewPDF(1)">Preview PDF</button>
   <button onclick="downloadPDF(1)">Download PDF</button>

   <script>
     function viewPDF(id) {
       window.open(`/purchase-order/view/${id}`, '_blank')
     }

     function downloadPDF(id) {
       window.location.href = `/purchase-order/${id}/pdf`
     }
   </script>
   ```

## Notes

- The PDF generation uses DomPDF library
- PDFs are generated in A4 portrait format
- Date fields are automatically formatted
- Item amounts are calculated automatically
- The system handles both database field names and form field names for items

## Troubleshooting

### PDF Not Generating

- Check if the purchase order exists in the database
- Verify the ID parameter is correct
- Check Laravel logs: `storage/logs/laravel.log`

### Items Not Showing

- Verify the items array structure in the database
- Check if items field is properly cast to array in the model
- Ensure items have required fields (description, quantity, unit_cost)

### Formatting Issues

- Clear the PDF cache: `php artisan cache:clear`
- Check the blade template for syntax errors
- Verify CSS styles in the PDF template

## Future Enhancements

Potential improvements:

- Bulk PDF generation for multiple purchase orders
- Email PDF to supplier
- Digital signature integration
- Custom PDF templates per department
- PDF encryption/password protection
