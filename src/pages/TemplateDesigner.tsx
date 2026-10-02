import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/db/schema'
import type { Template, TemplateConfig, Invoice, Customer, Settings } from '@/types'
import InvoicePreview from '@/components/InvoicePreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function TemplateDesigner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [config, setConfig] = useState<TemplateConfig>({
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    colors: { primary: '#2563eb', secondary: '#dbeafe', text: '#000000', background: '#ffffff' },
    fonts: { family: 'Arial, sans-serif', size: 10, headerSize: 24 },
    logo: { show: true, position: 'left', maxWidth: 150 },
    header: { layout: 'simple' },
    footer: { show: true, text: 'Thank you for your business!' },
    fields: {
      invoiceNumber: true,
      date: true,
      dueDate: true,
      customerDetails: true,
      itemDescription: true,
      hsn: true,
      quantity: true,
      rate: true,
      discount: true,
      tax: true,
      total: true,
      notes: true,
      terms: true,
      bankDetails: false
    }
  })
  const [sampleInvoice, setSampleInvoice] = useState<Invoice | null>(null)
  const [sampleCustomer, setSampleCustomer] = useState<Customer | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [activeTab, setActiveTab] = useState<'layout' | 'colors' | 'fonts' | 'fields' | 'header'>('layout')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const [tmpl, inv, cust, sett] = await Promise.all([
      id ? db.templates.get(id) : null,
      db.invoices.limit(1).first(),
      db.customers.limit(1).first(),
      db.settings.get(1)
    ])
    
    if (tmpl) {
      setTemplate(tmpl)
      setName(tmpl.name)
      setConfig(tmpl.config)
    }
    
    setSampleInvoice(inv || null)
    setSampleCustomer(cust || null)
    setSettings(sett || null)
  }

  function updateConfig(partial: Partial<TemplateConfig>) {
    setConfig(prev => ({ ...prev, ...partial }))
  }

  function updateColors(key: keyof NonNullable<TemplateConfig['colors']>, value: string) {
    setConfig(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }))
  }

  function updateFonts(key: keyof NonNullable<TemplateConfig['fonts']>, value: string | number) {
    setConfig(prev => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }))
  }

  function updateMargins(key: keyof NonNullable<TemplateConfig['margins']>, value: number) {
    setConfig(prev => ({ ...prev, margins: { ...prev.margins!, [key]: value } }))
  }

  function updateFields(key: string, value: boolean) {
    setConfig(prev => ({ ...prev, fields: { ...prev.fields, [key]: value } }))
  }

  function updateLogo(key: keyof NonNullable<TemplateConfig['logo']>, value: any) {
    setConfig(prev => ({ ...prev, logo: { ...prev.logo!, [key]: value } }))
  }

  function updateFooter(key: keyof NonNullable<TemplateConfig['footer']>, value: any) {
    setConfig(prev => ({ ...prev, footer: { ...prev.footer!, [key]: value } }))
  }

  async function save() {
    if (!name.trim()) return alert('Template name required')
    
    const data: Template = {
      id: template?.id || `t${Date.now()}`,
      name: name.trim(),
      type: 'invoice',
      config,
      isDefault: false,
      createdAt: template?.createdAt || new Date(),
      updatedAt: new Date()
    }
    
    if (template) {
      await db.templates.put(data)
    } else {
      await db.templates.add(data)
    }
    
    navigate('/settings')
  }

  const previewTemplate: Template = {
    id: 'preview',
    name: 'Preview',
    type: 'invoice',
    config,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/settings')}>Back</Button>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Template name"
            className="w-64"
          />
        </div>
        <Button onClick={save}>Save Template</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview */}
        <div className="flex-1 bg-gray-100 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {sampleInvoice && settings && (
              <InvoicePreview 
                invoice={sampleInvoice}
                customer={sampleCustomer || undefined}
                settings={settings}
                template={previewTemplate}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-96 bg-white border-l overflow-auto">
          <div className="flex border-b">
            {['layout', 'colors', 'fonts', 'fields', 'header'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${
                  activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6">
            {activeTab === 'layout' && (
              <>
                <div>
                  <Label>Paper Size</Label>
                  <Select value={config.paperSize} onChange={e => updateConfig({ paperSize: e.target.value as any })}>
                    <option value="A4">A4</option>
                    <option value="A5">A5</option>
                    <option value="Letter">Letter</option>
                    <option value="Thermal58">Thermal 58mm</option>
                    <option value="Thermal80">Thermal 80mm</option>
                  </Select>
                </div>

                <div>
                  <Label>Orientation</Label>
                  <Select value={config.orientation} onChange={e => updateConfig({ orientation: e.target.value as any })}>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </Select>
                </div>

                <div>
                  <Label>Margins (mm)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-xs text-gray-600">Top</label>
                      <Input type="number" value={config.margins?.top || 20} onChange={e => updateMargins('top', +e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Right</label>
                      <Input type="number" value={config.margins?.right || 20} onChange={e => updateMargins('right', +e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Bottom</label>
                      <Input type="number" value={config.margins?.bottom || 20} onChange={e => updateMargins('bottom', +e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Left</label>
                      <Input type="number" value={config.margins?.left || 20} onChange={e => updateMargins('left', +e.target.value)} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'colors' && (
              <>
                <div>
                  <Label>Primary Color</Label>
                  <Input type="color" value={config.colors?.primary || '#2563eb'} onChange={e => updateColors('primary', e.target.value)} />
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <Input type="color" value={config.colors?.secondary || '#dbeafe'} onChange={e => updateColors('secondary', e.target.value)} />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input type="color" value={config.colors?.text || '#000000'} onChange={e => updateColors('text', e.target.value)} />
                </div>
                <div>
                  <Label>Background</Label>
                  <Input type="color" value={config.colors?.background || '#ffffff'} onChange={e => updateColors('background', e.target.value)} />
                </div>
              </>
            )}

            {activeTab === 'fonts' && (
              <>
                <div>
                  <Label>Font Family</Label>
                  <Select value={config.fonts?.family || 'Arial, sans-serif'} onChange={e => updateFonts('family', e.target.value)}>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Courier New, monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                  </Select>
                </div>
                <div>
                  <Label>Body Font Size (pt)</Label>
                  <Input type="number" value={config.fonts?.size || 10} onChange={e => updateFonts('size', +e.target.value)} />
                </div>
                <div>
                  <Label>Header Font Size (pt)</Label>
                  <Input type="number" value={config.fonts?.headerSize || 24} onChange={e => updateFonts('headerSize', +e.target.value)} />
                </div>
              </>
            )}

            {activeTab === 'fields' && (
              <div className="space-y-3">
                {Object.keys(config.fields || {}).map(field => (
                  <label key={field} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={config.fields?.[field] || false}
                      onChange={e => updateFields(field, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'header' && (
              <>
                <div>
                  <Label>Header Layout</Label>
                  <Select value={config.header?.layout || 'simple'} onChange={e => updateConfig({ header: { layout: e.target.value as any } })}>
                    <option value="simple">Simple</option>
                    <option value="split">Split</option>
                    <option value="centered">Centered</option>
                  </Select>
                </div>

                <div>
                  <Label>Logo Position</Label>
                  <Select value={config.logo?.position || 'left'} onChange={e => updateLogo('position', e.target.value)}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </Select>
                </div>

                <div>
                  <Label>Logo Max Width (px)</Label>
                  <Input type="number" value={config.logo?.maxWidth || 150} onChange={e => updateLogo('maxWidth', +e.target.value)} />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={config.footer?.show || false}
                      onChange={e => updateFooter('show', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Show Footer</span>
                  </label>
                </div>

                {config.footer?.show && (
                  <div>
                    <Label>Footer Text</Label>
                    <Input 
                      value={config.footer?.text || ''} 
                      onChange={e => updateFooter('text', e.target.value)}
                      placeholder="Thank you for your business!"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
