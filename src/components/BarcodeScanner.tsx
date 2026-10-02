import { Button } from './ui/button'

export default function BarcodeScanner() {
  const handleClick = () => {
    alert('Camera barcode scanning coming soon. Please use manual entry or external scanner.')
  }

  return (
    <Button onClick={handleClick} variant="outline">
      📷 Scan Barcode
    </Button>
  )
}

// ponytail: Real implementation needs:
// - navigator.mediaDevices.getUserMedia for camera access
// - @zxing/browser for barcode detection
// - Permissions handling
// - Add when hardware/camera needed
