import { LANES, LANE_ORDER, getRankFromTotalStars } from '../../lib/gameLogic'

const TIER_MAX = {
  bronze: 9, silver: 18, gold: 34, platinum: 50, diamond: 75, master: 100, king: 150
}

export default function HexRadar({ lanesData }) {
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 45

  const axes = LANE_ORDER.map((id, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180)
    return { id, angle, lane: LANES[id] }
  })

  const getPoint = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  })

  // 背景六边形
  const bgLevels = [0.2, 0.4, 0.6, 0.8, 1.0]
  const bgPolygons = bgLevels.map(level => {
    const pts = axes.map(a => getPoint(a.angle, r * level))
    return pts.map(p => `${p.x},${p.y}`).join(' ')
  })

  // 数据多边形
  const dataPoints = axes.map(a => {
    const data = lanesData[a.id] || { totalStars: 0 }
    const { rank, starsInDiv } = getRankFromTotalStars(data.totalStars || 0)
    const max = TIER_MAX[rank.tier] || 150
    const ratio = Math.min((data.totalStars || 0) / max, 1)
    return getPoint(a.angle, r * Math.max(ratio, 0.05))
  })
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* 背景网格 */}
      {bgPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      ))}
      {/* 轴线 */}
      {axes.map(a => {
        const outer = getPoint(a.angle, r)
        return <line key={a.id} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      })}
      {/* 数据区域 */}
      <polygon points={dataPath} fill="rgba(79,158,255,0.15)" stroke="#4f9eff" strokeWidth="1.5" />
      {/* 数据点 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="#4f9eff" />
      ))}
      {/* 标签 */}
      {axes.map(a => {
        const labelR = r + 12
        const lp = getPoint(a.angle, labelR)
        return (
          <text key={a.id} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fill="rgba(255,255,255,0.6)">{LANES[a.id].icon}</text>
        )
      })}
    </svg>
  )
}
