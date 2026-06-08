import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useState } from 'react'
import useStore from '../store/useStore'
import { LANES, getRankFromTotalStars, getProficiencyProgress, getLanguageTags, PROFICIENCY_LEVELS } from '../lib/gameLogic'
import RankBadge, { StarRow } from '../components/ui/RankBadge'
import ProficiencyBar from '../components/ui/ProficiencyBar'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TIER_COLORS = {
  bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700',
  platinum: '#7b68ee', diamond: '#4169e1', master: '#00c853', king: '#ff6600',
}

export default function LaneDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lanes, proficiency, focusBlocks, languageConfig, laneTags, policies,
          addLanguage, addLaneTag, removeLaneTag, removeLanguage } = useStore()
  const lane = LANES[id]
  const data = lanes[id] || { totalStars: 0 }
  const { rank, starsInDiv } = getRankFromTotalStars(data.totalStars || 0)

  const [showAddTag, setShowAddTag] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [newTag, setNewTag] = useState('')

  if (!lane) return <div className="p-4 text-gray-400">分路不存在</div>

  // 获取该分路的所有标签
  const tags = id === 'language'
    ? getLanguageTags(languageConfig.languages, languageConfig.abilities)
    : (laneTags[id] || lane.tags || [])

  // 历史星数数据（最近30次专注块）
  const laneBlocks = focusBlocks.filter(b => b.laneId === id && b.completed).slice(0, 30).reverse()
  const chartData = laneBlocks.reduce((acc, b, i) => {
    const prev = acc[i - 1]?.stars || data.totalStars - laneBlocks.length + i
    return [...acc, { name: i + 1, stars: Math.max(0, prev + 1), date: b.date?.slice(5, 10) }]
  }, [])

  const color = TIER_COLORS[rank.tier]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-gray-400" /></button>
          <span className="text-2xl">{lane.icon}</span>
          <h1 className="text-xl font-black">{lane.name}</h1>
        </div>

        {/* 段位卡片 */}
        <div className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)`, border: `1px solid ${color}40` }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${color}, transparent)`, transform: 'translate(30%, -30%)' }} />
          <div className="flex items-start justify-between">
            <div>
              <RankBadge totalStars={data.totalStars || 0} size="lg" />
              <div className="mt-2">
                <StarRow totalStars={data.totalStars || 0} />
              </div>
              <div className="text-xs text-gray-400 mt-1">总计 {data.totalStars || 0} 星</div>
            </div>
            {!lane.isLifeLane && (
              <div className="text-right">
                <div className="text-xs text-gray-400">专注块单价</div>
                <div className="text-2xl font-black" style={{ color }}>{lane.focusPrice}元/块</div>
              </div>
            )}
          </div>

          {/* 段位进度条 */}
          {rank.tier !== 'king' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{starsInDiv}/{rank.starsPerDiv}星</span>
                <span>→ 下一段位</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full progress-bar"
                  style={{ width: `${(starsInDiv / rank.starsPerDiv) * 100}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${color}60` }} />
              </div>
            </div>
          )}
        </div>

        {/* 成长曲线 */}
        {chartData.length > 2 && (
          <div className="card-bg rounded-2xl p-4 mb-6">
            <div className="text-sm font-bold mb-3 text-gray-300">星数成长曲线</div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#9ca3af' }} itemStyle={{ color }} />
                  <Line type="monotone" dataKey="stars" stroke={color} strokeWidth={2} dot={false}
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 语言分路：语种管理 */}
        {id === 'language' && (
          <div className="card-bg rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-300">已添加语种</span>
              <div className="flex items-center gap-3">
                {languageConfig.languages.length > 1 && (
                  <button onClick={() => setEditingTags(!editingTags)}
                    className={`text-xs transition-colors ${editingTags ? 'text-red-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
                    {editingTags ? '完成' : '管理'}
                  </button>
                )}
                <button onClick={() => setShowAddTag(true)} className="text-xs text-blue-400 flex items-center gap-1">
                  <Plus size={12} /> 添加语种
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {languageConfig.languages.map(lang => (
                editingTags ? (
                  <div key={lang} className="flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-gray-400 text-xs font-bold">
                    <span>{lang}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeLanguage(lang) }}
                      className="w-4 h-4 rounded-full bg-red-500/30 hover:bg-red-500/60 flex items-center justify-center transition-colors">
                      <X size={8} strokeWidth={2.5} className="text-red-300" />
                    </button>
                  </div>
                ) : (
                  <span key={lang} className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold">{lang}</span>
                )
              ))}
            </div>
          </div>
        )}

        {/* 自定义标签添加（非语言分路、非理想生活分路） */}
        {id !== 'language' && id !== 'life' && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-300">领域标签熟练度</span>
            <div className="flex items-center gap-3">
              {tags.length > 0 && (
                <button onClick={() => setEditingTags(!editingTags)}
                  className={`text-xs transition-colors ${editingTags ? 'text-red-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
                  {editingTags ? '完成' : '管理'}
                </button>
              )}
              <button onClick={() => { setShowAddTag(true); setEditingTags(false) }} className="text-xs text-blue-400 flex items-center gap-1">
                <Plus size={12} /> 添加标签
              </button>
            </div>
          </div>
        )}

        {id === 'language' && <div className="text-sm font-bold text-gray-300 mb-3">各组合熟练度</div>}

        {/* 理想生活分路：国策组熟练度 */}
        {id === 'life' && <PolicyGroupProficiency policies={policies} />}

        {/* 熟练度列表（非 life、非 language 已在上方 guard 跳过） */}
        {id !== 'life' && (tags.length > 0 ? (
          <div className="space-y-3">
            {tags.map(tag => {
              const points = proficiency[`${id}:${tag}`] || 0
              const { current, progress } = getProficiencyProgress(points)
              const levelColor = ['#00d4aa','#4f9eff','#9f5fff','#f5c518','#ff6b35','#ff4757','#c0c0c0','#ffd700'][current.level - 1]
              const canDelete = editingTags && id !== 'language'
              return (
                <div key={tag} className={`card-bg rounded-xl p-3 transition-all ${canDelete ? 'border border-red-500/20' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{tag}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: levelColor, background: `${levelColor}20`, border: `1px solid ${levelColor}40` }}>
                        {current.name} Lv.{current.level}
                      </span>
                      {canDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeLaneTag(id, tag) }}
                          className="w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/50 flex items-center justify-center transition-colors">
                          <X size={10} strokeWidth={2.5} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-bar"
                        style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${levelColor}60, ${levelColor})` }} />
                    </div>
                    <span className="text-xs text-gray-500">{points}点</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm py-8">暂无标签，点击添加标签</div>
        ))}
      </div>

      {/* 非 life 分路：添加标签/语种弹窗 */}
      {id === 'life' && null /* life 分路无自定义标签弹窗 */}
      {showAddTag && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setShowAddTag(false)}>
          <div className="w-full max-w-lg card-bg rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-black">{id === 'language' ? '添加语种' : '添加领域标签'}</h2>
            <input value={newTag} onChange={e => setNewTag(e.target.value)}
              placeholder={id === 'language' ? '如：韩语、日语' : '如：健身、跑步'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50" />
            <button onClick={() => {
              if (!newTag.trim()) return
              if (id === 'language') addLanguage(newTag.trim())
              else addLaneTag(id, newTag.trim())
              setNewTag('')
              setShowAddTag(false)
            }} disabled={!newTag.trim()}
              className="w-full py-3 rounded-xl font-bold disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #1a3a6c, #0d2448)', border: '1px solid rgba(79,158,255,0.4)' }}>
              确认添加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 国策组熟练度模块（仅理想生活分路使用）──────────────────
function PolicyGroupProficiency({ policies }) {
  // 按 groupName 统计打卡总次数 → 熟练度点数
  const groupPoints = {}
  policies.forEach(p => {
    const g = p.groupName || '默认'
    groupPoints[g] = (groupPoints[g] || 0) + (p.checkedDates?.length || 0)
  })
  const groups = Object.entries(groupPoints)

  if (groups.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        暂无国策组记录<br />
        <span className="text-xs mt-1 block">在国策页面创建国策组并打卡积累熟练度</span>
      </div>
    )
  }

  const LEVEL_COLORS = ['#00d4aa','#4f9eff','#9f5fff','#f5c518','#ff6b35','#ff4757','#c0c0c0','#ffd700']

  return (
    <div>
      <div className="text-sm font-bold text-gray-300 mb-3">国策组熟练度</div>
      <div className="space-y-3">
        {groups.map(([groupName, points]) => {
          const { current, progress } = getProficiencyProgress(points)
          const levelColor = LEVEL_COLORS[current.level - 1]
          return (
            <div key={groupName} className="card-bg rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{groupName}</span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-500">{policies.filter(p => (p.groupName || '默认') === groupName).length}条国策</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: levelColor, background: `${levelColor}20`, border: `1px solid ${levelColor}40` }}>
                  {current.name} Lv.{current.level}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full progress-bar"
                    style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${levelColor}60, ${levelColor})` }} />
                </div>
                <span className="text-xs text-gray-500">{points}点</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
