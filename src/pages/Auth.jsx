import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSubmit = async () => {
    setError('')
    setInfo('')
    if (!email.trim() || !password.trim()) { setError('请填写邮箱和密码'); return }
    if (password.length < 6) { setError('密码至少 6 位'); return }
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message)
    } else {
      if (!username.trim()) { setError('请填写用户名'); setLoading(false); return }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: username.trim() } },
      })
      if (error) {
        setError(error.message.includes('already registered') ? '该邮箱已注册，请直接登录' : error.message)
      } else if (data?.user && !data.session) {
        // 需要邮箱验证
        setInfo('注册成功！请查收验证邮件后登录。')
        setMode('login')
      }
      // 如果直接有 session，onAuthStateChange 会自动触发
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 70%)' }}>

      {/* Logo */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3 animate-float">⚔️</div>
        <h1 className="text-3xl font-black tracking-wide"
          style={{ textShadow: '0 0 30px rgba(79,158,255,0.4)' }}>
          成长征途
        </h1>
        <p className="text-gray-500 text-sm mt-2">用专注积累，让进步可见</p>
      </div>

      {/* 卡片 */}
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'linear-gradient(135deg,#1a2235,#0f1929)', border: '1px solid rgba(79,158,255,0.2)', boxShadow: '0 0 40px rgba(79,158,255,0.1)' }}>

        {/* Tab */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-2">
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setInfo('') }}
              className={`flex-1 py-2.5 text-sm font-bold transition-all ${
                mode === m ? 'bg-blue-500/30 text-blue-300' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        {/* 用户名（注册时显示）*/}
        {mode === 'register' && (
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="用户名"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-colors" />
          </div>
        )}

        {/* 邮箱 */}
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="邮箱地址" type="email" inputMode="email"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-colors" />
        </div>

        {/* 密码 */}
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={password} onChange={e => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）" type={showPwd ? 'text' : 'password'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-3 text-sm outline-none focus:border-blue-500/50 transition-colors" />
          <button onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* 错误/信息提示 */}
        {error && <p className="text-red-400 text-xs px-1">{error}</p>}
        {info  && <p className="text-green-400 text-xs px-1">{info}</p>}

        {/* 提交 */}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#1a4a8c,#0d2448)', border: '1px solid rgba(79,158,255,0.4)', boxShadow: '0 0 20px rgba(79,158,255,0.15)' }}>
          {loading ? <Loader size={18} className="animate-spin" /> : null}
          {mode === 'login' ? '登录' : '注册并开始'}
        </button>
      </div>

      <p className="text-gray-600 text-xs mt-6 text-center">
        数据安全存储于云端 · 多设备同步
      </p>
    </div>
  )
}
