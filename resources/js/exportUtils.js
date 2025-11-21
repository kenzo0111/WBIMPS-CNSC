// Export utilities for Excel and PDF
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'

// Excel export function
export async function downloadExcel(data, filename = 'export.xlsx') {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    // Add data rows
    worksheet.addRows(data)

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    }

    // Auto-fit columns
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

    // Freeze the header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    // Add filters to header row
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(65 + worksheet.columns.length - 1)}1`,
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
