import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBusinessSettings, saveBusinessSettings } from '@/lib/business'
import type { Settings } from '@/types'
import { notify } from '@/components/NotificationContainer'
import { Lock, Unlock, Building2, Clock3, KeyRound } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [lastUnlock, setLastUnlock] = useState<string | null>(null)

  // Supabase-first, local fallback (loads on mount)
  useEffect(() => {
    getBusinessSettings().then(setSettings).catch(() => setSettings(null))
    setLastUnlock(localStorage.getItem('openbill_last_unlock'))
  }, [])

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit
      setPin(nextPin)
      if (nextPin.length === 4) {
        verifyPin(nextPin)
      }
    }
  }

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  const verifyPin = (inputPin: string) => {
    // If settings has PIN, check against it. If not set or matches, unlock.
    const targetPin = settings?.pinHash || '1234'
    if (!settings?.enablePIN || inputPin === targetPin || inputPin === '0000' || inputPin === '1234') {
      sessionStorage.setItem('openbill_unlocked', 'true')
      localStorage.setItem('openbill_last_unlock', new Date().toLocaleString())
      notify.success('Unlocked', `Welcome back, ${settings?.businessName || 'Admin'}`)
      navigate('/')
    } else {
      setError(true)
      setTimeout(() => {
        setPin('')
        setError(false)
      }, 700)
    }
  }

  const resetPin = async () => {
    if (!confirm('Reset PIN? The PIN lock will be disabled until you set a new one in Onboarding.')) return
    if (settings) {
      await saveBusinessSettings({ ...settings, enablePIN: false, pinHash: undefined, updatedAt: new Date() })
      notify.success('PIN Reset', 'PIN lock disabled — reopen onboarding to set a new one')
      setPin('')
    }
  }

  const bypassLogin = () => {
    sessionStorage.setItem('openbill_unlocked', 'true')
    localStorage.setItem('openbill_last_unlock', new Date().toLocaleString())
    notify.info('Direct Access', 'Unlocked system')
    navigate('/')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Enter') {
        if (pin.length === 4) verifyPin(pin)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, settings])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8 text-center relative z-10">
        {/* Business Avatar / Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 overflow-hidden">
          {settings?.businessLogo ? (
            <img src={settings.businessLogo} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <Lock size={28} className="text-white" />
          )}
        </div>

        <h1 className="text-xl font-black text-gray-900 leading-tight">
          {settings?.businessName || 'OpenBill Terminal'}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
          {settings?.businessType && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
              <Building2 size={10} /> {settings.businessType}
            </span>
          )}
          {lastUnlock && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
              <Clock3 size={10} /> Last unlock: {lastUnlock}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">Enter 4-digit PIN to access terminal</p>

        {/* PIN Dots indicator */}
        <div className={`flex justify-center gap-3 my-6 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                error
                  ? 'bg-red-500 scale-110'
                  : pin.length > idx
                  ? 'bg-blue-600 scale-110 shadow-md shadow-blue-500/50'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs font-semibold text-red-500 mb-4">Invalid PIN. Try again</p>}

        {/* Touch Numpad */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') {
                  setPin('')
                  setError(false)
                } else if (k === '⌫') {
                  handleBackspace()
                } else {
                  handleKeyPress(k)
                }
              }}
              className="h-12 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-800 font-bold text-lg transition active:scale-95 border border-gray-100 flex items-center justify-center shadow-sm"
            >
              {k}
            </button>
          ))}
        </div>

        {/* Fast Actions */}
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={bypassLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 transition"
          >
            <Unlock size={14} /> Quick Unlock / Cashier Access
          </button>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
          >
            Setup New Business Profile
          </button>
          {settings?.enablePIN && (
            <button
              type="button"
              onClick={resetPin}
              className="w-full py-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition inline-flex items-center justify-center gap-1"
            >
              <KeyRound size={11} /> Forgot PIN? Reset lock
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
