import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
}

const notifications: Notification[] = []
const listeners: ((notifications: Notification[]) => void)[] = []

export const notify = {
  success: (title: string, message: string, duration = 3000) => {
    addNotification({ type: 'success', title, message, duration })
  },
  error: (title: string, message: string, duration = 5000) => {
    addNotification({ type: 'error', title, message, duration })
  },
  info: (title: string, message: string, duration = 3000) => {
    addNotification({ type: 'info', title, message, duration })
  },
  warning: (title: string, message: string, duration = 4000) => {
    addNotification({ type: 'warning', title, message, duration })
  }
}

function addNotification(notification: Omit<Notification, 'id'>) {
  const newNotification = { ...notification, id: Date.now().toString() }
  notifications.push(newNotification)
  notifyListeners()
  
  if (notification.duration) {
    setTimeout(() => removeNotification(newNotification.id), notification.duration)
  }
}

function removeNotification(id: string) {
  const index = notifications.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.splice(index, 1)
    notifyListeners()
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener([...notifications]))
}

export default function NotificationContainer() {
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([])

  useEffect(() => {
    listeners.push(setActiveNotifications)
    return () => {
      const index = listeners.indexOf(setActiveNotifications)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />
      case 'error': return <AlertCircle size={20} />
      case 'warning': return <AlertTriangle size={20} />
      case 'info': return <Info size={20} />
    }
  }

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50'
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/50'
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/50'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {activeNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`${getStyles(notification.type)} p-4 rounded-xl backdrop-blur-xl border border-white/20 animate-slide-in-right`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(notification.type)}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
              <p className="text-xs opacity-90">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
