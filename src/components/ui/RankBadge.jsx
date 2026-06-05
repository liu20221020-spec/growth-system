import { getRankFromTotalStars, RANKS } from '../../lib/gameLogic'

const TIER_SYMBOLS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💜',
  diamond: '💎',
  master: '⭐',
  king: '👑',
}

const TIER_COLORS = {
  bronze: { bg: 'from-amber-900/40 to-amber-800/20', border: 'border-amber-700/50', text: '#cd7f32', glow: 'rgba(205,127,50,0.4)' },
  silver: { bg: 'from-slate-600/40 to-slate-500/20', border: 'border-slate-400/50', text: '#c0c0c0', glow: 'rgba(192,192,192,0.4)' },
  gold: { bg: 'from-yellow-700/40 to-yellow-600/20', border: 'border-yellow-500/50', text: '#ffd700', glow: 'rgba(255,215,0,0.4)' },
  platinum: { bg: 'from-purple-800/40 to-purple-700/20', border: 'border-purple-500/50', text: '#7b68ee', glow: 'rgba(123,104,238,0.4)' },
  diamond: { bg: 'from-blue-800/40 to-blue-700/20', border: 'border-blue-500/50', text: '#4169e1', glow: 'rgba(65,105,225,0.4)' },
  master: { bg: 'from-green-800/40 to-green-700/20', border: 'border-green-500/50', text: '#00c853', glow: 'rgba(0,200,83,0.4)' },
  king: { bg: 'from-orange-800/40 to-red-700/20', border: 'border-orange-500/50', text: '#ff6600', glow: 'rgba(255,102,0,0.5)' },
}

export default function RankBadge({ totalStars = 0, size = 'md', showName = true }) {
  const { rank, starsInDiv, kingTier } = getRankFromTotalStars(totalStars)
  const colors = TIER_COLORS[rank.tier]
  const symbol = TIER_SYMBOLS[rank.tier]
  const displayName = rank.tier === 'king' && kingTier ? kingTier.name : rank.name

  const sizes = {
    sm: { badge: 'px-2 py-0.5 text-xs', icon: 'text-sm' },
    md: { badge: 'px-3 py-1 text-sm', icon: 'text-base' },
    lg: { badge: 'px-4 py-2 text-base', icon: 'text-xl' },
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r ${colors.bg} ${colors.border} ${sizes[size].badge} font-bold`}
      style={{ color: colors.text, boxShadow: `0 0 8px ${colors.glow}` }}
    >
      <span className={sizes[size].icon}>{symbol}</span>
      {showName && <span>{displayName}</span>}
    </div>
  )
}

export function StarRow({ totalStars = 0, laneId }) {
  const { rank, starsInDiv } = getRankFromTotalStars(totalStars)
  const colors = TIER_COLORS[rank.tier]

  if (rank.tier === 'king') {
    return (
      <div className="flex items-center gap-1">
        <span style={{ color: colors.text }} className="text-xs font-bold">
          {starsInDiv}星
        </span>
      </div>
    )
  }

  const stars = Array.from({ length: rank.starsPerDiv }, (_, i) => i < starsInDiv)

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((filled, i) => (
        <span key={i} style={{ color: filled ? colors.text : 'rgba(255,255,255,0.2)', filter: filled ? `drop-shadow(0 0 3px ${colors.text})` : 'none' }}
          className="text-xs leading-none">
          ★
        </span>
      ))}
    </div>
  )
}
