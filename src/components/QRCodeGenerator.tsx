import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeGeneratorProps {
  value: string
  size?: number
}

export default function QRCodeGenerator({ value, size = 150 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1
      })
    }
  }, [value, size])

  if (!value) return null

  return <canvas ref={canvasRef} />
}

export function generateUPIQR(upiId: string, businessName: string, amount: number, invoiceNumber: string): string {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount.toFixed(2)}&tn=${encodeURIComponent('Invoice ' + invoiceNumber)}&cu=INR`
}
