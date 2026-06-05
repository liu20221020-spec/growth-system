import { useState } from 'react'
import { Plus, ChevronRight, ChevronDown, Check, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { LANES, LANE_ORDER, DIFFICULTY } from '../lib/gameLogic'

export default function Tasks() {
  const { tasks, addTask, completeTask, deleteTask } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('active') // active | done
  const [expandedIds, setExpandedIds] = useState(new Set())

  const filteredTasks = tasks.filter(t => filter === 'active' ? !t.completed : t.completed)
  const largeTasks = filteredTasks.filter(t => t.level === 'large')
  const standaloneTasks = filteredTasks.filter(t => t.level !== 'large' && !t.parentId)

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getChildren = (parentId) => tasks.filter(t => t.parentId === parentId && (filter === 'active' ? !t.completed : t.completed))

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black">任务</h1>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #1a3a6c, #0d2448)', border: '1px solid rgba(79,158,255,0.3)' }}>
            <Plus size={16} /> 新建任务
          </button>
        </div>

        {/* 筛选 */}
        <div className="flex gap-2 mb-6">
          {[['active', '进行中'], ['done', '已完成']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === key ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-white/5 border border-white/10 text-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* 大任务树 */}
        <div className="space-y-3">
          {largeTasks.map(task => (
            <LargeTaskNode key={task.id} task={task} expanded={expandedIds.has(task.id)}
              onToggle={() => toggleExpand(task.id)}
              children={getChildren(task.id)}
              grandChildren={(id) => getChildren(id)}
              onComplete={completeTask} onDelete={deleteTask} />
          ))}
          {standaloneTasks.map(task => (
            <TaskRow key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} indent={0} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-12">
              {filter === 'active' ? '暂无进行中任务，点击右上角新建' : '暂无已完成任务'}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function LargeTaskNode({ task, expanded, onToggle, children, grandChildren, onComplete, onDelete }) {
  return (
    <div>
      <div className="card-bg rounded-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <button onClick={() => !task.completed && onComplete(task.id)}
              className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-green-400'
              }`}>
              {task.completed && <Check size={12} strokeWidth={3} />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{LANES[task.laneId]?.icon}</span>
                <span className={`font-bold ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</span>
                <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-white/5">大任务</span>
              </div>
              {task.desc && <div className="text-xs text-gray-400 mt-1">{task.desc}</div>}
              <div className="text-xs text-gray-500 mt-1">{LANES[task.laneId]?.name} · +{task.completed ? '已完成' : '完成+10星+120元'}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onDelete(task.id)} className="p-1 text-gray-600 hover:text-red-400">
                <Trash2 size={14} />
              </button>
              {children.length > 0 && (
                <button onClick={onToggle} className="p-1 text-gray-400">
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
        {expanded && children.length > 0 && (
          <div className="border-t border-white/5 divide-y divide-white/5">
            {children.map(child => (
              <div key={child.id}>
                <TaskRow task={child} onComplete={onComplete} onDelete={onDelete} indent={1} />
                {grandChildren(child.id).map(gc => (
                  <TaskRow key={gc.id} task={gc} onComplete={onComplete} onDelete={onDelete} indent={2} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskRow({ task, onComplete, onDelete, indent }) {
  const isSmall = task.level === 'small'
  const rewardText = isSmall ? `完成+1星` : `完成+3星`
  return (
    <div className={`flex items-start gap-3 p-3 ${indent > 0 ? '' : 'card-bg rounded-xl'}`}
      style={indent > 0 ? { paddingLeft: `${12 + indent * 16}px` } : {}}>
      <button onClick={() => !task.completed && onComplete(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-green-400'
        }`}>
        {task.completed && <Check size={10} strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</div>
        <div className="text-xs text-gray-500">
          {LANES[task.laneId]?.name} · {task.level === 'medium' ? '中任务' : '小任务'} · {DIFFICULTY[task.difficulty || 'medium']?.label}
          {!task.completed && ` · ${rewardText}`}
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} className="p-1 text-gray-600 hover:text-red-400 shrink-0">
        <Trash2 size={12} />
      </button>
    </div>
  )
}

function AddTaskModal({ onClose }) {
  const { addTask, tasks } = useStore()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [level, setLevel] = useState('small')
  const [laneId, setLaneId] = useState('research')
  const [difficulty, setDifficulty] = useState('medium')
  const [parentId, setParentId] = useState('')

  const parentOptions = tasks.filter(t => !t.completed &&
    (level === 'medium' ? t.level === 'large' : t.level === 'medium') &&
    t.laneId === laneId
  )

  const handleSubmit = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), desc, level, laneId, difficulty, parentId: parentId || null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg card-bg rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-black">新建任务</h2>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="任务名称"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50" />

        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="任务描述（可选）"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-2">任务层级</div>
            <div className="flex gap-2">
              {[['large', '大'], ['medium', '中'], ['small', '小']].map(([k, l]) => (
                <button key={k} onClick={() => setLevel(k)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-all ${level === k ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-white/10 bg-white/5'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">难度</div>
            <div className="flex gap-2">
              {Object.entries(DIFFICULTY).map(([k, d]) => (
                <button key={k} onClick={() => setDifficulty(k)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-all ${difficulty === k ? 'border-blue-500/50 bg-blue-500/15' : 'border-white/10 bg-white/5'}`}
                  style={difficulty === k ? { color: d.color } : {}}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">所属分路</div>
          <div className="grid grid-cols-3 gap-2">
            {LANE_ORDER.map(id => (
              <button key={id} onClick={() => setLaneId(id)}
                className={`py-2 rounded-lg text-xs border transition-all text-center ${laneId === id ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-white/10 bg-white/5'}`}>
                {LANES[id].icon} {LANES[id].name}
              </button>
            ))}
          </div>
        </div>

        {parentOptions.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">上级任务（可选）</div>
            <select value={parentId} onChange={e => setParentId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none">
              <option value="">无上级任务</option>
              {parentOptions.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!title.trim()}
          className="w-full py-3 rounded-xl font-bold text-base disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #1a3a6c, #0d2448)', border: '1px solid rgba(79,158,255,0.4)' }}>
          创建任务
        </button>
      </div>
    </div>
  )
}
