import { useState } from 'react'
import { Button } from './ui/button'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  label: string
  value?: string
  onChange: (base64: string | undefined) => void
  maxSize?: number // in MB
}

export default function ImageUpload({ label, value, onChange, maxSize = 2 }: ImageUploadProps) {
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSize) {
      setError(`File too large. Max ${maxSize}MB`)
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setError('')

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      onChange(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleClear = () => {
    onChange(undefined)
    setError('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="max-w-xs max-h-32 border rounded" />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-1 right-1"
            onClick={handleClear}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div>
          <label className="inline-block">
            <Button variant="outline" type="button">
              <Upload size={16} className="mr-2" />
              Upload {label}
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-gray-500">Max {maxSize}MB. PNG, JPG, or SVG</p>
    </div>
  )
}
