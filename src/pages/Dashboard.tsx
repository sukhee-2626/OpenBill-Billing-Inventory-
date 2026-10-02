import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, DollarSign, Users, Package, AlertTriangle, ArrowUpRight, Calendar, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const invoices = useLiveQuery(() => db.invoices.toArray()) || []
  const customers = useLiveQuery(() => db.customers.toArray()) || []
  const products = useLiveQuery(() => db.products.toArray()) || []
  
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const today = new Date().toDateString()
  const todayInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === today)
  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const paidToday = todayInvoices.filter(inv => inv.status === 'paid').length
  
  const pendingInvoices = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partial')
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0)
  
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold)
  const outOfStockProducts = products.filter(p => p.stock === 0)
  
  const recentInvoices = invoices.slice(-5).reverse()

  // Calculate week-over-week growth
  const lastWeekStart = new Date()
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekInvoices = invoices.filter(inv => new Date(inv.date) >= lastWeekStart)
  const lastWeekSales = lastWeekInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const previousWeekInvoices = invoices.filter(inv => {
    const date = new Date(inv.date)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return date >= twoWeeksAgo && date < lastWeekStart
  })
  const previousWeekSales = previousWeekInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const growthPercent = previousWeekSales > 0 
    ? ((lastWeekSales - previousWeekSales) / previousWeekSales * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen p-8">
      {/* Header with greeting and time */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                {greeting}! 👋
              </span>
            </h1>
            <p className="text-gray-600 text-lg">Here's what's happening with your business today</p>
          </div>
          <div className="text-right">
            <div className="glass-effect px-6 py-3 rounded-2xl border border-white/30 shadow-premium">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Calendar size={16} />
                <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Enhanced with animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Sales */}
        <div className="glass-effect p-6 rounded-2xl card-premium border border-white/20 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                <DollarSign className="text-white" size={24} />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                <TrendingUp size={14} />
                <span>{paidToday} paid</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Today's Sales</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              {formatCurrency(todaySales)}
            </p>
            <p className="text-xs text-gray-500">{todayInvoices.length} invoices today</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="glass-effect p-6 rounded-2xl card-premium border border-white/20 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-orange-100 text-orange-700 badge-pulse">
                {pendingInvoices.length} pending
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              {formatCurrency(pendingAmount)}
            </p>
            <Link to="/invoices" className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 group/link">
              View all <ArrowUpRight size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="glass-effect p-6 rounded-2xl card-premium border border-white/20 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                <Package className="text-white" size={24} />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                {outOfStockProducts.length} out
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
              {lowStockProducts.length}
            </p>
            <Link to="/products" className="text-xs text-yellow-600 hover:text-yellow-700 flex items-center gap-1 group/link">
              Manage stock <ArrowUpRight size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Total Customers */}
        <div className="glass-effect p-6 rounded-2xl card-premium border border-white/20 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Users className="text-white" size={24} />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                <TrendingUp size={14} />
                +{growthPercent}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Customers</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {customers.length}
            </p>
            <p className="text-xs text-gray-500">Week-over-week growth</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/invoices/new" className="glass-effect p-6 rounded-2xl border border-white/20 shadow-premium hover:shadow-premium-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">New Invoice</h3>
              <p className="text-xs text-gray-500">Create invoice quickly</p>
            </div>
          </div>
        </Link>

        <Link to="/pos" className="glass-effect p-6 rounded-2xl border border-white/20 shadow-premium hover:shadow-premium-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white text-xl">🏪</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">POS Mode</h3>
              <p className="text-xs text-gray-500">Fast retail billing</p>
            </div>
          </div>
        </Link>

        <Link to="/products/new" className="glass-effect p-6 rounded-2xl border border-white/20 shadow-premium hover:shadow-premium-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Package className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">Add Product</h3>
              <p className="text-xs text-gray-500">Manage inventory</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="glass-effect p-6 rounded-2xl border border-white/20 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recent Invoices</h2>
          <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
            View all <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        
        {recentInvoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-5xl mb-3 block">📄</span>
            <p className="text-sm">No invoices yet</p>
            <Link to="/invoices/new" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => {
              const customer = customers.find(c => c.id === invoice.customerId)
              return (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-white/50 hover:bg-white/80 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center font-semibold text-blue-600">
                      {invoice.number.slice(-3)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {customer?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(invoice.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
