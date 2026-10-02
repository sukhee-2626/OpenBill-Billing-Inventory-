import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeGeneratorProps {
  value: string
  width?: number
  height?: number
  displayValue?: boolean
}

export default function BarcodeGenerator({ value, width = 2, height = 50, displayValue = true }: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue
        })
      } catch (error) {
        console.error('Barcode generation error:', error)
      }
    }
  }, [value, width, height, displayValue])

  if (!value) return null

  return <canvas ref={canvasRef} />
}
