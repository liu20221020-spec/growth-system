import dayjs from 'dayjs'
import { useState } from 'react'

// 过去 N 周的专注热力图（GitHub 风格，竖向排列按列）
const WEEKS = 18   // 显示最近18周
const DAYS  = 7

// 颜色梯度：0块→深色，1→浅绿，2-3→中，4-5→亮，6+→最亮
function getColor(count) {
  if (count === 0) return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.04)' }
  if (count === 1) return { bg: 'rgba(79,158,255,0.25)',  border: 'rgba(79,158,255,0.3)' }
  if (count <= 3)  return { bg: 'rgba(0,212,170,0.35)',   border: 'rgba(0,212,170,0.4)' }
  if (count <= 5)  return { bg: 'rgba(0,212,170,0.60)',   border: 'rgba(0,212,170,0.65)', glow: '0 0 6px rgba(0,212,170,0.4)' }
  return              { bg: 'rgba(0,212,170,0.90)',   border: 'rgba(0,212,170,1)',    glow: '0 0 10px rgba(0,212,170,0.6)' }
}

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function FocusHeatmap({ focusBlocks }) {
  const [tooltip, setTooltip] = useState(null)

  // 生成日期→块数 映射
  const countMap = {}
  focusBlocks.filter(b => b.completed).forEach(b => {
    const d = b.date?.slice(0, 10)
    if (d) countMap[d] = (countMap[d] || 0) + 1
  })

  // 生成18周的格子（从今天往前推 WEEKS*7 天，起点对齐周日）
  const today = dayjs()
  // 找到最近的周六（或今天）作为结束
  const endDate   = today
  const startDate = endDate.subtract(WEEKS * 7 - 1, 'day')

  // 按列（周）组织：每列7天
  const columns = []
  let cur = startDate
  // 先对齐到最近一个周日
  while (cur.day() !== 0) cur = cur.subtract(1, 'day')

  for (let w = 0; w < WEEKS; w++) {
    const col = []
    for (let d = 0; d < DAYS; d++) {
      const date = cur.add(w * 7 + d, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const isFuture = date.isAfter(today)
      col.push({
        date: dateStr,
        display: date.format('M/D'),
        count: isFuture ? -1 : (countMap[dateStr] || 0),
        month: date.month(),
        dayOfWeek: date.day(),
      })
    }
    columns.push(col)
  }

  // 月份标签：找到每月第一次出现的列
  const monthMarkers = {}
  columns.forEach((col, wi) => {
    col.forEach(cell => {
      if (cell.dayOfWeek === 0 && !(cell.month in monthMarkers)) {
        monthMarkers[cell.month] = wi
      }
    })
  })

  // 统计数据
  const totalDays = Object.values(countMap).filter(v => v > 0).length
  const maxStreak = calcMaxStreak(countMap, today)
  const totalBlocks = focusBlocks.filter(b => b.completed).length

  return (
    <div className="card-bg rounded-2xl p-4">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-gray-200">专注热力图</div>
          <div className="text-xs text-gray-500 mt-0.5">最近 {WEEKS} 周的专注记录</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>少</span>
          {[0,1,3,5,6].map(n => {
            const c = getColor(n)
            return (
              <div key={n} className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
            )
          })}
          <span>多</span>
        </div>
      </div>

      {/* 日标签（周日~周六）*/}
      <div className="flex mb-1">
        <div className="w-5 shrink-0" /> {/* 占位 */}
        <div className="flex-1 overflow-hidden">
          {/* 月份标签行 */}
          <div className="flex mb-1">
            {columns.map((col, wi) => {
              const firstCell = col[0]
              const showMonth = monthMarkers[firstCell.month] === wi
              return (
                <div key={wi} className="flex-1 text-center">
                  {showMonth
                    ? <span className="text-[9px] text-gray-600">{MONTH_LABELS[firstCell.month]}</span>
                    : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 格子区域 */}
      <div className="flex gap-0.5">
        {/* 星期标签 */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="h-3 flex items-center justify-end">
              {(i === 1 || i === 3 || i === 5) && (
                <span className="text-[9px] text-gray-600 leading-none">{l}</span>
              )}
            </div>
          ))}
        </div>

        {/* 热力格子 */}
        <div className="flex gap-0.5 flex-1 overflow-hidden">
          {columns.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-0.5 flex-1">
              {col.map((cell, di) => {
                if (cell.count === -1) {
                  // 未来日期，透明
                  return <div key={di} className="aspect-square rounded-sm opacity-0" />
                }
                const c = getColor(cell.count)
                return (
                  <div
                    key={di}
                    className="aspect-square rounded-sm cursor-pointer transition-transform hover:scale-125 relative"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      boxShadow: c.glow || 'none',
                    }}
                    onMouseEnter={() => setTooltip({ ...cell, x: wi, y: di })}
                    onMouseLeave={() => setTooltip(null)}
                    onTouchStart={() => setTooltip(cell.count > 0 ? { ...cell, x: wi, y: di } : null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.count > 0 && (
        <div className="mt-2 text-center text-xs text-gray-400 animate-count">
          <span className="text-white font-bold">{tooltip.display}</span>
          {' · '}
          <span style={{ color: '#00d4aa' }} className="font-bold">{tooltip.count} 个专注块</span>
        </div>
      )}

      {/* 底部统计 */}
      <div className="flex items-center justify-around mt-4 pt-3 border-t border-white/5">
        <div className="text-center">
          <div className="text-lg font-black text-white">{totalBlocks}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">累计专注块</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-black" style={{ color: '#00d4aa' }}>{totalDays}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">有记录天数</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-black text-orange-400">{maxStreak}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">最长连续天</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-black text-yellow-400">
            {totalDays > 0 ? (totalBlocks / totalDays).toFixed(1) : '0'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">块/有记录天</div>
        </div>
      </div>
    </div>
  )
}

// 计算最长连续专注天数
function calcMaxStreak(countMap, today) {
  let max = 0, cur = 0
  for (let i = 0; i < 365; i++) {
    const d = today.subtract(i, 'day').format('YYYY-MM-DD')
    if (countMap[d] > 0) {
      cur++
      max = Math.max(max, cur)
    } else {
      cur = 0
    }
  }
  return max
}
