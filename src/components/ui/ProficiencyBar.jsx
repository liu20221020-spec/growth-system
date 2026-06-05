import { getProficiencyProgress } from '../../lib/gameLogic'

const LEVEL_COLORS = ['#00d4aa', '#4f9eff', '#9f5fff', '#f5c518', '#ff6b35', '#ff4757', '#c0c0c0', '#ffd700']

export default function ProficiencyBar({ tag, points = 0, showTag = true }) {
  const { current, next, progress, pointsToNext } = getProficiencyProgress(points)
  const color = LEVEL_COLORS[current.level - 1]

  return (
    <div className="space-y-1">
      {showTag && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 truncate max-w-[120px]">{tag}</span>
          <span style={{ color }} className="font-bold shrink-0 ml-2">{current.name} Lv.{current.level}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-bar"
            style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{points}点</span>
      </div>
    </div>
  )
}
