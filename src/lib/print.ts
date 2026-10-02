export function printInvoice(elementId: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const element = document.getElementById(elementId)
  if (!element) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Invoice</title>
        <style>
          @page { margin: 0; }
          body { margin: 0; padding: 0; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

export function downloadPDF(elementId: string, _filename: string) {
  // ponytail: Real PDF generation needs pdf-lib or jspdf
  // For now, trigger print dialog
  printInvoice(elementId)
}
