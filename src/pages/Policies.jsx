import { useState, useMemo } from 'react'
import { Plus, Flame, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import useStore from '../store/useStore'
import dayjs from 'dayjs'

// ── 连续天数计算 ──────────────────────────────────────────────
function getStreak(policy) {
  const dates  = policy.checkedDates || []
  const today  = dayjs().format('YYYY-MM-DD')
  const yest   = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  // 从今天或昨天开始往前数（今天未打卡但昨天打过，不清零）
  let start = dates.includes(today) ? dayjs() : (dates.includes(yest) ? dayjs().subtract(1, 'day') : null)
  if (!start) return 0
  let n = 0, d = start
  while (dates.includes(d.format('YYYY-MM-DD'))) { n++; d = d.subtract(1, 'day') }
  return n
}

function getBestStreak(policy) {
  const sorted = [...new Set(policy.checkedDates || [])].sort()
  let best = 0, cur = 0
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || dayjs(sorted[i]).diff(dayjs(sorted[i - 1]), 'day') === 1) { cur++; best = Math.max(best, cur) }
    else cur = 1
  }
  return best
}

// ── 今日点亮率奖励文案 ───────────────────────────────────────
function getRateDesc(litCount, total) {
  if (total === 0) return ''
  const rate = litCount / total
  if (rate >= 1 && total > 5) return '🏅 全部点亮！今日 +2星'
  if (rate >= 0.8)            return '💪 ≥80%！今日 +1星'
  if (rate >= 0.5)            return '📌 50-79%，星数不变'
  return '⚠️ 不足50%，今日 -1星'
}

