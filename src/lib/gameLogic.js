// ============== 分路配置 ==============
export const LANES = {
  research: {
    id: 'research',
    name: '科研巨匠',
    icon: '🔬',
    color: '#9f5fff',
    focusPrice: 10,
    tags: ['论文写作', '文献阅读', '数据处理', '实地调研', '理论框架', '学术汇报'],
    taskRewards: { small: { easy: 8, medium: 12, hard: 18 }, medium: 30, large: 120 },
  },
  study: {
    id: 'study',
    name: '全力学习',
    icon: '📚',
    color: '#4f9eff',
    focusPrice: 8,
    tags: ['AI开发'],
    taskRewards: { small: { easy: 6, medium: 10, hard: 15 }, medium: 25, large: 100 },
  },
  language: {
    id: 'language',
    name: '语言思维',
    icon: '🌐',
    color: '#00d4aa',
    focusPrice: 7,
    tags: [], // 动态生成：语种×能力
    languages: ['英语'],
    abilities: ['听力', '阅读', '写作', '口语'],
    taskRewards: { small: { easy: 5, medium: 8, hard: 12 }, medium: 20, large: 80 },
  },
  fitness: {
    id: 'fitness',
    name: '身体革命',
    icon: '💪',
    color: '#ff6b35',
    focusPrice: 5,
    tags: [],
    taskRewards: { small: { easy: 3, medium: 6, hard: 10 }, medium: 15, large: 50 },
  },
  work: {
    id: 'work',
    name: '超能公务',
    icon: '⚡',
    color: '#f5c518',
    focusPrice: 5,
    tags: [],
    taskRewards: { small: { easy: 3, medium: 6, hard: 10 }, medium: 15, large: 50 },
  },
  life: {
    id: 'life',
    name: '理想生活',
    icon: '✨',
    color: '#ff4757',
    focusPrice: 0,
    tags: [],
    isLifeLane: true,
    taskRewards: { small: { easy: 0, medium: 0, hard: 0 }, medium: 0, large: 0 },
  },
}

export const LANE_ORDER = ['research', 'study', 'language', 'fitness', 'work', 'life']

// ============== 难度系数 ==============
export const DIFFICULTY = {
  easy: { label: '简单', multiplier: 0.8, color: '#00d4aa' },
  medium: { label: '中等', multiplier: 1.0, color: '#f5c518' },
  hard: { label: '困难', multiplier: 1.5, color: '#ff4757' },
}

