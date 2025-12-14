import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'

async function generate() {
  const workbook = new ExcelJS.Workbook()

  // Set default font to Times New Roman for the entire workbook
  workbook.creator = 'Supply System'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('RSMI')

  // Set default font for the worksheet
  sheet.properties.defaultFont = {
    name: 'Times New Roman',
    size: 10,
  }

  // Set page setup for proper printing
  sheet.pageSetup = {
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3,
    },
  }

  // Set column widths to match Appendix 64 layout
  sheet.columns = [
    { width: 12 }, // RIS No.
    { width: 15 }, // Responsibility Center Code
    { width: 12 }, // Stock No.
    { width: 35 }, // Item
    { width: 8 }, // Unit
    { width: 12 }, // Quantity Issued
    { width: 10 }, // Unit Cost
    { width: 12 }, // Amount
  ]

  // Row 1: Appendix 64 (right-aligned)
  const appendixRow = sheet.getRow(1)
  appendixRow.getCell(8).value = 'Appendix 64'
  appendixRow.getCell(8).font = {
    name: 'Times New Roman',
    italic: true,
    size: 10,
  }
  appendixRow.getCell(8).alignment = { horizontal: 'right' }

  // Row 2: Empty row

  // Row 3: Main title (centered)
  const titleRow = sheet.getRow(3)
  sheet.mergeCells('A3:H3')
  titleRow.getCell(1).value = 'REPORT OF SUPPLIES AND MATERIALS ISSUED'
  titleRow.getCell(1).font = { name: 'Times New Roman', bold: true, size: 12 }
  titleRow.getCell(1).alignment = { horizontal: 'center' }

  // Row 4: Empty row
  // Row 5: Empty row

  // Row 6: Entity Name and Serial No.
  const entityRow = sheet.getRow(6)
  entityRow.getCell(1).value =
    'Entity Name: ___________________________________'
  entityRow.getCell(1).font = { name: 'Times New Roman', bold: true, size: 9 }

  entityRow.getCell(5).value = 'Serial No. : _______________________'
  entityRow.getCell(5).font = { name: 'Times New Roman', bold: true, size: 9 }

  // Row 7: Fund Cluster and Date
  const fundRow = sheet.getRow(7)
  fundRow.getCell(1).value = 'Fund Cluster: __________________________________'
  fundRow.getCell(1).font = { name: 'Times New Roman', bold: true, size: 9 }

  fundRow.getCell(5).value = 'Date : ___________________________'
  fundRow.getCell(5).font = { name: 'Times New Roman', bold: true, size: 9 }

  // Row 8: Empty row

  // Row 9: Section headers
  const supplySectionRow = sheet.getRow(9)
  sheet.mergeCells('A9:D9')
  supplySectionRow.getCell(1).value =
    'To be filled up by the Supply and/or Property Division/Unit'
  supplySectionRow.getCell(1).font = { name: 'Times New Roman', size: 9 }
  supplySectionRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }

  sheet.mergeCells('E9:H9')
  supplySectionRow.getCell(5).value =
    'To be filled up by the Accounting Division/Unit'
  supplySectionRow.getCell(5).font = { name: 'Times New Roman', size: 9 }
  supplySectionRow.getCell(5).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }

  // Row 10: Column headers
  const headerRow = sheet.getRow(10)
  headerRow.getCell(1).value = 'RIS No.'
  headerRow.getCell(2).value = 'Responsibility Center Code'
  headerRow.getCell(3).value = 'Stock No.'
  headerRow.getCell(4).value = 'Item'
  headerRow.getCell(5).value = 'Unit'
  headerRow.getCell(6).value = 'Quantity Issued'
  headerRow.getCell(7).value = 'Unit Cost'
  headerRow.getCell(8).value = 'Amount'

  // Style column headers
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', bold: true, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  // Add empty rows for items (20 rows for main table)
  for (let i = 0; i < 20; i++) {
    const row = sheet.getRow(11 + i)
    row.getCell(1).value = ''
    row.getCell(2).value = ''
    row.getCell(3).value = ''
    row.getCell(4).value = ''
    row.getCell(5).value = ''
    row.getCell(6).value = ''
    row.getCell(7).value = ''
    row.getCell(8).value = ''

    // Add borders to all cells
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
      cell.font = { name: 'Times New Roman', size: 9 }
    })
  }

  // Row 31: Recapitulation headers
  const recapRow = sheet.getRow(31)
  // Clear all cells first and add borders to entire row
  for (let col = 1; col <= 8; col++) {
    recapRow.getCell(col).value = ''
    recapRow.getCell(col).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
    recapRow.getCell(col).font = { name: 'Times New Roman', size: 9 }
  }

  sheet.mergeCells('B31:C31')
  recapRow.getCell(2).value = 'Recapitulation:'
  recapRow.getCell(2).font = { name: 'Times New Roman', bold: true, size: 9 }
  recapRow.getCell(2).alignment = { horizontal: 'center' }

  sheet.mergeCells('F31:H31')
  recapRow.getCell(6).value = 'Recapitulation:'
  recapRow.getCell(6).font = { name: 'Times New Roman', bold: true, size: 9 }
  recapRow.getCell(6).alignment = { horizontal: 'center' }

  // Row 32: Recapitulation column headers
  const recapHeaderRow = sheet.getRow(32)
  // Clear all cells first and add borders to entire row
  for (let col = 1; col <= 8; col++) {
    recapHeaderRow.getCell(col).value = ''
    recapHeaderRow.getCell(col).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
    recapHeaderRow.getCell(col).font = {
      name: 'Times New Roman',
      bold: true,
      size: 9,
    }
    recapHeaderRow.getCell(col).alignment = { horizontal: 'center' }
  }

  // Set values for recapitulation column headers
  recapHeaderRow.getCell(2).value = 'Stock No.'
  recapHeaderRow.getCell(3).value = 'Quantity'
  recapHeaderRow.getCell(6).value = 'Unit Cost'
  recapHeaderRow.getCell(7).value = 'Total Cost'
  recapHeaderRow.getCell(8).value = 'UACS Object Code'

  // Add empty rows for recapitulation (10 rows)
  for (let i = 0; i < 10; i++) {
    const row = sheet.getRow(33 + i)
    // Clear all cells first
    for (let col = 1; col <= 8; col++) {
      row.getCell(col).value = ''
    }

    // Set values only for recapitulation columns
    row.getCell(2).value = '' // Stock No. under first recapitulation
    row.getCell(3).value = '' // Quantity under first recapitulation
    row.getCell(6).value = '' // Unit Cost under second recapitulation
    row.getCell(7).value = '' // Total Cost under second recapitulation
    row.getCell(8).value = '' // UACS Object Code under second recapitulation

    // Add borders to ALL cells in the row (columns A-H)
    for (let col = 1; col <= 8; col++) {
      row.getCell(col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
      row.getCell(col).font = { name: 'Times New Roman', size: 9 }
    }
  }

  // Row 43: Posted by section
  const postedRow = sheet.getRow(43)
  sheet.mergeCells('E43:H43')
  postedRow.getCell(5).value = 'Posted by:'
  postedRow.getCell(5).font = { name: 'Times New Roman', bold: true, size: 9 }
  postedRow.getCell(5).alignment = { horizontal: 'center' }

  // Row 44: Certification text
  const certRow = sheet.getRow(44)
  sheet.mergeCells('A44:D44')
  certRow.getCell(1).value =
    'I hereby certify to the correctness of the above information.'
  certRow.getCell(1).font = { name: 'Times New Roman', size: 9 }

  // Row 45: Signature lines
  const sigRow1 = sheet.getRow(45)
  sheet.mergeCells('A45:D45')
  sigRow1.getCell(1).value = '_____________________________________________'
  sigRow1.getCell(1).font = { name: 'Times New Roman', size: 9 }

  sheet.mergeCells('E45:G45')
  sigRow1.getCell(5).value = '__________________________'
  sigRow1.getCell(5).font = { name: 'Times New Roman', size: 9 }

  sigRow1.getCell(8).value = '______________'
  sigRow1.getCell(8).font = { name: 'Times New Roman', size: 9 }

  // Row 46: Signature labels
  const sigRow2 = sheet.getRow(46)
  sheet.mergeCells('B46:D46')
  sigRow2.getCell(2).value =
    'Signature over Printed Name of Supply and/or Property Custodian'
  sigRow2.getCell(2).font = { name: 'Times New Roman', size: 9 }

  sheet.mergeCells('F46:G46')
  sigRow2.getCell(6).value =
    'Signature over Printed Name of Designated Accounting Staff'
  sigRow2.getCell(6).font = { name: 'Times New Roman', size: 9 }

  sigRow2.getCell(8).value = 'Date'
  sigRow2.getCell(8).font = { name: 'Times New Roman', size: 9 }

  // Row 47: Merged empty row with borders
  const row47 = sheet.getRow(47)
  sheet.mergeCells('A47:H47')
  row47.getCell(1).value = ''
  row47.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }
  row47.getCell(1).font = { name: 'Times New Roman', size: 9 }

  // Extend column E and H borders to row 47
  row47.getCell(5).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }
  row47.getCell(8).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }

  // Create storage/app/templates directory if it doesn't exist
  const storageTemplatesDir = path.join(
    process.cwd(),
    'storage',
    'app',
    'templates'
  )
  if (!fs.existsSync(storageTemplatesDir)) {
    fs.mkdirSync(storageTemplatesDir, { recursive: true })
  }

  const outFile = path.join(storageTemplatesDir, 'rsmi_template.xlsx')
  await workbook.xlsx.writeFile(outFile)
  console.log('Wrote RSMI template to', outFile)
}

generate().catch(console.error)
