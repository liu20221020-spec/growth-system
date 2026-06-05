import { useEffect } from 'react'
import useStore from '../../store/useStore'

export default function NotificationToast() {
  const notifications = useStore(s => s.notifications)
  const dismiss = useStore(s => s.dismissNotification)

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {notifications.slice(0, 3).map(n => (
        <Toast key={n.id} notification={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  )
}

function Toast({ notification, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="pointer-events-auto bg-gradient-to-r from-[#1a2235] to-[#0f1929] border border-accent-blue/30 rounded-xl px-4 py-3 text-sm text-white shadow-xl"
      style={{ boxShadow: '0 0 20px rgba(79,158,255,0.2)' }}
      onClick={onDismiss}>
      {notification.msg}
    </div>
  )
}
