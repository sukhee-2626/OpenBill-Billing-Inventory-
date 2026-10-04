import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/schema'
import { notify } from '@/components/NotificationContainer'
import { Building2, Receipt, CreditCard, ArrowRight, Check, Sparkles, Upload } from 'lucide-react'
import type { Settings } from '@/types'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('Retail Store')
  const [currency, setCurrency] = useState('INR')
  const [country, setCountry] = useState('India')

  // Step 2: Contact & Tax
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [gstin, setGstin] = useState('')
  const [invoicePrefix, setInvoicePrefix] = useState('INV')

  // Step 3: Payments & Branding
  const [upiId, setUpiId] = useState('')
  const [pin, setPin] = useState('')
  const [logo, setLogo] = useState('')

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setLogo(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFinish = async () => {
    if (!businessName.trim()) {
      notify.error('Required', 'Business name is required')
      setStep(1)
      return
    }

    const newSettings: Settings = {
      id: 1,
      businessName: businessName.trim(),
      businessType,
      isOnboarded: true,
      businessLogo: logo || undefined,
      phone: phone || undefined,
      email: email || undefined,
      gstin: gstin || undefined,
      upiId: upiId || undefined,
      currency,
      taxSystem: 'GST',
      invoicePrefix: invoicePrefix || 'INV',
      invoiceNumbering: 'auto',
      invoiceAutoResetYearly: true,
      locale: 'en',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      enablePIN: pin.length === 4,
      pinHash: pin || undefined,
      businessAddress: {
        line1: line1 || 'Main Market',
        city: city || 'City',
        state: state || 'State',
        pincode: pincode || '000000',
        country,
      },
      updatedAt: new Date(),
    }

    await db.settings.put(newSettings)
    sessionStorage.setItem('openbill_unlocked', 'true')
    notify.success('Welcome to OpenBill!', `${businessName} is ready for billing`)
    navigate('/')
  }

  const inp = 'w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
  const lbl = 'block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8 sm:p-10 relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to OpenBill
          </h1>
          <p className="text-sm text-gray-500 mt-1">Set up your business in under 60 seconds</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[
            { stepNum: 1, title: 'Profile', icon: <Building2 size={16} /> },
            { stepNum: 2, title: 'Tax & Address', icon: <Receipt size={16} /> },
            { stepNum: 3, title: 'Branding & Pay', icon: <CreditCard size={16} /> },
          ].map((s, idx) => (
            <div key={s.stepNum} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  step === s.stepNum
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : step > s.stepNum
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > s.stepNum ? <Check size={16} /> : s.icon}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step >= s.stepNum ? 'text-gray-800' : 'text-gray-400'}`}>
                {s.title}
              </span>
              {idx < 2 && <div className={`w-8 sm:w-12 h-0.5 mx-1 ${step > s.stepNum ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Business Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Enterprises / Nova Store"
                className={inp}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Business Type</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inp}>
                  <option value="Retail Store">Retail Store</option>
                  <option value="Wholesale">Wholesale & Distribution</option>
                  <option value="Restaurant / Cafe">Restaurant / Cafe</option>
                  <option value="Services / Agency">Services / Agency</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inp}>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                  <option value="CAD">CAD (C$) - Canadian Dollar</option>
                </select>
              </div>
            </div>

            <div>
              <label className={lbl}>Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India, United States, UK..."
                className={inp}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!businessName.trim()) {
                  notify.error('Required', 'Please enter your business name')
                  return
                }
                setStep(2)
              }}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:opacity-90 flex items-center justify-center gap-2 transition"
            >
              Continue to Tax & Address <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Contact & Tax */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@apex.com"
                  className={inp}
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Street Address</label>
              <input
                type="text"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="Shop No. 12, Main Street"
                className={inp}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={lbl}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode"
                  className={inp}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABCU9603R1ZX"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>Invoice Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                  placeholder="INV"
                  className={inp}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:opacity-90 flex items-center justify-center gap-2 transition"
              >
                Continue to Branding <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payments & Branding */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>UPI ID (for instant QR billing)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourbusiness@paytm / okaxis"
                className={inp}
              />
              <p className="text-[11px] text-gray-400 mt-1">Generates dynamic UPI QR codes on all invoices & POS</p>
            </div>

            <div>
              <label className={lbl}>Company Logo</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition text-xs font-semibold text-gray-600 bg-gray-50">
                  <Upload size={16} /> Choose Image
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logo ? (
                  <img src={logo} alt="Preview" className="h-10 w-24 object-contain rounded border border-gray-200 p-1" />
                ) : (
                  <span className="text-xs text-gray-400">Optional</span>
                )}
              </div>
            </div>

            <div>
              <label className={lbl}>App Security PIN (Optional)</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN for locking POS & Dashboard"
                className={inp}
              />
              <p className="text-[11px] text-gray-400 mt-1">Leave empty if you do not want PIN lock on start</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-90 flex items-center justify-center gap-2 transition"
              >
                Launch OpenBill <Sparkles size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
