// Export utilities for Excel and PDF
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'

// Excel export function
export async function downloadExcel(
  data,
  filename = 'export.xlsx',
  options = {}
) {
  try {
    const workbook = new ExcelJS.Workbook()
    let worksheet

    // If a template URL is provided, try to load it and use the first worksheet or provided name
    if (options.templateUrl) {
      try {
        const res = await fetch(options.templateUrl, { method: 'GET' })
        if (!res.ok) throw new Error('Failed to fetch template')
        const buffer = await res.arrayBuffer()
        await workbook.xlsx.load(buffer)
        worksheet = options.sheetName
          ? workbook.getWorksheet(options.sheetName) || workbook.worksheets[0]
          : workbook.worksheets[0]
      } catch (e) {
        console.warn(
          'Could not load template, falling back to empty workbook',
          e
        )
        worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1')
      }
    } else {
      worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1')
    }

    // Determine starting row: if we loaded a template and worksheet is non-empty, start after last row
    const startRow =
      options.startRow ||
      (worksheet.actualRowCount ? worksheet.actualRowCount + 1 : 1)
    // If data is an array of arrays or array of objects. If objects, use keys as headers (only when no template)
    if (
      Array.isArray(data) &&
      data.length &&
      data[0] &&
      typeof data[0] === 'object' &&
      !Array.isArray(data[0])
    ) {
      // convert objects to arrays
      let headers = Object.keys(data[0])
      // If template has header and we are using it, don't add headers
      if (!options.templateUrl) {
        worksheet.spliceRows(startRow, 0, headers)
      }
      data.forEach((rowObj, idx) => {
        const row = headers.map((h) => rowObj[h] ?? '')
        worksheet.spliceRows(
          startRow + (options.templateUrl ? idx : idx + 1),
          0,
          row
        )
      })
    } else {
      // array of arrays (or simple 2D), push rows normally
      if (startRow > 1) {
        // append rows so they start at startRow
        // ExcelJS doesn't have direct insert at index, but spliceRows allows it
        data.forEach((row, idx) => {
          worksheet.spliceRows(startRow + idx, 0, row)
        })
      } else {
        worksheet.addRows(data)
      }
    }

    // Style the title row if present
    if (options.hasTitle) {
      const titleRow = worksheet.getRow(1)
      titleRow.font = { bold: true, size: 16 }
      titleRow.alignment = { horizontal: 'center' }
      // Merge cells for title (assuming up to column E)
      const maxCol = worksheet.columns.length
      const endCol = String.fromCharCode(65 + maxCol - 1)
      worksheet.mergeCells(`A1:${endCol}1`)
    }

    // Style the header row if not using a template or override requested
    const headerRowNum = options.hasTitle ? 3 : 1
    const headerRow = worksheet.getRow(options.headerRow || headerRowNum)
    if (!options.templateUrl || options.overrideHeaderStyle) {
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
      }
    }

    // Auto-fit columns (only if not using a template or explicitly requested)
    if (!options.templateUrl || options.autoFitColumns) {
      worksheet.columns.forEach((column) => {
        let maxLength = 0
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10
          if (columnLength > maxLength) {
            maxLength = columnLength
          }
        })
        column.width = Math.min(maxLength + 2, 50) // Cap at 50
      })

      // Freeze the header row (if not using a template and not overridden)
      if (!options.templateUrl || options.freezeHeader) {
        const freezeRow = options.hasTitle ? 3 : 1
        worksheet.views = [{ state: 'frozen', ySplit: freezeRow }]
      }
    }

    // Add filters to header row (only if not using a template or explicitly requested)
    if (!options.templateUrl || options.addFiltersToHeader) {
      const filterStart = options.hasTitle ? 'A3' : 'A1'
      const maxCol = worksheet.columns.length
      const endCol = String.fromCharCode(65 + maxCol - 1)
      worksheet.autoFilter = {
        from: filterStart,
        to: `${endCol}${options.hasTitle ? 3 : 1}`,
      }
    }

    // Apply custom formatting
    if (options.changeColumn) {
      const col = options.changeColumn
      worksheet.getColumn(col).eachCell((cell, rowNumber) => {
        const skipRows = options.hasTitle ? 3 : 2
        if (rowNumber > skipRows && cell.value) {
          const val = cell.value.toString()
          if (val.startsWith('+')) {
            cell.font = { color: { argb: 'FF16A34A' } } // green
          } else if (val.startsWith('-')) {
            cell.font = { color: { argb: 'FFDC2626' } } // red
          }
        }
      })
    }

    if (options.currencyColumns) {
      options.currencyColumns.forEach((col) => {
        worksheet.getColumn(col).eachCell((cell, rowNumber) => {
          const skipRows = options.hasTitle ? 3 : 2
          if (rowNumber > skipRows && typeof cell.value === 'number') {
            cell.numFmt = '"$"#,##0.00'
          }
        })
      })
    }

    if (options.dateColumns) {
      options.dateColumns.forEach((col) => {
        worksheet.getColumn(col).eachCell((cell, rowNumber) => {
          const skipRows = options.hasTitle ? 3 : 2
          if (
            rowNumber > skipRows &&
            cell.value &&
            !isNaN(Date.parse(cell.value))
          ) {
            cell.value = new Date(cell.value)
            cell.numFmt = 'yyyy-mm-dd'
          }
        })
      })
    }

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Error generating Excel file:', error)
    throw error
  }
}

// PDF export function
export async function downloadPDF(elementId, filename = 'export.pdf') {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`)
    }

    const pdf = new jsPDF('p', 'mm', 'a4')
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
