# Purchase Order Procurement Auto-Logic Implementation

## Overview

Implemented automatic form checkbox selection logic for Purchase Order wizard step 3 when ordering new items (procurement).

## Implementation Date

November 4, 2025

## Feature Description

### Use Case: Ordering a New Item (Procurement)

When a user is creating a purchase order for **new items being procured** (items not yet in inventory), the system now automatically manages the required forms based on the item's characteristics.

## Auto-Logic Rules

### Trigger Conditions

The automatic logic is triggered when:

- **Stock # (Stock Property Number) is blank/empty** (indicates a new item being purchased)
- AND any of these fields are modified:
  - Stock Property Number field
  - Unit Cost field
  - Quantity field

### Automatic Actions

#### 1. IAR (Inspection and Acceptance Report)

- **Always checked** for new procurement items
- **Reason**: All newly delivered items must go through inspection and acceptance, regardless of type

#### 2. RIS (Requisition and Issue Slip)

- **Always disabled** for new procurement items
- **Reason**: RIS is for requisitions from existing stock, not for procurement

#### 3. PAR vs ICS Selection (Based on Unit Cost)

##### High-Value Items (Unit Cost > ₱50,000)

- ✅ **PAR (Property Acknowledgment Receipt)** - Automatically checked
- ❌ **ICS (Inventory Custodian Slip)** - Automatically unchecked
- **Reason**: Items above ₱50,000 are classified as high-value Property, Plant & Equipment (PPE) and require PAR

##### Semi-Expendable Items (Unit Cost < ₱50,000)

- ✅ **ICS (Inventory Custodian Slip)** - Automatically checked
- ❌ **PAR (Property Acknowledgment Receipt)** - Automatically unchecked
- **Reason**: Items below ₱50,000 are classified as semi-expendable and require ICS

##### No Cost Set (Unit Cost = 0 or empty)

- ❌ **Both PAR and ICS** - Remain unchecked
- **Reason**: Wait for user to enter unit cost before determining classification

## Technical Implementation

### Modified Function

**Function**: `updatePOItem(id, field, value)`
**File**: `resources/js/dashboard.js`
**Lines**: ~10342-10392

### Code Logic

```javascript
// Logic for new item procurement (Stock # is blank)
const stockNumber = (item.stockPropertyNumber || '').trim()
const isNewItem = !stockNumber // Stock # is blank means new item being procured
const unitCost = parseFloat(item.unitCost) || 0

if (
  isNewItem &&
  (field === 'stockPropertyNumber' ||
    field === 'unitCost' ||
    field === 'quantity')
) {
  // For new items (procurement), automatically check IAR
  item.generateIAR = true

  // Disable RIS for procurement items
  item.generateRIS = false

  // Determine PAR vs ICS based on unit cost
  if (unitCost > 50000) {
    // High-value PPE: enable PAR, disable ICS
    item.generatePAR = true
    item.generateICS = false
  } else if (unitCost > 0) {
    // Semi-expendable: enable ICS, disable PAR
    item.generateICS = true
    item.generatePAR = false
  } else {
    // No cost set yet, disable both until cost is entered
    item.generatePAR = false
    item.generateICS = false
  }
}
```

## User Experience Flow

### Example 1: Procuring Office Equipment (₱75,000)

1. User creates new PO item
2. Leaves Stock # **blank** (new procurement)
3. Enters Description: "Desktop Computer"
4. Enters Unit Cost: **₱75,000**
5. **System automatically**:
   - ✅ Checks **IAR** (inspection required)
   - ✅ Checks **PAR** (high-value PPE)
   - ❌ Unchecks **ICS** (not semi-expendable)
   - ❌ Keeps **RIS** unchecked (not requisition)

### Example 2: Procuring Office Supplies (₱15,000)

1. User creates new PO item
2. Leaves Stock # **blank** (new procurement)
3. Enters Description: "Office Chair"
4. Enters Unit Cost: **₱15,000**
5. **System automatically**:
   - ✅ Checks **IAR** (inspection required)
   - ✅ Checks **ICS** (semi-expendable)
   - ❌ Unchecks **PAR** (not high-value)
   - ❌ Keeps **RIS** unchecked (not requisition)

## Benefits

1. **Reduced User Error**: Eliminates manual checkbox selection mistakes
2. **Compliance**: Ensures all procured items follow proper inspection procedures (IAR)
3. **Proper Classification**: Automatically classifies items as PPE (PAR) or semi-expendable (ICS) based on value
4. **Time Savings**: Users don't need to remember which forms apply to which scenarios
5. **Consistency**: Standardizes procurement documentation across all purchase orders

## Form Abbreviations Reference

- **IAR**: Inspection and Acceptance Report
- **RIS**: Requisition and Issue Slip
- **PAR**: Property Acknowledgment Receipt
- **ICS**: Inventory Custodian Slip

## Notes

- Users can still manually override the automatic selections if needed
- The logic only applies to **new items** (blank Stock #)
- For items with existing stock numbers, manual form selection is still available
- The ₱50,000 threshold is based on government procurement classification standards
