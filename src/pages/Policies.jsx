import { useState } from 'react'
import { Plus, Flame } from 'lucide-react'
import useStore from '../store/useStore'
import dayjs from 'dayjs'

export default function Policies() {
  const { policies, policyGroups, addPolicy, checkPolicy } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const today = dayjs().format('YYYY-MM-DD')
  const isSunday = dayjs().day() === 0

  // 检查是否可以新增（上一条已坚持7天）
  const canAddNew = policies.length === 0 || (() => {
    const last = policies[policies.length - 1]
    if (!last) return true
    const start = dayjs(last.createdAt)
    const days = dayjs().diff(start, 'day')
    return days >= 7 && last.checkedDates?.filter(d => {
      const dd = dayjs(d)
      return dd.diff(start, 'day') < 7
    }).length >= 7
  })()

  // 计算今日点亮率
  const litToday = policies.filter(p => p.checkedDates?.includes(today)).length
  const litRate = policies.length > 0 ? litToday / policies.length : 0

  // 连续天数（简单计算）
  const getStreak = (policy) => {
    let streak = 0
    let d = dayjs()
    while (policy.checkedDates?.includes(d.format('YYYY-MM-DD'))) {
      streak++
      d = d.subtract(1, 'day')
    }
    return streak
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black">国策</h1>
          {isSunday && canAddNew && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #3a1a6c, #1d0d48)', border: '1px solid rgba(159,95,255,0.4)' }}>
              <Plus size={16} /> 新增国策
            </button>
          )}
        </div>

        {/* 今日总览 */}
        {policies.length > 0 && (
          <div className="card-bg rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-300">今日打卡</span>
              <span className="text-sm font-bold" style={{
                color: litRate >= 0.8 ? '#00c853' : litRate >= 0.5 ? '#f5c518' : '#ff4757'
              }}>
                {litToday}/{policies.length}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full progress-bar"
                style={{
                  width: `${litRate * 100}%`,
                  background: litRate >= 0.8 ? 'linear-gradient(90deg, #00c853, #00ff80)' : litRate >= 0.5 ? 'linear-gradient(90deg, #f5c518, #ffd700)' : 'linear-gradient(90deg, #ff4757, #ff6b35)'
                }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {litRate >= 1 ? '🎉 今日全部点亮！+2星+3元/条' : litRate >= 0.8 ? '💪 接近全亮！+1星' : litRate >= 0.5 ? '继续加油，保持现有星数' : '⚠️ 点亮率不足50%，今日-1星'}
            </div>
          </div>
        )}

        {/* 周日提示 */}
        {isSunday && (
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4 text-xs text-purple-300">
            📅 今天是周日，是固定的国策制定日{canAddNew ? '，可以新增一条国策！' : '，上条国策尚未坚持满7天'}
          </div>
        )}

        {/* 国策列表 */}
        <div className="space-y-3">
          {policies.map(p => {
            const isLit = p.checkedDates?.includes(today)
            const streak = getStreak(p)
            return (
              <div key={p.id} className={`rounded-2xl p-4 border transition-all ${
                isLit ? 'bg-green-500/10 border-green-500/30' : 'card-bg border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => !isLit && checkPolicy(p.id)}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isLit ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-green-400 active:scale-90'
                    }`}>
                    {isLit ? <span className="text-lg">✓</span> : <span className="text-gray-400">○</span>}
                  </button>
                  <div className="flex-1">
                    <div className="font-bold">{p.name}</div>
                    {p.desc && <div className="text-xs text-gray-400 mt-0.5">{p.desc}</div>}
                  </div>
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame size={14} />
                    <span className="text-sm font-bold">{streak}</span>
                  </div>
                </div>
                {!isLit && (
                  <div className="mt-3 text-xs text-gray-500">
                    点击打卡 +3元 · 已坚持 {streak} 天
                  </div>
                )}
                {isLit && (
                  <div className="mt-3 text-xs text-green-400">✅ 今日已完成 · 连续 {streak} 天</div>
                )}
              </div>
            )
          })}
          {policies.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-12">
              <div className="text-4xl mb-3">🛡️</div>
              <div>暂无国策</div>
              <div className="text-xs mt-1">每周日可新增一条国策，坚持打卡获得奖励</div>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddPolicyModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function AddPolicyModal({ onClose }) {
  const { addPolicy } = useStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) return
    addPolicy({ name: name.trim(), desc })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg card-bg rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-black">新增国策</h2>
        <div className="text-xs text-gray-400">国策是你希望每天坚持的习惯，每日打卡得3元，连续7天全部点亮得额外30元</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="国策名称，如：今日读书30分钟"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500/50" />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述（可选）"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500/50" />
        <button onClick={handleSubmit} disabled={!name.trim()}
          className="w-full py-3 rounded-xl font-bold text-base disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #3a1a6c, #1d0d48)', border: '1px solid rgba(159,95,255,0.4)' }}>
          确认新增
        </button>
      </div>
    </div>
  )
}
