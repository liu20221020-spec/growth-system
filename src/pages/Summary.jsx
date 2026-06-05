import useStore from '../store/useStore'
import { LANES, LANE_ORDER, getRankFromTotalStars } from '../lib/gameLogic'
import RankBadge from '../components/ui/RankBadge'
import FocusHeatmap from '../components/summary/FocusHeatmap'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import dayjs from 'dayjs'

const COLORS = ['#9f5fff', '#4f9eff', '#00d4aa', '#ff6b35', '#f5c518', '#ff4757']

export default function Summary() {
  const { lanes, focusBlocks, ledger, transactions, policies, streakDays } = useStore()

  const currentMonth = dayjs().format('YYYY-MM')
  const monthBlocks = focusBlocks.filter(b => b.completed && b.date?.startsWith(currentMonth))
  const totalEarned = ledger.filter(l => l.amount > 0 && l.date?.startsWith(currentMonth)).reduce((s, l) => s + l.amount, 0)
  const totalSpent = transactions.filter(t => t.date?.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0)

  // 各分路专注块占比
  const laneBlockCounts = LANE_ORDER.map(id => ({
    name: LANES[id].name,
    value: monthBlocks.filter(b => b.laneId === id).length,
    icon: LANES[id].icon,
  })).filter(l => l.value > 0)

  // 今日打卡情况
  const today = dayjs().format('YYYY-MM-DD')
  const todayLit = policies.filter(p => p.checkedDates?.includes(today)).length

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-black mb-6">本月总结</h1>

        {/* 数据概览 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: '本月专注块', value: monthBlocks.length, unit: '个', color: '#4f9eff' },
            { label: '本月收入', value: `¥${totalEarned.toFixed(0)}`, unit: '', color: '#00d4aa' },
            { label: '本月消费', value: `¥${totalSpent.toFixed(0)}`, unit: '', color: '#ff4757' },
            { label: '连续签到', value: streakDays, unit: '天', color: '#f5c518' },
          ].map(item => (
            <div key={item.label} className="card-bg rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-1">{item.label}</div>
              <div className="text-2xl font-black" style={{ color: item.color }}>
                {item.value}<span className="text-sm text-gray-400 ml-1">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 专注热力图 */}
        <div className="mb-6">
          <FocusHeatmap focusBlocks={focusBlocks} />
        </div>

        {/* 六条分路当前段位 */}
        <div className="card-bg rounded-2xl p-4 mb-6">
          <div className="text-sm font-bold mb-4 text-gray-300">六条分路赛季进度</div>
          <div className="space-y-3">
            {LANE_ORDER.map(id => {
              const data = lanes[id] || { totalStars: 0 }
              const { rank, starsInDiv } = getRankFromTotalStars(data.totalStars || 0)
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{LANES[id].icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{LANES[id].name}</span>
                      <RankBadge totalStars={data.totalStars || 0} size="sm" />
                    </div>
                    {rank.tier !== 'king' && (
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${(starsInDiv / rank.starsPerDiv) * 100}%`,
                            background: `linear-gradient(90deg, ${getLaneColor(id)}60, ${getLaneColor(id)})`,
                          }} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 专注块分路饼图 */}
        {laneBlockCounts.length > 0 && (
          <div className="card-bg rounded-2xl p-4 mb-6">
            <div className="text-sm font-bold mb-3 text-gray-300">本月专注分布</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={laneBlockCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    dataKey="value" nameKey="name" paddingAngle={2}>
                    {laneBlockCounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val, name) => [`${val}块`, name]} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 国策状态 */}
        <div className="card-bg rounded-2xl p-4 mb-6">
          <div className="text-sm font-bold mb-3 text-gray-300">国策状态</div>
          {policies.length > 0 ? (
            <div className="space-y-2">
              {policies.map(p => {
                const total = p.checkedDates?.length || 0
                const recent7 = Array.from({length:7}, (_,i) => dayjs().subtract(i,'day').format('YYYY-MM-DD'))
                  .filter(d => p.checkedDates?.includes(d)).length
                return (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-sm">{p.name}</span>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">近7天 {recent7}/7</div>
                      <div className="text-xs text-gray-500">累计 {total}天</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">暂无国策</div>
          )}
        </div>

        {/* 赛季说明 */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-300 font-bold mb-1">📅 赛季说明</div>
          <div className="text-xs text-gray-400">每季度末（3/31、6/30、9/30、12/31）赛季结算，段位按规则继承。当前赛季结束于 {getSeasonEnd()}。</div>
        </div>
      </div>
    </div>
  )
}

function getLaneColor(id) {
  const colors = { research: '#9f5fff', study: '#4f9eff', language: '#00d4aa', fitness: '#ff6b35', work: '#f5c518', life: '#ff4757' }
  return colors[id] || '#4f9eff'
}

function getSeasonEnd() {
  const now = dayjs()
  const month = now.month() + 1
  if (month <= 3) return '2026年3月31日'
  if (month <= 6) return '2026年6月30日'
  if (month <= 9) return '2026年9月30日'
  return '2026年12月31日'
}