export default function Policies() {
  const { policies, addPolicy, checkPolicy } = useStore()
  const [showAdd, setShowAdd]     = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const today   = dayjs().format('YYYY-MM-DD')
  const isSunday = dayjs().day() === 0

  // 可以新增：首条 or 最新一条坚持满7天
  const canAddNew = policies.length === 0 || (() => {
    const last = [...policies].sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt))).find(Boolean)
    if (!last) return true
    const days = dayjs().diff(dayjs(last.createdAt), 'day')
    return days >= 7 && (last.checkedDates?.filter(d => dayjs(d).diff(dayjs(last.createdAt), 'day') < 7).length || 0) >= 7
  })()

  // 按 groupName 分组，保持创建顺序
  const groups = useMemo(() => {
    const map = {}
    policies.forEach(p => {
      const g = p.groupName || '默认'
      if (!map[g]) map[g] = []
      map[g].push(p)
    })
    return Object.entries(map)  // [['组名', [policy...]], ...]
  }, [policies])

  // 全局今日进度
  const litTotal  = policies.filter(p => p.checkedDates?.includes(today)).length
  const litRate   = policies.length > 0 ? litTotal / policies.length : 0

  const toggleGroup = (g) => setCollapsed(prev => ({ ...prev, [g]: !prev[g] }))

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">
        {/* 标题栏 */}
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

        {/* 全局今日总览 */}
        {policies.length > 0 && (
          <div className="card-bg rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-300">今日打卡总览</span>
              <span className="text-sm font-bold" style={{
                color: litRate >= 0.8 ? '#00c853' : litRate >= 0.5 ? '#f5c518' : '#ff4757'
              }}>{litTotal}/{policies.length}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full progress-bar transition-all" style={{
                width: `${litRate * 100}%`,
                background: litRate >= 0.8
                  ? 'linear-gradient(90deg, #00c853, #00ff80)'
                  : litRate >= 0.5
                    ? 'linear-gradient(90deg, #f5c518, #ffd700)'
                    : 'linear-gradient(90deg, #ff4757, #ff6b35)',
              }} />
            </div>
            <div className="text-xs text-gray-400">{getRateDesc(litTotal, policies.length)}</div>
          </div>
        )}

        {/* 周日提示 */}
        {isSunday && (
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4 text-xs text-purple-300">
            📅 今天是周日{canAddNew ? '，可以新增国策！' : '，最新国策尚未坚持满7天'}
          </div>
        )}

        {/* 国策组列表 */}
        {groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map(([groupName, gpPolicies]) => {
              const gpLit   = gpPolicies.filter(p => p.checkedDates?.includes(today)).length
              const gpRate  = gpPolicies.length > 0 ? gpLit / gpPolicies.length : 0
              const isOpen  = !collapsed[groupName]
              return (
                <div key={groupName} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(159,95,255,0.18)', background: 'rgba(20,15,40,0.7)' }}>
                  {/* 组标题 */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3"
                    onClick={() => toggleGroup(groupName)}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-purple-300">{groupName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: gpRate >= 0.8 ? 'rgba(0,200,83,0.15)' : gpRate >= 0.5 ? 'rgba(245,197,24,0.12)' : 'rgba(255,71,87,0.12)',
                                 color: gpRate >= 0.8 ? '#00c853' : gpRate >= 0.5 ? '#f5c518' : '#ff4757' }}>
                        {gpLit}/{gpPolicies.length}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </button>

                  {/* 组进度条 */}
                  <div className="mx-4 mb-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${gpRate * 100}%`,
                      background: gpRate >= 0.8 ? '#00c853' : gpRate >= 0.5 ? '#f5c518' : '#ff4757',
                    }} />
                  </div>

                  {/* 国策列表 */}
                  {isOpen && (
                    <div className="divide-y divide-white/5">
                      {gpPolicies.map(p => (
                        <PolicyCard key={p.id} policy={p} today={today} onCheck={() => checkPolicy(p.id)} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm py-12">
            <div className="text-4xl mb-3">🛡️</div>
            <div>暂无国策</div>
            <div className="text-xs mt-1">每周日可新增一条国策，坚持打卡获得奖励</div>
          </div>
        )}
      </div>

      {showAdd && <AddPolicyModal onClose={() => setShowAdd(false)} existingGroups={groups.map(([g]) => g)} />}
    </div>
  )
}

// ── 单条国策卡片 ─────────────────────────────────────────────
function PolicyCard({ policy, today, onCheck }) {
  const isLit  = policy.checkedDates?.includes(today)
  const streak = getStreak(policy)
  const best   = getBestStreak(policy)

  return (
    <div className={`px-4 py-3 transition-all ${isLit ? 'bg-green-500/8' : ''}`}>
      <div className="flex items-center gap-3">
        {/* 打卡按钮 */}
        <button
          onClick={() => !isLit && onCheck()}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            isLit ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-green-400 active:scale-90'
          }`}>
          {isLit ? <span className="text-base">✓</span> : <span className="text-gray-400 text-lg">○</span>}
        </button>

        {/* 名称 & 描述 */}
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${isLit ? 'text-green-300' : 'text-white'}`}>{policy.name}</div>
          {policy.desc && <div className="text-xs text-gray-500 mt-0.5 truncate">{policy.desc}</div>}
        </div>

        {/* 连续天数 */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame size={13} />
            <span className="text-sm font-black">{streak}</span>
            <span className="text-[10px] text-gray-500">天</span>
          </div>
          {best > 0 && (
            <div className="flex items-center gap-1 text-yellow-500/70">
              <Trophy size={10} />
              <span className="text-[10px]">最高{best}</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部状态文字 */}
      <div className={`mt-2 text-xs ${isLit ? 'text-green-400/80' : 'text-gray-600'}`}>
        {isLit
          ? `✅ 今日已打卡 · 已连续${streak}天`
          : streak > 0
            ? `已连续 ${streak} 天，继续保持！`
            : '点击打卡，开始你的连续记录'}
      </div>
    </div>
  )
}

// ── 新增国策弹窗 ─────────────────────────────────────────────
function AddPolicyModal({ onClose, existingGroups }) {
  const { addPolicy } = useStore()
  const [name,      setName]      = useState('')
  const [desc,      setDesc]      = useState('')
  const [groupMode, setGroupMode] = useState('existing') // 'existing' | 'new'
  const [selGroup,  setSelGroup]  = useState(existingGroups[0] || '')
  const [newGroup,  setNewGroup]  = useState('')

  const finalGroup = groupMode === 'new' ? newGroup.trim() || '默认' : (selGroup || '默认')

  const handleSubmit = () => {
    if (!name.trim()) return
    addPolicy({ name: name.trim(), desc: desc.trim(), groupName: finalGroup })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg card-bg rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-2" />
        <h2 className="text-lg font-black">新增国策</h2>
        <div className="text-xs text-gray-400">每日打卡 +3元；点亮率≥80%理想生活+星；连续7天全亮 +30元+5星</div>

        {/* 国策名称 */}
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="国策名称，如：今日读书30分钟"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500/50" />

        {/* 描述 */}
        <input value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="描述（可选）"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500/50" />

        {/* 国策组 */}
        <div>
          <div className="text-xs text-gray-400 mb-2">选择国策组</div>
          <div className="flex gap-2 mb-3">
            {existingGroups.length > 0 && (
              <button onClick={() => setGroupMode('existing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${groupMode === 'existing' ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                选择已有组
              </button>
            )}
            <button onClick={() => setGroupMode('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${groupMode === 'new' ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
              新建组
            </button>
          </div>

          {groupMode === 'existing' && existingGroups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {existingGroups.map(g => (
                <button key={g} onClick={() => setSelGroup(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selGroup === g ? 'bg-purple-500/40 border border-purple-500/60 text-white' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                  {g}
                </button>
              ))}
            </div>
          )}

          {groupMode === 'new' && (
            <input value={newGroup} onChange={e => setNewGroup(e.target.value)}
              placeholder="新国策组名称，如：健康习惯"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50" />
          )}

          <div className="text-xs text-gray-600 mt-2">
            将归入：<span className="text-purple-300 font-bold">{finalGroup}</span>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!name.trim()}
          className="w-full py-3 rounded-xl font-bold text-base disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #3a1a6c, #1d0d48)', border: '1px solid rgba(159,95,255,0.4)' }}>
          确认新增
        </button>
      </div>
    </div>
  )
}
