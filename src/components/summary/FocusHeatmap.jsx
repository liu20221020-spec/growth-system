import dayjs from 'dayjs'
import { useState, useRef, useEffect } from 'react'

// 颜色梯度：0→暗底，1→明显浅绿，越多越深越亮
function getColor(count) {
  if (count === 0) return { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.05)' }
  if (count === 1) return { bg: 'rgba(0,212,170,0.50)',   border: 'rgba(0,212,170,0.55)' }
  if (count <= 3)  return { bg: 'rgba(0,212,170,0.70)',   border: 'rgba(0,212,170,0.75)', glow: '0 0 4px rgba(0,212,170,0.35)' }
  if (count <= 5)  return { bg: 'rgba(0,212,170,0.88)',   border: 'rgba(0,212,170,0.9)',  glow: '0 0 8px rgba(0,212,170,0.55)' }
  return              { bg: 'rgba(0,212,170,1.0)',    border: '#00d4aa',              glow: '0 0 12px rgba(0,212,170,0.75)' }
}

const DAY_LABELS   = ['日','一','二','三','四','五','六']
const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function FocusHeatmap({ focusBlocks }) {
  const [tooltip, setTooltip] = useState(null)
  const scrollRef = useRef(null)

  // 挂载后自动滚到最右（今天）
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [])

  // 日期 → 专注块数 映射
  const countMap = {}
  focusBlocks.filter(b => b.completed).forEach(b => {
    const d = b.date?.slice(0, 10)
    if (d) countMap[d] = (countMap[d] || 0) + 1
  })

  const today = dayjs()

  // 起点：今年6月1日（若今天已在6月后则仍从6月开始）
  const june1 = dayjs().startOf('year').month(5).date(1)  // 今年6月1日
  // 对齐到最近的周日（往前找）
  let startSunday = june1
  while (startSunday.day() !== 0) startSunday = startSunday.subtract(1, 'day')

  // 结尾：今天所在周的周六（+6天方向），至少包含今天
  const endSaturday = today.add(6 - today.day(), 'day')

  // 生成所有列（每列=一周，从周日到周六）
  const columns = []
  let cur = startSunday
  while (!cur.isAfter(endSaturday)) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date    = cur.add(d, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const isFuture = date.isAfter(today)
      col.push({
        date: dateStr,
        display: date.format('M/D'),
        count: isFuture ? -1 : (countMap[dateStr] || 0),
        month: date.month(),
        dayOfWeek: date.day(),
        isToday: dateStr === today.format('YYYY-MM-DD'),
      })
    }
    columns.push(col)
    cur = cur.add(7, 'day')
  }

  // 月份标签：每月首次出现在列0（周日）的那列
  const monthMarkers = {}
  columns.forEach((col, wi) => {
    const m = col[0].month
    if (!(m in monthMarkers)) monthMarkers[m] = wi
  })

  // 统计
  const totalDays   = Object.values(countMap).filter(v => v > 0).length
  const maxStreak   = calcMaxStreak(countMap, today)
  const totalBlocks = focusBlocks.filter(b => b.completed).length
  const CELL = 13  // 格子尺寸 px
  const GAP  = 2

  return (
    <div className="card-bg rounded-2xl p-4">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-gray-200">专注热力图</div>
          <div className="text-xs text-gray-500 mt-0.5">从今年6月起 · 可左右滑动</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>少</span>
          {[0,1,2,4,6].map(n => {
            const c = getColor(n)
            return <div key={n} className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
          })}
          <span>多</span>
        </div>
      </div>

      {/* 可横向滚动区域 */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-1"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        <div style={{ display: 'inline-flex', gap: 0 }}>
          {/* 星期标签列（固定在左侧感觉更好用flex absolute做，这里简单做内联） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 4, paddingTop: 16 }}>
            {DAY_LABELS.map((l, i) => (
              <div key={i} style={{ height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {(i === 1 || i === 3 || i === 5) && (
                  <span style={{ fontSize: 9, color: '#4b5563', lineHeight: 1 }}>{l}</span>
                )}
              </div>
            ))}
          </div>

          {/* 格子主体 */}
          <div>
            {/* 月份标签行 */}
            <div style={{ display: 'flex', gap: GAP, marginBottom: 4, height: 14 }}>
              {columns.map((col, wi) => {
                const m = col[0].month
                const show = monthMarkers[m] === wi
                return (
                  <div key={wi} style={{ width: CELL, flexShrink: 0 }}>
                    {show && <span style={{ fontSize: 9, color: '#6b7280', whiteSpace: 'nowrap' }}>{MONTH_LABELS[m]}</span>}
                  </div>
                )
              })}
            </div>

            {/* 格子网格：横向=周列，纵向=星期 */}
            <div style={{ display: 'flex', gap: GAP }}>
              {columns.map((col, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: CELL, flexShrink: 0 }}>
                  {col.map((cell, di) => {
                    if (cell.count === -1) {
                      return <div key={di} style={{ width: CELL, height: CELL, borderRadius: 3, opacity: 0 }} />
                    }
                    const c = getColor(cell.count)
                    return (
                      <div
                        key={di}
                        style={{
                          width: CELL, height: CELL, borderRadius: 3,
                          background: c.bg,
                          border: cell.isToday ? '1.5px solid #f5c518' : `1px solid ${c.border}`,
                          boxShadow: cell.isToday ? '0 0 6px rgba(245,197,24,0.5)' : (c.glow || 'none'),
                          cursor: cell.count > 0 ? 'pointer' : 'default',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; if (cell.count >= 0) setTooltip(cell) }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; setTooltip(null) }}
                        onTouchStart={() => cell.count > 0 && setTooltip(cell)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 text-center text-xs text-gray-400">
          <span className="text-white font-bold">{tooltip.display}</span>
          {tooltip.isToday && <span className="text-yellow-400 ml-1">·今天</span>}
          {' · '}
          {tooltip.count > 0
            ? <span style={{ color: '#00d4aa' }} className="font-bold">{tooltip.count} 个专注块</span>
            : <span className="text-gray-600">无记录</span>}
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

function calcMaxStreak(countMap, today) {
  let max = 0, cur = 0
  for (let i = 0; i < 365; i++) {
    const d = today.subtract(i, 'day').format('YYYY-MM-DD')
    if (countMap[d] > 0) { cur++; max = Math.max(max, cur) }
    else cur = 0
  }
  return max
}