// ============== 段位系统 ==============
export const RANKS = [
  // 青铜
  { tier: 'bronze', level: 3, name: '青铜III', starsPerDiv: 3, color: '#cd7f32', glowClass: 'glow-bronze' },
  { tier: 'bronze', level: 2, name: '青铜II', starsPerDiv: 3, color: '#cd7f32', glowClass: 'glow-bronze' },
  { tier: 'bronze', level: 1, name: '青铜I', starsPerDiv: 3, color: '#cd7f32', glowClass: 'glow-bronze' },
  // 白银
  { tier: 'silver', level: 3, name: '白银III', starsPerDiv: 3, color: '#c0c0c0', glowClass: 'glow-silver' },
  { tier: 'silver', level: 2, name: '白银II', starsPerDiv: 3, color: '#c0c0c0', glowClass: 'glow-silver' },
  { tier: 'silver', level: 1, name: '白银I', starsPerDiv: 3, color: '#c0c0c0', glowClass: 'glow-silver' },
  // 黄金
  { tier: 'gold', level: 4, name: '黄金IV', starsPerDiv: 4, color: '#ffd700', glowClass: 'glow-gold' },
  { tier: 'gold', level: 3, name: '黄金III', starsPerDiv: 4, color: '#ffd700', glowClass: 'glow-gold' },
  { tier: 'gold', level: 2, name: '黄金II', starsPerDiv: 4, color: '#ffd700', glowClass: 'glow-gold' },
  { tier: 'gold', level: 1, name: '黄金I', starsPerDiv: 4, color: '#ffd700', glowClass: 'glow-gold' },
  // 铂金
  { tier: 'platinum', level: 4, name: '铂金IV', starsPerDiv: 4, color: '#7b68ee', glowClass: 'glow-platinum' },
  { tier: 'platinum', level: 3, name: '铂金III', starsPerDiv: 4, color: '#7b68ee', glowClass: 'glow-platinum' },
  { tier: 'platinum', level: 2, name: '铂金II', starsPerDiv: 4, color: '#7b68ee', glowClass: 'glow-platinum' },
  { tier: 'platinum', level: 1, name: '铂金I', starsPerDiv: 4, color: '#7b68ee', glowClass: 'glow-platinum' },
  // 钻石
  { tier: 'diamond', level: 5, name: '钻石V', starsPerDiv: 5, color: '#4169e1', glowClass: 'glow-diamond' },
  { tier: 'diamond', level: 4, name: '钻石IV', starsPerDiv: 5, color: '#4169e1', glowClass: 'glow-diamond' },
  { tier: 'diamond', level: 3, name: '钻石III', starsPerDiv: 5, color: '#4169e1', glowClass: 'glow-diamond' },
  { tier: 'diamond', level: 2, name: '钻石II', starsPerDiv: 5, color: '#4169e1', glowClass: 'glow-diamond' },
  { tier: 'diamond', level: 1, name: '钻石I', starsPerDiv: 5, color: '#4169e1', glowClass: 'glow-diamond' },
  // 星耀
  { tier: 'master', level: 5, name: '星耀V', starsPerDiv: 5, color: '#00c853', glowClass: 'glow-master' },
  { tier: 'master', level: 4, name: '星耀IV', starsPerDiv: 5, color: '#00c853', glowClass: 'glow-master' },
  { tier: 'master', level: 3, name: '星耀III', starsPerDiv: 5, color: '#00c853', glowClass: 'glow-master' },
  { tier: 'master', level: 2, name: '星耀II', starsPerDiv: 5, color: '#00c853', glowClass: 'glow-master' },
  { tier: 'master', level: 1, name: '星耀I', starsPerDiv: 5, color: '#00c853', glowClass: 'glow-master' },
  // 王者
  { tier: 'king', level: 0, name: '最强王者', starsPerDiv: 10, color: '#ff6600', glowClass: 'glow-king', isKing: true },
]

// 获取段位索引（0=青铜III，最低）
export function getRankIndex(tier, level) {
  return RANKS.findIndex(r => r.tier === tier && r.level === level)
}

// 根据总星数获取当前段位
export function getRankFromTotalStars(totalStars) {
  let accumulated = 0
  for (let i = 0; i < RANKS.length - 1; i++) {
    const rank = RANKS[i]
    const needed = rank.starsPerDiv
    if (totalStars < accumulated + needed) {
      return { rank: RANKS[i], starsInDiv: totalStars - accumulated, accumulated }
    }
    accumulated += needed
  }
  // 王者及以上
  const kingStar = totalStars - accumulated
  const kingTier = getKingSubTier(kingStar)
  return { rank: RANKS[RANKS.length - 1], starsInDiv: kingStar, accumulated, kingTier }
}

export function getKingSubTier(stars) {
  if (stars < 10) return { name: '最强王者', min: 0 }
  if (stars < 20) return { name: '非凡王者', min: 10 }
  if (stars < 30) return { name: '无双王者', min: 20 }
  if (stars < 40) return { name: '绝世王者', min: 30 }
  if (stars < 50) return { name: '至圣王者', min: 40 }
  if (stars < 100) return { name: '荣耀王者', min: 50 }
  return { name: '传奇王者', min: 100 }
}

// 段位提升奖励
export const RANK_PROMOTION_REWARDS = {
  'bronze->silver': 10,
  'silver->gold': 20,
  'gold->platinum': 30,
  'platinum->diamond': 50,
  'diamond->master': 80,
  'master->king': 150,
  'king->king': 30, // 王者每级
}

export function getTierOrder(tier) {
  return ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'king'].indexOf(tier)
}

// ============== 熟练度系统 ==============
export const PROFICIENCY_LEVELS = [
  { level: 1, minPoints: 0, maxPoints: 9, name: '入门' },
  { level: 2, minPoints: 10, maxPoints: 29, name: '熟悉' },
  { level: 3, minPoints: 30, maxPoints: 69, name: '熟练' },
  { level: 4, minPoints: 70, maxPoints: 139, name: '精通' },
  { level: 5, minPoints: 140, maxPoints: 249, name: '专家' },
  { level: 6, minPoints: 250, maxPoints: 399, name: '大师' },
  { level: 7, minPoints: 400, maxPoints: 599, name: '宗师' },
  { level: 8, minPoints: 600, maxPoints: Infinity, name: '传奇' },
]

