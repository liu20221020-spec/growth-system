import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import useStore from './store/useStore'
import BottomNav from './components/layout/BottomNav'
import NotificationToast from './components/ui/NotificationToast'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Focus from './pages/Focus'
import Policies from './pages/Policies'
import Expenses from './pages/Expenses'
import Summary from './pages/Summary'
import LaneDetail from './pages/LaneDetail'

export default function App() {
  const { session, loading } = useAuth()
  const { loadFromSupabase, resetStore, dataLoaded } = useStore()

  // session 变化时加载/清除数据
  useEffect(() => {
    if (session?.user) {
      loadFromSupabase(session.user.id)
    } else if (session === null) {
      resetStore()
    }
  }, [session?.user?.id])

  // ── 加载中 ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#0a0e1a' }}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⚔️</div>
          <div className="text-gray-500 text-sm">正在初始化...</div>
        </div>
      </div>
    )
  }

  // ── 未登录 ─────────────────────────────────────────────
  if (!session) return <Auth />

  // ── 数据加载中 ─────────────────────────────────────────
  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#0a0e1a' }}>
        <div className="text-center space-y-3">
          <div className="text-4xl animate-float">📡</div>
          <div className="text-gray-400 text-sm">正在从云端加载数据...</div>
          <div className="text-xs text-gray-600">{session.user.email}</div>
        </div>
      </div>
    )
  }

  // ── 已登录，主应用 ─────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      <NotificationToast />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/lane/:id" element={<LaneDetail />} />
      </Routes>
      <BottomNav />
      {/* 右上角登出按钮（小字，不打扰） */}
      <LogoutButton email={session.user.email} />
    </div>
  )
}

function LogoutButton({ email }) {
  return (
    <button
      onClick={() => supabase.auth.signOut()}
      className="fixed top-3 right-4 text-[10px] text-gray-600 hover:text-gray-400 transition-colors z-30"
      title={email}>
      退出
    </button>
  )
}
