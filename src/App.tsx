import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import InvoiceCreate from './pages/InvoiceCreate'
import Products from './pages/Products'
import Customers from './pages/Customers'
import CustomerDetails from './pages/CustomerDetails'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import StockMovements from './pages/StockMovements'
import POS from './pages/POS'
import TemplateDesigner from './pages/TemplateDesigner'
import NotificationContainer from './components/NotificationContainer'
import FloatingActionButton from './components/FloatingActionButton'
import ParticlesBackground from './components/ParticlesBackground'
import { seedDatabase } from './db/seed'
import { autoBackup } from './lib/backup'
import './styles/global.css'

function App() {
  useEffect(() => {
    seedDatabase()
    autoBackup()
  }, [])

  return (
    <BrowserRouter>
      <ParticlesBackground />
      <NotificationContainer />
      <Routes>
        <Route path="/" element={<Layout><FloatingActionButton /><Dashboard /></Layout>} />
        <Route path="/pos" element={<POS />} />
        <Route path="/invoices" element={<Layout><FloatingActionButton /><Invoices /></Layout>} />
        <Route path="/invoices/new" element={<Layout><FloatingActionButton /><InvoiceCreate /></Layout>} />
        <Route path="/invoices/:id" element={<Layout><FloatingActionButton /><InvoiceCreate /></Layout>} />
        <Route path="/products" element={<Layout><FloatingActionButton /><Products /></Layout>} />
        <Route path="/customers" element={<Layout><FloatingActionButton /><Customers /></Layout>} />
        <Route path="/customers/:id" element={<Layout><FloatingActionButton /><CustomerDetails /></Layout>} />
        <Route path="/reports" element={<Layout><FloatingActionButton /><Reports /></Layout>} />
        <Route path="/settings" element={<Layout><FloatingActionButton /><Settings /></Layout>} />
        <Route path="/stock" element={<Layout><FloatingActionButton /><StockMovements /></Layout>} />
        <Route path="/templates/:id" element={<Layout><FloatingActionButton /><TemplateDesigner /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
