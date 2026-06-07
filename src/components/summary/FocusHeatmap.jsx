import dayjs from 'dayjs'
import { useState, useRef, useEffect } from 'react'

// 按时长推算序列增量（与 store/loadUserData 逻辑一致）
function seqIncrOf(durationMin) {
  if (durationMin === 5)  return 0.1
  if (durationMin === 25) return 0.5
  if (durationMin === 90) return 1.5
  return 1.0
}

// 颜色梯度：0→明显灰底，>0 按序列值着绿色
function getColor(seq) {
  if (seq === 0)  return { bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.14)' }
  if (seq < 0.5)  return { bg: 'rgba(0,212,170,0.32)',   border: 'rgba(0,212,170,0.38)' }
  if (seq < 1.0)  return { bg: 'rgba(0,212,170,0.52)',   border: 'rgba(0,212,170,0.58)' }
  if (seq < 2.0)  return { bg: 'rgba(0,212,170,0.72)',   border: 'rgba(0,212,170,0.78)', glow: '0 0 4px rgba(0,212,170,0.28)' }
  if (seq < 3.5)  return { bg: 'rgba(0,212,170,0.88)',   border: 'rgba(0,212,170,0.92)', glow: '0 0 7px rgba(0,212,170,0.42)' }
  return              { bg: 'rgba(0,212,170,1.0)',    border: '#00d4aa',              glow: '0 0 11px rgba(0,212,170,0.62)' }
}

const DAY_LABELS   = ['日','一','二','三','四','五','六']
const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function FocusHeatmap({ focusBlocks }) {
  const [tooltip, setTooltip] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [])

  // 日期 → 序列值（加权），与专注序列计算逻辑一致
  const seqMap = {}
  focusBlocks.filter(b => b.completed).forEach(b => {
    const d = b.date?.slice(0, 10)
    if (d) {
      const inc = seqIncrOf(b.durationMin)
      seqMap[d] = +((( seqMap[d] || 0) + inc).toFixed(1))
    }
  })

  const today = dayjs()

  // 起点：今年6月1日，对齐到最近周日
  const june1 = dayjs().startOf('year').month(5).date(1)
  let startSunday = june1
  while (startSunday.day() !== 0) startSunday = startSunday.subtract(1, 'day')

  // 结尾：今天所在周的周六
  const endSaturday = today.add(6 - today.day(), 'day')

  const todayStr = today.format('YYYY-MM-DD')

  // 生成所有列（每列=一周，周日→周六）
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
        seq:     isFuture ? -1 : (seqMap[dateStr] || 0),
        month:   date.month(),
        isToday: dateStr === todayStr,
        isFuture,
      })
    }
    columns.push(col)
    cur = cur.add(7, 'day')
  }

  // 月份标签
  const monthMarkers = {}
  columns.forEach((col, wi) => {
    const m = col[0].month
    if (!(m in monthMarkers)) monthMarkers[m] = wi
  })

  // 底部统计（全部用序列值）
  const totalSeq  = Object.values(seqMap).reduce((s, v) => +((s + v).toFixed(1)), 0)
  const totalDays = Object.values(seqMap).filter(v => v > 0).length
  const maxStreak = calcMaxStreak(seqMap, today)

  const CELL = 13
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
          {[0, 0.3, 0.8, 2, 4].map((v, i) => {
            const c = getColor(v)
            return <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
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
          {/* 星期标签列 */}
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

            {/* 格子网格 */}
            <div style={{ display: 'flex', gap: GAP }}>
              {columns.map((col, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: CELL, flexShrink: 0 }}>
                  {col.map((cell, di) => {
                    // 未来日期：透明占位
                    if (cell.isFuture) {
                      return <div key={di} style={{ width: CELL, height: CELL, borderRadius: 3, opacity: 0 }} />
                    }
                    const c = getColor(cell.seq)
                    return (
                      <div
                        key={di}
                        style={{
                          width: CELL, height: CELL, borderRadius: 3,
                          background: c.bg,
                          border: cell.isToday ? '1.5px solid #f5c518' : `1px solid ${c.border}`,
                          boxShadow: cell.isToday ? '0 0 6px rgba(245,197,24,0.5)' : (c.glow || 'none'),
                          cursor: cell.seq > 0 ? 'pointer' : 'default',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; setTooltip(cell) }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   setTooltip(null) }}
                        onTouchStart={() => setTooltip(cell)}
                        onTouchEnd={() => setTimeout(() => setTooltip(null), 1500)}
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
          {tooltip.seq > 0
            ? <span style={{ color: '#00d4aa' }} className="font-bold">序列 +{Number.isInteger(tooltip.seq) ? tooltip.seq : tooltip.seq.toFixed(1)}</span>
            : <span className="text-gray-600">无记录</span>}
        </div>
      )}

      {/* 底部统计 */}
      <div className="flex items-center justify-around mt-4 pt-3 border-t border-white/5">
        <div className="text-center">
          <div className="text-lg font-black text-white">
            {Number.isInteger(totalSeq) ? totalSeq : totalSeq.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">累计序列值</div>
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
            {totalDays > 0 ? (totalSeq / totalDays).toFixed(1) : '0'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">序列/天</div>
        </div>
      </div>
    </div>
  )
}

function calcMaxStreak(seqMap, today) {
  let max = 0, cur = 0
  for (let i = 0; i < 365; i++) {
    const d = today.subtract(i, 'day').format('YYYY-MM-DD')
    if ((seqMap[d] || 0) > 0) { cur++; max = Math.max(max, cur) }
    else cur = 0
  }
  return max
}
