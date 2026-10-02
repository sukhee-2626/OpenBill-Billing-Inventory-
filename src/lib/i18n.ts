import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      invoices: 'Invoices',
      products: 'Products',
      customers: 'Customers',
      reports: 'Reports',
      settings: 'Settings',
      newInvoice: 'New Invoice',
      total: 'Total',
      subtotal: 'Subtotal',
      save: 'Save',
      cancel: 'Cancel',
      print: 'Print',
      download: 'Download',
      edit: 'Edit',
      delete: 'Delete',
    }
  },
  hi: {
    translation: {
      dashboard: 'डैशबोर्ड',
      invoices: 'चालान',
      products: 'उत्पाद',
      customers: 'ग्राहक',
      reports: 'रिपोर्ट',
      settings: 'सेटिंग्स',
      newInvoice: 'नया चालान',
      total: 'कुल',
      subtotal: 'उप-योग',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      print: 'प्रिंट',
      download: 'डाउनलोड',
      edit: 'संपादित करें',
      delete: 'हटाएं',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
