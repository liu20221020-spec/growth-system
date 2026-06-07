import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Play, Square, SkipForward, Plus, Check, X } from 'lucide-react'
import useStore from '../store/useStore'
import { LANES, LANE_ORDER, DIFFICULTY, calcFocusReward } from '../lib/gameLogic'

const FOCUS_MODES = [
  { key: 'full',  label: '完整专注', duration: 60, icon: '🔥', desc: '60分钟深度专注',  seqIncr: 1.0 },
  { key: 'short', label: '短暂专注', duration: 25, icon: '⚡', desc: '25分钟番茄钟',    seqIncr: 0.5 },
  { key: 'scout', label: '侦察任务', duration: 5,  icon: '🔍', desc: '5分钟快速探索',   seqIncr: 0.1 },
  { key: 'ultra', label: '超强专注', duration: 90, icon: '💎', desc: '90分钟超强专注',  seqIncr: 1.5 },
]

const SESSION_KEY = 'focus_active_session'

function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch (_) {}
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch (_) { return null }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch (_) {}
}

export default function Focus() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── 尝试从 localStorage 恢复会话（页面被 kill 后重新进入）──
  const savedSession = loadSession()
  const hasValid = !!(savedSession && (() => {
    const elapsed = Date.now() - savedSession.startTime - savedSession.totalPaused
    return elapsed < savedSession.duration * 60 * 1000  // 还没超时
  })())

  // 优先从持久化 session 恢复 linkedTask（location.state 在页面重开后会丢失）
  const linkedTask = (hasValid && savedSession.linkedTask) ? savedSession.linkedTask : (location.state?.task ?? null)

  const { completeFocusBlock, abandonFocusBlock, getLaneTags, todayStatus,
          addLaneTag, removeLaneTag, addLanguage, removeLanguage, deduplicateTags,
          languageConfig, completeTask, addNotification } = useStore()
  const [addingTag, setAddingTag] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const newTagRef = useRef(null)

  // 首次渲染时清理重复标签
  useEffect(() => { deduplicateTags() }, [])

  // ── 自动补记：上次专注已超时但未手动完成 ──────────────────
  useEffect(() => {
    if (savedSession && !hasValid && savedSession.selectedLane && savedSession.selectedTag) {
      clearSession()
      // 补记专注块（不自动完成任务，任务视为未完成由用户手动处理）
      completeFocusBlock(
        savedSession.selectedLane,
        savedSession.selectedTag,
        savedSession.selectedDiff || 'medium',
        savedSession.duration     || 60,
        savedSession.selectedMode || 'full',
        null   // linkedTask 不自动完成
      )
      const modeIcon = { full:'🔥', short:'⚡', scout:'🔍', ultra:'💎' }[savedSession.selectedMode] || '🔥'
      setTimeout(() => addNotification(`⏰ 已自动补记上次专注 ${modeIcon}${savedSession.duration}分钟`), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [step, setStep] = useState(hasValid ? 'running' : 'select')
  const [selectedLane, setSelectedLane] = useState(hasValid ? savedSession.selectedLane : (linkedTask?.laneId ?? ''))
  const [selectedTag,  setSelectedTag]  = useState(hasValid ? savedSession.selectedTag  : '')
  const [selectedDiff, setSelectedDiff] = useState(hasValid ? savedSession.selectedDiff : (linkedTask?.difficulty ?? 'medium'))
  const [selectedMode, setSelectedMode] = useState(hasValid ? savedSession.selectedMode : 'full')
  const [duration,     setDuration]     = useState(hasValid ? savedSession.duration     : 60)
  const [isPaused,     setIsPaused]     = useState(hasValid ? savedSession.isPaused     : false)

  const totalSecs0  = hasValid ? savedSession.duration * 60 : 60 * 60
  const elapsed0    = hasValid ? Date.now() - savedSession.startTime - savedSession.totalPaused : 0
  const [timeLeft,  setTimeLeft]  = useState(hasValid ? Math.max(0, totalSecs0 - Math.floor(elapsed0 / 1000)) : 0)

  const timerRef       = useRef(null)
  const startTimeRef   = useRef(hasValid ? savedSession.startTime   : null)
  const pauseStartRef  = useRef(hasValid && savedSession.isPaused ? Date.now() : null)
  const totalPausedRef = useRef(hasValid ? savedSession.totalPaused : 0)

  // 恢复后自动继续计时（非暂停状态）
  const restoredRef = useRef(false)

  const lane = LANES[selectedLane]
  const tags = selectedLane ? getLaneTags(selectedLane) : []

  // 提交新标签（带去重保护）
  const submitNewTag = () => {
    const val = newTagInput.trim()
    if (!val || !selectedLane) return
    if (selectedLane === 'language') {
      if (!languageConfig.languages.includes(val)) {
        addLanguage(val)
        // 语言分路添加语种后，自动选第一个能力组合
        setTimeout(() => setSelectedTag(`${val}·听力`), 50)
      }
    } else {
      // 检查是否已存在
      if (!tags.includes(val)) {
        addLaneTag(selectedLane, val)
        setTimeout(() => setSelectedTag(val), 50) // 添加后自动选中
      }
    }
    setNewTagInput('')
    setAddingTag(false)
  }
  const modeDuration = FOCUS_MODES.find(m => m.key === selectedMode)?.duration ?? 60
  const reward = selectedLane ? calcFocusReward(selectedLane, selectedDiff, modeDuration) : 0
  const finalReward = todayStatus === 'poor' ? Math.round(reward * 1.3) : reward

  // 根据真实流逝时间计算剩余秒数
  const calcRemaining = (totalSecs) => {
    const elapsed = Date.now() - startTimeRef.current - totalPausedRef.current
    return Math.max(0, totalSecs - Math.floor(elapsed / 1000))
  }

  const startTick = (totalSecs) => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const remaining = calcRemaining(totalSecs)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        handleComplete()
      }
    }, 500) // 500ms 轮询，确保即使单次 tick 延迟也不会漏掉结束
  }

  useEffect(() => {
    // 恢复会话：自动继续计时
    if (hasValid && !restoredRef.current) {
      restoredRef.current = true
      if (!savedSession.isPaused) {
        startTick(savedSession.duration * 60)
      }
    }
    return () => clearInterval(timerRef.current)
  }, [])

  // 切回前台时立即刷新剩余时间
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && step === 'running' && !isPaused) {
        const totalSecs = duration * 60
        const remaining = calcRemaining(totalSecs)
        setTimeLeft(remaining)
        if (remaining <= 0) {
          clearInterval(timerRef.current)
          handleComplete()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [step, isPaused, duration])

  const startFocus = () => {
    const mode = FOCUS_MODES.find(m => m.key === selectedMode)
    const mins = mode.duration
    const totalSecs = mins * 60
    setDuration(mins)
    setTimeLeft(totalSecs)
    startTimeRef.current = Date.now()
    totalPausedRef.current = 0
    pauseStartRef.current = null
    setStep('running')
    // 持久化会话，防止页面被 kill
    saveSession({
      selectedLane, selectedTag, selectedDiff, selectedMode,
      modeKey: mode.key,
      duration: mins,
      startTime: startTimeRef.current,
      totalPaused: 0,
      isPaused: false,
      linkedTask,
    })
    startTick(totalSecs)
  }

  const handleComplete = () => {
    clearInterval(timerRef.current)
    clearSession()
    completeFocusBlock(selectedLane, selectedTag, selectedDiff, duration, selectedMode, linkedTask?.id ?? null)
    setStep('done')
  }

  const handleAbandon = () => {
    clearInterval(timerRef.current)
    clearSession()
    const elapsedSecs = duration * 60 - timeLeft
    const elapsedMin = Math.max(0, Math.floor(elapsedSecs / 60))
    abandonFocusBlock(selectedLane, selectedTag, selectedDiff, elapsedMin)
    navigate('/')
  }

  const togglePause = () => {
    const totalSecs = duration * 60
    if (isPaused) {
      // 恢复：累加本次暂停时长
      if (pauseStartRef.current) {
        totalPausedRef.current += Date.now() - pauseStartRef.current
        pauseStartRef.current = null
      }
      // 更新持久化
      saveSession({
        selectedLane, selectedTag, selectedDiff, selectedMode, modeKey: selectedMode,
        duration, startTime: startTimeRef.current,
        totalPaused: totalPausedRef.current,
        isPaused: false, linkedTask,
      })
      startTick(totalSecs)
    } else {
      // 暂停：记录暂停开始时间
      clearInterval(timerRef.current)
      pauseStartRef.current = Date.now()
      saveSession({
        selectedLane, selectedTag, selectedDiff, selectedMode, modeKey: selectedMode,
        duration, startTime: startTimeRef.current,
        totalPaused: totalPausedRef.current,
        isPaused: true, linkedTask,
      })
    }
    setIsPaused(!isPaused)
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const totalSecs = duration * 60
  const progress = timeLeft / totalSecs

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24"
        style={{ background: 'radial-gradient(ellipse at top, #0d2040 0%, #0a0e1a 60%)' }}>
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h1 className="text-2xl font-black mb-2">专注完成！</h1>
        <div className="text-5xl font-black text-yellow-400 mb-1" style={{ textShadow: '0 0 30px rgba(245,197,24,0.5)' }}>
          +{finalReward.toFixed(1)}元
        </div>
        <div className="text-gray-400 text-sm mb-2">{lane?.name} · {selectedTag} · {DIFFICULTY[selectedDiff].label}</div>
        <div className="text-gray-500 text-xs mb-8">熟练度 +1 | #序列+1</div>

        {/* 关联任务完成询问 */}
        {linkedTask ? (
          <div className="w-full max-w-sm rounded-2xl p-5 mb-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs text-gray-400 mb-1 text-center">关联任务</div>
            <div className="text-sm font-bold text-white text-center mb-4 truncate">「{linkedTask.title}」是否完成？</div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/tasks')}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-300 transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                今天还会再继续 →
              </button>
              <button
                onClick={() => { completeTask(linkedTask.id); navigate('/tasks') }}
                className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1a4a2c, #0d2418)', border: '1px solid rgba(0,212,170,0.4)' }}>
                已完成 ✓
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/')}
            className="px-8 py-3 rounded-xl font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #1a3a6c, #0d2448)', border: '1px solid rgba(79,158,255,0.4)' }}>
            返回主页
          </button>
        )}
      </div>
    )
  }

  if (step === 'running') {
    const circumference = 2 * Math.PI * 80
    const dashOffset = circumference * progress

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24"
        style={{ background: 'radial-gradient(ellipse at center, #0d1a30 0%, #0a0e1a 70%)' }}>
        <div className="text-center mb-2">
          <div className="text-sm text-gray-400">{lane?.icon} {lane?.name} · {selectedTag}</div>
          <div className="text-xs text-gray-500 mt-1">{DIFFICULTY[selectedDiff].label} · {duration}分钟 · 预计+{finalReward.toFixed(1)}元</div>
        </div>

        {/* 圆形计时器 */}
        <div className="relative w-56 h-56 my-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="90" cy="90" r="80" fill="none" stroke="#4f9eff" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 8px #4f9eff)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-black tabular-nums">{formatTime(timeLeft)}</div>
            <div className="text-xs text-gray-400 mt-1">{isPaused ? '已暂停' : '专注中'}</div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-6">
          <button onClick={handleAbandon}
            className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <Square size={24} />
            <span className="text-xs">放弃(-1星)</span>
          </button>
          <button onClick={togglePause}
            className="flex flex-col items-center gap-1 px-8 py-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1a3a6c, #0d2448)', border: '1px solid rgba(79,158,255,0.4)' }}>
            <Play size={28} fill={isPaused ? 'currentColor' : undefined} />
            <span className="text-xs">{isPaused ? '继续' : '暂停'}</span>
          </button>
          <button onClick={handleComplete}
            className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
            <SkipForward size={24} />
            <span className="text-xs">提前完成</span>
          </button>
        </div>
      </div>
    )
  }

  // 选择阶段
  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-gray-400" /></button>
          <h1 className="text-xl font-black">开始专注</h1>
        </div>

        {/* 关联任务提示 */}
        {linkedTask && (
          <div className="mb-5 px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: 'rgba(79,158,255,0.08)', border: '1px solid rgba(79,158,255,0.2)' }}>
            <span className="text-lg">{LANES[linkedTask.laneId]?.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-blue-400/70 mb-0.5">关联任务</div>
              <div className="text-xs font-bold text-blue-200 truncate">{linkedTask.title}</div>
            </div>
          </div>
        )}

        {/* 专注模式 */}
        <section className="mb-6">
          <h2 className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">专注模式</h2>
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_MODES.map(m => (
              <button key={m.key} onClick={() => setSelectedMode(m.key)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedMode === m.key
                    ? 'border-blue-500/60 bg-blue-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}>
                <div className="text-xl mb-1">{m.icon}</div>
                <div className="text-sm font-bold">{m.label}</div>
                <div className="text-xs text-gray-400">{m.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 选择分路 */}
        <section className="mb-6">
          <h2 className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">选择分路</h2>
          <div className="grid grid-cols-3 gap-2">
            {LANE_ORDER.filter(id => id !== 'life').map(id => (
              <button key={id} onClick={() => { setSelectedLane(id); setSelectedTag(''); setAddingTag(false); setEditingTags(false); setNewTagInput('') }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedLane === id
                    ? 'border-blue-500/60 bg-blue-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}>
                <div className="text-xl mb-1">{LANES[id].icon}</div>
                <div className="text-xs font-medium">{LANES[id].name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{LANES[id].focusPrice}元/块</div>
              </button>
            ))}
          </div>
        </section>

        {/* 选择标签 */}
        {selectedLane && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs text-gray-500 font-medium uppercase tracking-wider">领域标签</h2>
              <div className="flex items-center gap-3">
                {/* 编辑/完成 */}
                {tags.length > 0 && !addingTag && (
                  <button
                    onClick={() => { setEditingTags(!editingTags); setSelectedTag('') }}
                    className={`text-xs transition-colors ${editingTags ? 'text-red-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
                    {editingTags ? '完成编辑' : '管理'}
                  </button>
                )}
                {/* 添加 */}
                {!addingTag && !editingTags && (
                  <button
                    onClick={() => { setAddingTag(true); setTimeout(() => newTagRef.current?.focus(), 50) }}
                    className="flex items-center gap-1 text-xs text-blue-400/70 hover:text-blue-400 transition-colors">
                    <Plus size={11} />
                    {selectedLane === 'language' ? '添加语种' : '添加标签'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div key={tag} className="relative">
                  {/* 编辑模式：显示删除 X */}
                  {editingTags ? (
                    <div className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-lg text-sm border border-red-500/30 bg-red-500/10 text-gray-400">
                      <span>{tag}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectedLane === 'language') {
                            const langName = tag.split('·')[0]
                            if (languageConfig.languages.length > 1) removeLanguage(langName)
                          } else {
                            removeLaneTag(selectedLane, tag)
                            if (selectedTag === tag) setSelectedTag('')
                          }
                        }}
                        className="ml-1 w-4 h-4 rounded-full bg-red-500/30 hover:bg-red-500/60 flex items-center justify-center transition-colors shrink-0">
                        <X size={9} strokeWidth={2.5} className="text-red-300" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        selectedTag === tag
                          ? 'border-blue-500/60 bg-blue-500/20 text-blue-300'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/8'
                      }`}>
                      {tag}
                    </button>
                  )}
                </div>
              ))}

              {/* 内联输入框 */}
              {addingTag && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-blue-500/50 bg-blue-500/10">
                  <input
                    ref={newTagRef}
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitNewTag()
                      if (e.key === 'Escape') { setAddingTag(false); setNewTagInput('') }
                    }}
                    placeholder={selectedLane === 'language' ? '语种名，如：韩语' : '标签名'}
                    className="bg-transparent text-sm text-blue-200 placeholder-blue-400/40 outline-none w-28"
                  />
                  <button onClick={submitNewTag} className="text-blue-400 hover:text-blue-300 shrink-0">
                    <Check size={13} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => { setAddingTag(false); setNewTagInput('') }} className="text-gray-500 hover:text-gray-400 shrink-0">
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* 空状态提示 */}
              {tags.length === 0 && !addingTag && (
                <button
                  onClick={() => { setAddingTag(true); setTimeout(() => newTagRef.current?.focus(), 50) }}
                  className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-white/20 text-gray-500 hover:border-blue-500/40 hover:text-blue-400 transition-all">
                  + 点击添加第一个{selectedLane === 'language' ? '语种' : '标签'}
                </button>
              )}
            </div>

            {/* 编辑模式提示 */}
            {editingTags && (
              <p className="mt-2 text-xs text-red-400/60">
                {selectedLane === 'language'
                  ? '点击 × 删除语种（至少保留一种语言）'
                  : '点击 × 删除标签，熟练度数据保留'}
              </p>
            )}
          </section>
        )}

        {/* 难度选择 */}
        {selectedTag && (
          <section className="mb-6">
            <h2 className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">任务难度</h2>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DIFFICULTY).map(([key, d]) => (
                <button key={key} onClick={() => setSelectedDiff(key)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedDiff === key
                      ? 'border-opacity-60 bg-opacity-15'
                      : 'border-white/10 bg-white/5'
                  }`}
                  style={selectedDiff === key ? { borderColor: `${d.color}60`, backgroundColor: `${d.color}15` } : {}}>
                  <div className="text-sm font-bold" style={{ color: selectedDiff === key ? d.color : undefined }}>{d.label}</div>
                  <div className="text-xs text-gray-400">×{d.multiplier}</div>
                </button>
              ))}
            </div>

            {/* 预计额度 */}
            <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
              <div className="text-xs text-gray-400 mb-1">本次预计获得</div>
              <div className="text-3xl font-black text-yellow-400">+{finalReward.toFixed(1)}元</div>
              {todayStatus === 'poor' && <div className="text-xs text-orange-400 mt-1">状态加成 ×1.3</div>}
            </div>
          </section>
        )}

        {/* 开始按钮 */}
        <button
          onClick={startFocus}
          disabled={!selectedLane || !selectedTag}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
            selectedLane && selectedTag
              ? 'opacity-100 active:scale-95'
              : 'opacity-30 cursor-not-allowed'
          }`}
          style={{ background: 'linear-gradient(135deg, #1a4a8c, #0d2448)', border: '1px solid rgba(79,158,255,0.4)', boxShadow: selectedLane && selectedTag ? '0 0 20px rgba(79,158,255,0.2)' : 'none' }}>
          🔥 开始专注
        </button>
      </div>
    </div>
  )
}
