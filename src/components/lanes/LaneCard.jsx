import { useNavigate } from 'react-router-dom'
import RankBadge, { StarRow } from '../ui/RankBadge'
import { getRankFromTotalStars, RANKS } from '../../lib/gameLogic'

const TIER_COLORS = {
  bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700',
  platinum: '#7b68ee', diamond: '#4169e1', master: '#00c853', king: '#ff6600',
}

export default function LaneCard({ lane, data }) {
  const navigate = useNavigate()
  const { rank, starsInDiv } = getRankFromTotalStars(data.totalStars || 0)
  const color = TIER_COLORS[rank.tier]

  // 进度百分比
  const progress = rank.tier === 'king'
    ? Math.min((starsInDiv % 10) / 10 * 100, 100)
    : (starsInDiv / rank.starsPerDiv) * 100

  return (
    <div
      onClick={() => navigate(`/lane/${lane.id}`)}
      className="card-bg card-bg-hover rounded-2xl p-4 cursor-pointer transition-all active:scale-95"
      style={{ borderColor: `${color}30` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{lane.icon}</span>
          <div>
            <div className="text-sm font-bold text-white">{lane.name}</div>
            <StarRow totalStars={data.totalStars || 0} />
          </div>
        </div>
        <RankBadge totalStars={data.totalStars || 0} size="sm" showName={false} />
      </div>

      {/* 进度条 */}
      <div className="mt-2 space-y-1">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-bar"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, boxShadow: `0 0 6px ${color}60` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{rank.name}</span>
          <span>{data.totalStars || 0}总星</span>
        </div>
      </div>
    </div>
  )
}
