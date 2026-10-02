import { useState } from 'react'
import { Plus, FileText, ShoppingCart, Package, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { icon: FileText, label: 'New Invoice', to: '/invoices/new', color: 'from-blue-500 to-indigo-500' },
    { icon: ShoppingCart, label: 'POS', to: '/pos', color: 'from-green-500 to-emerald-500' },
    { icon: Package, label: 'Add Product', to: '/products', color: 'from-purple-500 to-pink-500' },
    { icon: Users, label: 'Add Customer', to: '/customers', color: 'from-orange-500 to-red-500' },
  ]

  return (
    <div className="fixed bottom-8 right-8 z-40 no-print">
      {/* Action buttons */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 space-y-3 mb-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="glass-effect px-4 py-2 rounded-xl text-sm font-medium text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                  {action.label}
                </span>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer animate-slide-in-up`}>
                  <Icon className="text-white" size={20} />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-premium-lg hover:shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'rotate-45' : 'hover:scale-110'
        }`}
      >
        <Plus className="text-white" size={28} />
      </button>
    </div>
  )
}
