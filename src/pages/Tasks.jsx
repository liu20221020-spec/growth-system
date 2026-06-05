import { useState } from 'react'
import { Plus, ChevronRight, ChevronDown, Check, Trash2, AlertCircle } from 'lucide-react'
import useStore from '../store/useStore'
import { LANES, LANE_ORDER, DIFFICULTY } from '../lib/gameLogic'

// ─── 层级配置 ─────────────────────────────────────────────
const LEVEL_CONFIG = {
  large:  { label: '大任务', shortLabel: '大', color: '#9f5fff', starReward: 10, desc: '阶段性目标，如"完成毕业论文"' },
  medium: { label: '中任务', shortLabel: '中', color: '#4f9eff', starReward: 3,  desc: '周级目标，归属于某个大任务' },
  small:  { label: '小任务', shortLabel: '小', color: '#00d4aa', starReward: 1,  desc: '日级目标，归属于某个中任务' },
}

// ─── 主页面 ────────────────────────────────────────────────
export default function Tasks() {
  const { tasks, completeTask, deleteTask } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [addDefault, setAddDefault] = useState({}) // 预填 level/parentId
  const [filter, setFilter] = useState('active')

  const isActive = (t) => !t.completed

  // 按层级过滤
  const largeTasks = tasks.filter(t => t.level === 'large' && (filter === 'active' ? isActive(t) : t.completed))

  // 获取某任务的子任务（不受 filter 影响，展示完整子树）
  const getMediumOf  = (largeId)  => tasks.filter(t => t.level === 'medium' && t.parentId === largeId)
  const getSmallOf   = (mediumId) => tasks.filter(t => t.level === 'small'  && t.parentId === mediumId)

  // 没有归属的中/小任务（孤立任务）
  const orphanMedium = tasks.filter(t => t.level === 'medium' && !t.parentId && (filter === 'active' ? isActive(t) : t.completed))
  const orphanSmall  = tasks.filter(t => t.level === 'small'  && !t.parentId && (filter === 'active' ? isActive(t) : t.completed))

  const openAdd = (defaults = {}) => { setAddDefault(defaults); setShowAdd(true) }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">

        {/* 顶栏 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black">任务</h1>
          <button
            onClick={() => openAdd({ level: 'large' })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #1a3a6c, #0d2448)', border: '1px solid rgba(79,158,255,0.3)' }}>
            <Plus size={16} /> 新建大任务
          </button>
        </div>

        {/* 层级说明 */}
        <div className="flex gap-2 mb-5">
          {Object.entries(LEVEL_CONFIG).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
              <span>{v.label}</span>
            </div>
          ))}
          <span className="text-xs text-gray-600 ml-1">· 逐级展开</span>
        </div>

        {/* 筛选 */}
        <div className="flex gap-2 mb-5">
          {[['active', '进行中'], ['done', '已完成']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                  : 'bg-white/5 border border-white/10 text-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── 大任务树 ── */}
        <div className="space-y-3">
          {largeTasks.map(large => (
            <LargeBlock
              key={large.id}
              large={large}
              mediums={getMediumOf(large.id)}
              getSmallOf={getSmallOf}
              onComplete={completeTask}
              onDelete={deleteTask}
              onAddMedium={() => openAdd({ level: 'medium', parentId: large.id, laneId: large.laneId })}
              onAddSmall={(mediumId, laneId) => openAdd({ level: 'small', parentId: mediumId, laneId })}
            />
          ))}

          {/* 孤立中任务 */}
          {orphanMedium.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <AlertCircle size={11} /> 未归属中任务
              </div>
              {orphanMedium.map(t => (
                <MediumBlock key={t.id} medium={t} smalls={getSmallOf(t.id)}
                  onComplete={completeTask} onDelete={deleteTask}
                  onAddSmall={() => openAdd({ level: 'small', parentId: t.id, laneId: t.laneId })}
                  indent={0} />
              ))}
            </div>
          )}

          {/* 孤立小任务 */}
          {orphanSmall.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <AlertCircle size={11} /> 未归属小任务
              </div>
              {orphanSmall.map(t => (
                <SmallRow key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} indent={0} />
              ))}
            </div>
          )}

          {largeTasks.length === 0 && orphanMedium.length === 0 && orphanSmall.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-16">
              <div className="text-4xl mb-3">🎯</div>
              <div className="font-medium">
                {filter === 'active' ? '暂无进行中任务' : '暂无已完成任务'}
              </div>
              {filter === 'active' && (
                <div className="text-xs mt-1 text-gray-600">点击右上角新建大任务开始</div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddTaskModal
          defaultValues={addDefault}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

// ─── 大任务块 ──────────────────────────────────────────────
function LargeBlock({ large, mediums, getSmallOf, onComplete, onDelete, onAddMedium, onAddSmall }) {
  const [expanded, setExpanded] = useState(true)
  const totalSmall = mediums.reduce((s, m) => s + getSmallOf(m.id).length, 0)
  const doneSmall  = mediums.reduce((s, m) => s + getSmallOf(m.id).filter(t => t.completed).length, 0)
  const doneMedium = mediums.filter(m => m.completed).length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(159,95,255,0.2)', background: 'linear-gradient(135deg, #1a1530 0%, #0f0e1f 100%)' }}>
      {/* 大任务行 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 完成圆圈 */}
          <button
            onClick={() => !large.completed && onComplete(large.id)}
            className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              large.completed ? 'bg-purple-500 border-purple-500' : 'border-purple-500/50 hover:border-purple-400'
            }`}>
            {large.completed && <Check size={12} strokeWidth={3} className="text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{LANES[large.laneId]?.icon}</span>
              <span className={`font-black text-base ${large.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                {large.title}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(159,95,255,0.15)', border: '1px solid rgba(159,95,255,0.3)', color: '#9f5fff' }}>
                大任务
              </span>
            </div>
            {large.desc && <div className="text-xs text-gray-400 mt-0.5">{large.desc}</div>}

            {/* 进度小结 */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{LANES[large.laneId]?.name}</span>
              <span>·</span>
              <span>{doneMedium}/{mediums.length} 中任务</span>
              {totalSmall > 0 && <><span>·</span><span>{doneSmall}/{totalSmall} 小任务</span></>}
              {!large.completed && <><span>·</span><span className="text-purple-400">完成+10星+120元</span></>}
            </div>

            {/* 进度条 */}
            {mediums.length > 0 && (
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full progress-bar"
                  style={{ width: `${(doneMedium / mediums.length) * 100}%`, background: 'linear-gradient(90deg, #9f5fff80, #9f5fff)' }} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onDelete(large.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-400">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 中任务列表 */}
      {expanded && (
        <div className="border-t border-white/5">
          {mediums.map(medium => (
            <MediumBlock
              key={medium.id}
              medium={medium}
              smalls={getSmallOf(medium.id)}
              onComplete={onComplete}
              onDelete={onDelete}
              onAddSmall={() => onAddSmall(medium.id, medium.laneId)}
              indent={1}
            />
          ))}

          {/* 添加中任务按钮 */}
          {!large.completed && (
            <button
              onClick={onAddMedium}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/5 transition-all border-t border-white/5">
              <Plus size={12} />
              <span>添加中任务</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 中任务块 ──────────────────────────────────────────────
function MediumBlock({ medium, smalls, onComplete, onDelete, onAddSmall, indent }) {
  const [expanded, setExpanded] = useState(true)
  const doneSmall = smalls.filter(t => t.completed).length
  const pl = indent === 1 ? 'pl-10' : 'pl-4'

  return (
    <div>
      {/* 中任务行 */}
      <div className={`flex items-start gap-3 py-3 pr-4 ${pl} bg-white/[0.02] border-b border-white/5`}>
        {/* 竖线连接 */}
        <div className="flex flex-col items-center shrink-0 mt-0.5">
          <div className="w-0.5 h-2 bg-blue-500/20" />
          <button
            onClick={() => !medium.completed && onComplete(medium.id)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              medium.completed ? 'bg-blue-500 border-blue-500' : 'border-blue-500/50 hover:border-blue-400'
            }`}>
            {medium.completed && <Check size={10} strokeWidth={3} className="text-white" />}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${medium.completed ? 'line-through text-gray-500' : 'text-gray-100'}`}>
              {medium.title}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(79,158,255,0.12)', border: '1px solid rgba(79,158,255,0.25)', color: '#4f9eff' }}>
              中
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
            <span>{doneSmall}/{smalls.length} 小任务</span>
            {!medium.completed && <><span>·</span><span className="text-blue-400/70">完成+3星+25元</span></>}
          </div>
          {smalls.length > 0 && (
            <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full progress-bar"
                style={{ width: `${(doneSmall / smalls.length) * 100}%`, background: 'linear-gradient(90deg, #4f9eff60, #4f9eff)' }} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onDelete(medium.id)} className="p-1 text-gray-700 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
          {smalls.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-500">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* 小任务列表 */}
      {expanded && smalls.map(small => (
        <SmallRow key={small.id} task={small} onComplete={onComplete} onDelete={onDelete} indent={2} />
      ))}

      {/* 添加小任务按钮 */}
      {!medium.completed && (
        <button
          onClick={onAddSmall}
          className="w-full flex items-center gap-2 py-2 pr-4 pl-16 text-[11px] text-teal-400/50 hover:text-teal-400 hover:bg-teal-500/5 transition-all border-b border-white/5">
          <Plus size={10} />
          <span>添加小任务</span>
        </button>
      )}
    </div>
  )
}

// ─── 小任务行 ──────────────────────────────────────────────
function SmallRow({ task, onComplete, onDelete, indent }) {
  const diffLabel = DIFFICULTY[task.difficulty || 'medium']?.label || '中等'
  const pl = indent === 2 ? 'pl-16' : indent === 1 ? 'pl-10' : 'pl-4'

  return (
    <div className={`flex items-center gap-3 py-2.5 pr-4 ${pl} bg-white/[0.01] border-b border-white/5`}>
      <div className="flex flex-col items-center shrink-0">
        <div className="w-0.5 h-2 bg-teal-500/15" />
        <button
          onClick={() => !task.completed && onComplete(task.id)}
          className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
            task.completed ? 'bg-teal-500 border-teal-500' : 'border-teal-500/40 hover:border-teal-400'
          }`}>
          {task.completed && <Check size={8} strokeWidth={3} className="text-white" />}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <span className={`text-xs ${task.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
          {task.title}
        </span>
        {!task.completed && (
          <span className="ml-2 text-[10px] text-teal-400/60">{diffLabel} · +1星</span>
        )}
      </div>

      <button onClick={() => onDelete(task.id)} className="p-1 text-gray-700 hover:text-red-400 shrink-0 transition-colors">
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ─── 新建任务弹窗 ──────────────────────────────────────────
function AddTaskModal({ defaultValues = {}, onClose }) {
  const { addTask, tasks } = useStore()

  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [level,      setLevel]      = useState(defaultValues.level || 'large')
  const [laneId,     setLaneId]     = useState(defaultValues.laneId || 'research')
  const [difficulty, setDifficulty] = useState('medium')
  const [parentId,   setParentId]   = useState(defaultValues.parentId || '')

  // 根据当前 level 决定父任务选项
  const parentLevel   = level === 'medium' ? 'large' : level === 'small' ? 'medium' : null
  const parentOptions = parentLevel
    ? tasks.filter(t => !t.completed && t.level === parentLevel && t.laneId === laneId)
    : []

  const cfg = LEVEL_CONFIG[level]

  // 当 level 或 laneId 改变时重置 parentId（如果旧的 parentId 不再适用）
  const handleLevelChange = (newLevel) => {
    setLevel(newLevel)
    setParentId(defaultValues.level === newLevel ? (defaultValues.parentId || '') : '')
  }

  const handleLaneChange = (newLane) => {
    setLaneId(newLane)
    setParentId('')
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    // 中任务必须有大任务，小任务必须有中任务（提示但不强制阻止）
    addTask({
      title: title.trim(),
      desc,
      level,
      laneId,
      difficulty,
      parentId: parentId || null,
    })
    onClose()
  }

  const needsParent  = level === 'medium' || level === 'small'
  const missingParent = needsParent && !parentId && parentOptions.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 pb-10 space-y-4 overflow-y-auto max-h-[92vh]"
        style={{ background: 'linear-gradient(180deg, #151e30 0%, #0f1525 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
        onClick={e => e.stopPropagation()}>

        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto" />

        {/* 标题 */}
        <div>
          <h2 className="text-lg font-black">新建任务</h2>
          <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
        </div>

        {/* ① 任务层级 */}
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium">任务层级</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(LEVEL_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => handleLevelChange(k)}
                className="py-3 rounded-xl text-center border transition-all"
                style={level === k
                  ? { borderColor: `${v.color}60`, backgroundColor: `${v.color}15`, color: v.color }
                  : { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#9ca3af' }}>
                <div className="text-sm font-black">{v.shortLabel}</div>
                <div className="text-[10px] mt-0.5">{v.label}</div>
                <div className="text-[9px] mt-0.5 opacity-70">+{v.starReward}星</div>
              </button>
            ))}
          </div>
        </div>

        {/* ② 所属分路 */}
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium">所属分路</div>
          <div className="grid grid-cols-3 gap-2">
            {LANE_ORDER.map(id => (
              <button key={id} onClick={() => handleLaneChange(id)}
                className="py-2 rounded-xl text-center text-xs border transition-all"
                style={laneId === id
                  ? { borderColor: `${LANES[id].color}60`, backgroundColor: `${LANES[id].color}15`, color: LANES[id].color }
                  : { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#9ca3af' }}>
                <div className="text-base">{LANES[id].icon}</div>
                <div className="text-[11px] font-medium mt-0.5">{LANES[id].name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ③ 上级任务（中→选大，小→选中） */}
        {needsParent && (
          <div>
            <div className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
              {level === 'medium' ? '归属大任务' : '归属中任务'}
              {missingParent && <span className="text-yellow-400">（建议选择）</span>}
            </div>
            {parentOptions.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {/* 无归属选项 */}
                <button
                  onClick={() => setParentId('')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${
                    !parentId ? 'border-gray-400/30 bg-gray-400/10 text-gray-300' : 'border-white/8 bg-white/3 text-gray-500 hover:bg-white/5'
                  }`}>
                  暂不归属
                </button>
                {parentOptions.map(p => (
                  <button key={p.id}
                    onClick={() => setParentId(p.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all ${
                      parentId === p.id
                        ? 'border-blue-500/50 bg-blue-500/12 text-blue-200'
                        : 'border-white/8 bg-white/3 text-gray-300 hover:bg-white/6'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span>{LANES[p.laneId]?.icon}</span>
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(159,95,255,0.15)', color: '#9f5fff' }}>
                        {LEVEL_CONFIG[p.level]?.shortLabel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-3 rounded-xl text-xs text-gray-500 bg-white/3 border border-white/8">
                {level === 'medium'
                  ? `当前分路「${LANES[laneId]?.name}」暂无大任务，可先创建大任务再归属，或切换分路`
                  : `当前分路「${LANES[laneId]?.name}」暂无中任务，可先创建中任务再归属`}
              </div>
            )}
          </div>
        )}

        {/* ④ 任务名称 */}
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium">任务名称</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={
              level === 'large'  ? '如：完成毕业论文' :
              level === 'medium' ? '如：完成引言部分' :
                                   '如：写引言第一段'
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* ⑤ 描述（可选） */}
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="备注（可选）"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
        />

        {/* ⑥ 难度（大任务不设难度） */}
        {level !== 'large' && (
          <div>
            <div className="text-xs text-gray-500 mb-2 font-medium">难度</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DIFFICULTY).map(([k, d]) => (
                <button key={k} onClick={() => setDifficulty(k)}
                  className="py-2.5 rounded-xl text-center border transition-all text-sm font-bold"
                  style={difficulty === k
                    ? { borderColor: `${d.color}60`, backgroundColor: `${d.color}15`, color: d.color }
                    : { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', color: '#6b7280' }}>
                  {d.label}
                  <div className="text-[10px] font-normal opacity-70 mt-0.5">×{d.multiplier}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 奖励预览 */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 border border-white/8 text-xs">
          <span className="text-gray-500">完成奖励</span>
          <span style={{ color: cfg.color }} className="font-bold">
            +{cfg.starReward}星
            {level !== 'large'
              ? ` · +${LANES[laneId]?.taskRewards?.[level]?.[difficulty] || 0}元`
              : ` · +${LANES[laneId]?.taskRewards?.large || 120}元`}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full py-3.5 rounded-xl font-black text-base disabled:opacity-30 transition-all active:scale-98"
          style={{ background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}15)`, border: `1px solid ${cfg.color}50`, color: cfg.color }}>
          创建{LEVEL_CONFIG[level].label}
        </button>
      </div>
    </div>
  )
}
