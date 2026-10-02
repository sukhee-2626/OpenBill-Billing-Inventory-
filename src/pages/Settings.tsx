import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import type { Settings } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import BackupManager from '@/components/BackupManager'

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.get(1))
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState<Partial<Settings>>({
    businessName: '',
    gstin: '',
    phone: '',
    email: '',
    website: '',
    currency: 'INR',
    taxSystem: 'GST',
    invoicePrefix: 'INV',
    invoiceNumbering: 'auto',
    invoiceAutoResetYearly: false,
    dateFormat: 'DD/MM/YYYY',
    businessAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
  })

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await db.settings.put({
      ...formData,
      id: 1,
      updatedAt: new Date(),
    } as Settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Business Profile</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <ImageUpload
              label="Business Logo"
              value={formData.businessLogo}
              onChange={(base64) => setFormData({ ...formData, businessLogo: base64 })}
            />

            <ImageUpload
              label="Signature"
              value={formData.signatureImage}
              onChange={(base64) => setFormData({ ...formData, signatureImage: base64 })}
            />

            <ImageUpload
              label="Company Stamp/Seal"
              value={formData.stampImage}
              onChange={(base64) => setFormData({ ...formData, stampImage: base64 })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.gstin || ''}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="upiId">UPI ID (for payment QR codes)</Label>
              <Input
                id="upiId"
                placeholder="yourname@upi"
                value={formData.upiId || ''}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="line1">Address Line 1</Label>
              <Input
                id="line1"
                value={formData.businessAddress?.line1 || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessAddress: { ...formData.businessAddress!, line1: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="line2">Address Line 2</Label>
              <Input
                id="line2"
                value={formData.businessAddress?.line2 || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessAddress: { ...formData.businessAddress!, line2: e.target.value },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.businessAddress?.city || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: { ...formData.businessAddress!, city: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.businessAddress?.state || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: { ...formData.businessAddress!, state: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.businessAddress?.pincode || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: { ...formData.businessAddress!, pincode: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.businessAddress?.country || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: { ...formData.businessAddress!, country: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Regional Settings</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="taxSystem">Tax System</Label>
                <Select
                  id="taxSystem"
                  value={formData.taxSystem}
                  onChange={(e) => setFormData({ ...formData, taxSystem: e.target.value as any })}
                >
                  <option value="GST">GST</option>
                  <option value="VAT">VAT</option>
                  <option value="Sales Tax">Sales Tax</option>
                  <option value="Custom">Custom</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                id="dateFormat"
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Invoice Settings</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="invoiceNumbering">Numbering Style</Label>
                <Select
                  id="invoiceNumbering"
                  value={formData.invoiceNumbering}
                  onChange={(e) => setFormData({ ...formData, invoiceNumbering: e.target.value as any })}
                >
                  <option value="auto">Auto-increment</option>
                  <option value="manual">Manual</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoReset"
                checked={formData.invoiceAutoResetYearly}
                onChange={(e) => setFormData({ ...formData, invoiceAutoResetYearly: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="autoReset" className="cursor-pointer">
                Auto-reset numbering yearly
              </Label>
            </div>
          </div>
        </div>

        {/* Backup & Restore */}
        <BackupManager />

        <div className="flex gap-4 items-center">
          <Button type="submit">Save Settings</Button>
          {saved && <span className="text-green-600 font-medium">Settings saved successfully!</span>}
        </div>
      </form>
    </div>
  )
}