export function getProficiencyLevel(points) {
  for (let i = PROFICIENCY_LEVELS.length - 1; i >= 0; i--) {
    if (points >= PROFICIENCY_LEVELS[i].minPoints) return PROFICIENCY_LEVELS[i]
  }
  return PROFICIENCY_LEVELS[0]
}

export function getProficiencyProgress(points) {
  const current = getProficiencyLevel(points)
  const next = PROFICIENCY_LEVELS.find(l => l.level === current.level + 1)
  if (!next) return { current, progress: 100, pointsToNext: 0 }
  const progress = ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100
  return { current, next, progress, pointsToNext: next.minPoints - points }
}

// ============== 额度计算 ==============
export function calcFocusReward(laneId, difficulty, durationMin = 60) {
  const lane = LANES[laneId]
  if (!lane || lane.focusPrice === 0) return 0
  return lane.focusPrice * DIFFICULTY[difficulty].multiplier * (durationMin / 60)
}

export function calcTaskReward(laneId, taskLevel, difficulty = 'medium') {
  const lane = LANES[laneId]
  if (!lane) return 0
  if (taskLevel === 'small') return lane.taskRewards.small[difficulty] || 0
  if (taskLevel === 'medium') return lane.taskRewards.medium || 0
  if (taskLevel === 'large') return lane.taskRewards.large || 0
  return 0
}

// ============== 语言思维标签生成 ==============
export function getLanguageTags(languages = ['英语'], abilities = ['听力', '阅读', '写作', '口语']) {
  const tags = []
  for (const lang of languages) {
    for (const ability of abilities) {
      tags.push(`${lang}·${ability}`)
    }
  }
  return tags
}

// ============== 赛季重置 ==============
export function getSeasonResetRank(tier, kingStars = 0) {
  const tierOrder = getTierOrder(tier)

  if (tier === 'king') {
    if (kingStars >= 150) return { tier: 'king', level: 0, stars: 1 }
    if (kingStars >= 125) return { tier: 'master', level: 1, stars: 0 }
    if (kingStars >= 100) return { tier: 'master', level: 2, stars: 0 }
    if (kingStars >= 75) return { tier: 'master', level: 3, stars: 0 }
    if (kingStars >= 50) return { tier: 'master', level: 4, stars: 0 }
    if (kingStars >= 40) return { tier: 'master', level: 5, stars: 0 }
    if (kingStars >= 30) return { tier: 'diamond', level: 1, stars: 0 }
    if (kingStars >= 20) return { tier: 'diamond', level: 2, stars: 0 }
    if (kingStars >= 10) return { tier: 'diamond', level: 3, stars: 0 }
    return { tier: 'diamond', level: 4, stars: 0 }
  }
  if (tier === 'master') {
    // 星耀一二→钻石五；星耀三四→铂金一；星耀五→铂金二
    if (level <= 2) return { tier: 'diamond', level: 5, stars: 0 }
    if (level <= 4) return { tier: 'platinum', level: 1, stars: 0 }
    return { tier: 'platinum', level: 2, stars: 0 }
  }
  // 其他降一个大段，最低青铜III
  if (tierOrder <= 0) return { tier: 'bronze', level: 3, stars: 0 }
  const prevTiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'king']
  const newTier = prevTiers[tierOrder - 1]
  // 取该段最低小段
  const maxLevel = { bronze: 3, silver: 3, gold: 4, platinum: 4, diamond: 5, master: 5 }
  return { tier: newTier, level: maxLevel[newTier], stars: 0 }
}

// ============== 日期工具 ==============
export function isSeasonEnd(date) {
  const d = date || new Date()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return (month === 3 || month === 6 || month === 9 || month === 12) && day === 31
}

export function isFirstDayOfMonth(date) {
  return (date || new Date()).getDate() === 1
}

export function isSunday(date) {
  return (date || new Date()).getDay() === 0
}

// ============== 国策加星逻辑 ==============
export function calcLifeLaneStars(litRate) {
  if (litRate >= 1.0) return 2
  if (litRate >= 0.8) return 1
  if (litRate >= 0.5) return 0
  return -1
}
