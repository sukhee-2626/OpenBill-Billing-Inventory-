import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Invoice } from '@/types'

// Generate PDF from invoice
export async function generateInvoicePDF(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Invoice element not found')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const imgWidth = 210 // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  
  return pdf.output('blob')
}

// Download PDF
export async function downloadInvoicePDF(invoice: Invoice, elementId: string) {
  const blob = await generateInvoicePDF(elementId)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${invoice.number}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

// Print thermal receipt (58mm/80mm)
export function printThermalReceipt(invoice: Invoice, width: 58 | 80 = 80) {
  const printWindow = window.open('', '_blank', `width=${width === 58 ? 220 : 300},height=600`)
  if (!printWindow) return

  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${invoice.number}</title>
  <style>
    @media print {
      @page { 
        size: ${width}mm auto;
        margin: 0;
      }
      body { margin: 0; }
    }
    
    body {
      font-family: 'Courier New', monospace;
      font-size: ${width === 58 ? '10px' : '12px'};
      width: ${width}mm;
      margin: 0 auto;
      padding: 5mm;
      line-height: 1.4;
    }
    
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .large { font-size: ${width === 58 ? '14px' : '16px'}; }
    .line { border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .item { margin: 3px 0; }
    .total { font-size: ${width === 58 ? '12px' : '14px'}; font-weight: bold; margin-top: 5px; }
    
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; }
    .qty { text-align: center; width: 15%; }
    .price { text-align: right; width: 30%; }
  </style>
</head>
<body>
  <div class="center bold large">INVOICE</div>
  <div class="center">${invoice.number}</div>
  <div class="center">${new Date(invoice.date).toLocaleString()}</div>
  
  <div class="line"></div>
  
  <table>
    <thead>
      <tr>
        <td class="bold">Item</td>
        <td class="bold qty">Qty</td>
        <td class="bold price">Amount</td>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td class="qty">${item.quantity}</td>
          <td class="price">${invoice.currency} ${item.amount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="line"></div>
  
  <div class="row">
    <span>Subtotal:</span>
    <span>${invoice.currency} ${invoice.subtotal.toFixed(2)}</span>
  </div>
  
  ${invoice.taxes.map(tax => `
    <div class="row">
      <span>${tax.name} (${tax.rate}%):</span>
      <span>${invoice.currency} ${tax.amount.toFixed(2)}</span>
    </div>
  `).join('')}
  
  ${invoice.shipping > 0 ? `
    <div class="row">
      <span>Shipping:</span>
      <span>${invoice.currency} ${invoice.shipping.toFixed(2)}</span>
    </div>
  ` : ''}
  
  <div class="line"></div>
  
  <div class="row total">
    <span>TOTAL:</span>
    <span>${invoice.currency} ${invoice.total.toFixed(2)}</span>
  </div>
  
  ${invoice.amountPaid > 0 ? `
    <div class="row">
      <span>Paid:</span>
      <span>${invoice.currency} ${invoice.amountPaid.toFixed(2)}</span>
    </div>
    <div class="row">
      <span>Balance:</span>
      <span>${invoice.currency} ${(invoice.total - invoice.amountPaid).toFixed(2)}</span>
    </div>
  ` : ''}
  
  <div class="line"></div>
  
  ${invoice.notes ? `
    <div class="center" style="margin-top: 5px; font-size: 10px;">
      ${invoice.notes}
    </div>
  ` : ''}
  
  <div class="center bold" style="margin-top: 10px;">
    Thank You!
  </div>
  
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }
  </script>
</body>
</html>
  `

  printWindow.document.write(receiptHTML)
  printWindow.document.close()
}

// Print A4 invoice
export function printA4Invoice(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('Invoice element not found')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const invoiceHTML = element.innerHTML

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Print Invoice</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Arial, sans-serif; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
  ${document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.outerHTML)}
</head>
<body>
  ${invoiceHTML}
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }
  </script>
</body>
</html>
  `)

  printWindow.document.close()
}

// ESC/POS Commands for thermal printer (advanced)
export class ThermalPrinter {
  private commands: number[] = []

  // ESC/POS control codes
  private static readonly ESC = 0x1B
  private static readonly GS = 0x1D
  private static readonly LF = 0x0A
  
  init() {
    this.commands.push(ThermalPrinter.ESC, 0x40) // Initialize
    return this
  }

  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      this.commands.push(str.charCodeAt(i))
    }
    return this
  }

  newLine(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.commands.push(ThermalPrinter.LF)
    }
    return this
  }

  bold(enable = true) {
    this.commands.push(ThermalPrinter.ESC, 0x45, enable ? 1 : 0)
    return this
  }

  align(alignment: 'left' | 'center' | 'right') {
    const value = alignment === 'left' ? 0 : alignment === 'center' ? 1 : 2
    this.commands.push(ThermalPrinter.ESC, 0x61, value)
    return this
  }

  size(width: number, height: number) {
    const size = ((width - 1) << 4) | (height - 1)
    this.commands.push(ThermalPrinter.GS, 0x21, size)
    return this
  }

  cut() {
    this.commands.push(ThermalPrinter.GS, 0x56, 0x41, 0x03) // Partial cut
    return this
  }

  getBuffer(): Uint8Array {
    return new Uint8Array(this.commands)
  }

  // Send to printer via Web Bluetooth or USB
  async print() {
    // For production: Use Web Bluetooth API or USB API
    // Example: Connect to thermal printer via Bluetooth
    // const device = await navigator.bluetooth.requestDevice({
    //   filters: [{ services: ['printer_service_uuid'] }]
    // })
    // const server = await device.gatt.connect()
    // const service = await server.getPrimaryService('printer_service_uuid')
    // const characteristic = await service.getCharacteristic('printer_characteristic_uuid')
    // await characteristic.writeValue(this.getBuffer())
    
    console.log('Thermal printer commands:', this.getBuffer())
  }
}

// Print invoice to ESC/POS thermal printer
export async function printToThermalPrinter(invoice: Invoice) {
  const printer = new ThermalPrinter()
  
  printer
    .init()
    .align('center')
    .size(2, 2)
    .bold()
    .text('INVOICE')
    .newLine()
    .size(1, 1)
    .text(invoice.number)
    .newLine()
    .text(new Date(invoice.date).toLocaleDateString())
    .newLine(2)
    .align('left')
    .text('--------------------------------')
    .newLine()

  // Items
  invoice.items.forEach(item => {
    printer
      .text(`${item.name}`)
      .newLine()
      .text(`  ${item.quantity} x ${invoice.currency} ${item.rate.toFixed(2)}`)
      .align('right')
      .text(`${invoice.currency} ${item.amount.toFixed(2)}`)
      .newLine()
      .align('left')
  })

  printer
    .text('--------------------------------')
    .newLine()
    .text(`Subtotal: ${invoice.currency} ${invoice.subtotal.toFixed(2)}`)
    .newLine()

  invoice.taxes.forEach(tax => {
    printer.text(`${tax.name}: ${invoice.currency} ${tax.amount.toFixed(2)}`).newLine()
  })

  printer
    .newLine()
    .bold()
    .size(2, 1)
    .text(`TOTAL: ${invoice.currency} ${invoice.total.toFixed(2)}`)
    .newLine(2)
    .size(1, 1)
    .bold(false)
    .align('center')
    .text('Thank You!')
    .newLine(3)
    .cut()

  await printer.print()
}
