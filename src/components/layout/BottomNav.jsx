import { NavLink } from 'react-router-dom'
import { Home, Target, Zap, Shield, Wallet, BarChart2 } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: '主页' },
  { to: '/tasks', icon: Target, label: '任务' },
  { to: '/focus', icon: Zap, label: '专注' },
  { to: '/policies', icon: Shield, label: '国策' },
  { to: '/expenses', icon: Wallet, label: '收支' },
  { to: '/summary', icon: BarChart2, label: '总结' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{ background: 'linear-gradient(to top, #060c18, #0a0e1a)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
                isActive
                  ? 'text-[#4f9eff]'
                  : 'text-gray-500 hover:text-gray-300'
              }`
            }>
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-blue-500/20' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
