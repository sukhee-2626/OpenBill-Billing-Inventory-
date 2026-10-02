import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Download, Upload } from 'lucide-react'
import { exportData, importData } from '@/lib/backup'

export default function BackupManager() {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')

  const handleExport = () => {
    exportData()
    setMessage('Backup downloaded successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string
        await importData(jsonString, 'merge')
        setMessage('Data imported successfully!')
        setTimeout(() => window.location.reload(), 2000)
      } catch (error) {
        setMessage('Import failed: ' + (error as Error).message)
      } finally {
        setImporting(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-xl font-semibold mb-4">Backup & Restore</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Export all your data (invoices, products, customers) to a JSON file
          </p>
          <Button onClick={handleExport} variant="outline">
            <Download size={16} className="mr-2" />
            Export Data
          </Button>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">
            Import data from a backup file. This will merge with existing data.
          </p>
          <label className="inline-block">
            <Button variant="outline" disabled={importing} type="button">
              <Upload size={16} className="mr-2" />
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {message && (
          <div className={`p-3 rounded ${message.includes('failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            💡 Automatic backups are saved locally every 24 hours
          </p>
        </div>
      </div>
    </div>
  )
}
