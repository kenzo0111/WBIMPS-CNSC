import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'

async function generate() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('RSMI')

  // Header row
  const header = [
    'RIS No.',
    'Responsibility Center Code',
    'Stock Property No.',
    'Item Description',
    'Unit',
    'Quantity Issued',
    'Unit Cost',
    'Amount',
  ]
  sheet.addRow(header)

  // example metadata rows (optional)
  sheet.getCell('A1').font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F81BD' },
  }

  // Sample placeholder
  sheet.addRow(['', '', '', '', '', '', '', ''])

  // Auto width
  sheet.columns.forEach((col) => {
    let maxLength = 10
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? cell.value.toString().length : 10
      if (len > maxLength) maxLength = len
    })
    col.width = Math.min(maxLength + 2, 60)
  })

  const outDir = path.join(process.cwd(), 'public', 'templates')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const outFile = path.join(outDir, 'rsmi-template.xlsx')
  await workbook.xlsx.writeFile(outFile)
  console.log('Wrote template to', outFile)
}

generate().catch((e) => {
  console.error(e)
  process.exit(1)
})
