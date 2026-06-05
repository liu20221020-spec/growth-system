import { create } from 'zustand'
import { LANES, LANE_ORDER, getRankFromTotalStars, calcFocusReward,
         calcTaskReward, RANK_PROMOTION_REWARDS, getTierOrder, getLanguageTags } from '../lib/gameLogic'
import { initUserData, loadUserData, upsertUser, upsertLane, upsertTag,
         insertTask, updateTask, dbDeleteTask, insertFocusBlock,
         insertPolicy, updatePolicyDates, insertTransaction } from '../lib/db'
import dayjs from 'dayjs'

// ─── 初始分路状态 ──────────────────────────────────────────
const initLanes = () => {
  const lanes = {}
  LANE_ORDER.forEach(id => { lanes[id] = { id, totalStars: 0, tier: 'bronze', level: 3, starsInDiv: 0 } })
  return lanes
}

// ─── 初始熟练度状态 ───────────────────────────────────────
const initProficiency = () => {
  const p = {}
  ;['论文写作','文献阅读','数据处理','实地调研','理论框架','学术汇报'].forEach(t => { p[`research:${t}`] = 0 })
  p['study:AI开发'] = 0
  getLanguageTags(['英语']).forEach(t => { p[`language:${t}`] = 0 })
  return p
}

// ─── Store ────────────────────────────────────────────────
const useStore = create((set, get) => ({

  // ══════ 用户 ══════
  userId: null,
  username: '勇士',
  dataLoaded: false,

  // ══════ 核心数据 ══════
  balance: 0,
  todayEarned: 0,
  focusSequence: 0,
  streakDays: 0,
  lastSignDate: null,
  lastMonthlyBonus: null,
  todayStatus: null,
  todayStatusDate: null,

  // ══════ 分路 & 熟练度 ══════
  lanes: initLanes(),
  proficiency: initProficiency(),
  languageConfig: { languages: ['英语'], abilities: ['听力','阅读','写作','口语'] },
  laneTags: {
    research: ['论文写作','文献阅读','数据处理','实地调研','理论框架','学术汇报'],
    study: ['AI开发'],
    fitness: [],
    work: [],
  },

  // ══════ 任务 / 专注块 ══════
  tasks: [],
  focusBlocks: [],

  // ══════ 国策 ══════
  policies: [],

  // ══════ 账本 & 消费 ══════
  ledger: [],       // 所有收支记录
  transactions: [], // 仅消费记录（供消费页展示）

  // ══════ 通知 ══════
  notifications: [],

  // ═══════════════════════════════════════════════════════
  // 从 Supabase 加载全量数据
  // ═══════════════════════════════════════════════════════
  loadFromSupabase: async (userId) => {
    const { userData, lanesData, tagsData, tasksData, focusData, policiesData, transData } = await loadUserData(userId)

    if (!userData) {
      // 新用户：初始化数据库
      await initUserData(userId, '勇士')
      set({ userId, dataLoaded: true })
      return
    }

    // lanes → object
    const lanesObj = initLanes()
    ;(lanesData || []).forEach(l => {
      lanesObj[l.lane_id] = { id: l.lane_id, totalStars: l.total_stars, tier: l.tier, level: l.level, starsInDiv: l.stars_in_div }
    })

    // tags → proficiency
    const profObj = {}
    ;(tagsData || []).forEach(t => { profObj[`${t.lane_id}:${t.tag_name}`] = t.points })

    // tasks
    const tasksArr = (tasksData || []).map(t => ({
      id: t.id, title: t.title, desc: t.description,
      level: t.level, laneId: t.lane_id, difficulty: t.difficulty,
      parentId: t.parent_id, completed: t.completed,
      completedAt: t.completed_at, createdAt: t.created_at,
    }))

    // focus_blocks
    const focusArr = (focusData || []).map(f => ({
      id: f.id, laneId: f.lane_id, tag: f.tag, difficulty: f.difficulty,
      durationMin: f.duration_min, reward: f.reward, completed: f.completed,
      date: dayjs(f.created_at).format('YYYY-MM-DD HH:mm'),
    }))

    // policies
    const policiesArr = (policiesData || []).map(p => ({
      id: p.id, name: p.name, desc: p.description,
      checkedDates: p.checked_dates || [], createdAt: p.created_at,
    }))

    // transactions → ledger（全部） & transactions（仅消费，负数）
    const ledgerArr = (transData || []).map(t => ({
      id: t.id, desc: t.description, amount: t.amount,
      type: t.type, balance: t.balance_snapshot,
      date: dayjs(t.created_at).format('YYYY-MM-DD HH:mm'),
    }))
    const expensesArr = (transData || [])
      .filter(t => t.amount < 0 || t.type === '消费')
      .map(t => ({
        id: t.id, amount: Math.abs(t.amount),
        category: t.category || '其他', note: t.note,
        date: dayjs(t.created_at).format('YYYY-MM-DD HH:mm'), type: 'expense',
      }))

    const laneTags = userData.lane_tags || get().laneTags

    set({
      userId,
      username: userData.username || '勇士',
      balance: userData.balance || 0,
      focusSequence: userData.focus_sequence || 0,
      streakDays: userData.streak_days || 0,
      lastSignDate: userData.last_sign_date,
      lastMonthlyBonus: userData.last_monthly_bonus,
      todayStatus: userData.today_status,
      todayStatusDate: userData.today_status_date,
      languageConfig: userData.language_config || get().languageConfig,
      laneTags,
      lanes: lanesObj,
      proficiency: profObj,
      tasks: tasksArr,
      focusBlocks: focusArr,
      policies: policiesArr,
      ledger: ledgerArr,
      transactions: expensesArr,
      dataLoaded: true,
    })
  },

  // ═══════════════════════════════════════════════════════
  // 通知
  // ═══════════════════════════════════════════════════════
  addNotification: (msg) => set(s => ({
    notifications: [...s.notifications, { id: Date.now(), msg }]
  })),
  dismissNotification: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id)
  })),

  // ═══════════════════════════════════════════════════════
  // 今日状态
  // ═══════════════════════════════════════════════════════
  setTodayStatus: (status) => {
    const today = dayjs().format('YYYY-MM-DD')
    set({ todayStatus: status, todayStatusDate: today })
    const { userId } = get()
    if (userId) upsertUser(userId, { today_status: status, today_status_date: today })
  },

  // ═══════════════════════════════════════════════════════
  // 签到
  // ═══════════════════════════════════════════════════════
  doSignIn: () => {
    const today = dayjs().format('YYYY-MM-DD')
    const { lastSignDate, streakDays, userId } = get()
    if (lastSignDate === today) return null
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const newStreak = lastSignDate === yesterday ? streakDays + 1 : 1
    let reward = 5
    if (newStreak === 3)  reward += 10
    if (newStreak === 7)  reward += 30
    if (newStreak === 14) reward += 60
    if (newStreak === 30) reward += 150

    set(s => ({
      streakDays: newStreak, lastSignDate: today,
      balance: s.balance + reward,
      todayEarned: s.todayEarned + reward,
    }))
    const newBalance = get().balance
    if (userId) {
      upsertUser(userId, { streak_days: newStreak, last_sign_date: today, balance: newBalance })
      insertTransaction(userId, { desc: '签到奖励', amount: reward, type: '签到', balance: newBalance })
    }
    get().addLedger('签到奖励', reward, '签到')
    if (newStreak === 7) get().addNotification('连续7天签到！+30元 解锁专注加成🔥')
    return { streak: newStreak, reward }
  },

  // ═══════════════════════════════════════════════════════
  // 月初基础额度
  // ═══════════════════════════════════════════════════════
  checkMonthlyBonus: () => {
    const { lastMonthlyBonus, userId } = get()
    const thisMonth = dayjs().format('YYYY-MM')
    if (lastMonthlyBonus === thisMonth || dayjs().date() !== 1) return
    set(s => ({ balance: s.balance + 500, lastMonthlyBonus: thisMonth }))
    const newBalance = get().balance
    if (userId) {
      upsertUser(userId, { balance: newBalance, last_monthly_bonus: thisMonth })
      insertTransaction(userId, { desc: '月初基础额度', amount: 500, type: '系统', balance: newBalance })
    }
    get().addLedger('月初基础额度', 500, '系统')
    get().addNotification('月初 +500元 基础额度已到账！')
  },

  // ═══════════════════════════════════════════════════════
  // 账本记录（本地 state，主要写入已在各 action 里通过 insertTransaction 完成）
  // ═══════════════════════════════════════════════════════
  addLedger: (desc, amount, type) => {
    set(s => ({
      ledger: [{ id: Date.now(), desc, amount, type, balance: s.balance, date: dayjs().format('YYYY-MM-DD HH:mm') }, ...s.ledger].slice(0, 500)
    }))
  },

  // ═══════════════════════════════════════════════════════
  // 修改分路星数 + 段位升级检测
  // ═══════════════════════════════════════════════════════
  modifyLaneStars: (laneId, delta) => {
    set(s => {
      const lane = { ...s.lanes[laneId] }
      const oldTier = lane.tier
      const newTotal = Math.max(0, (lane.totalStars || 0) + delta)
      const { rank, starsInDiv } = getRankFromTotalStars(newTotal)

      // 段位提升奖励
      if (rank.tier !== oldTier && getTierOrder(rank.tier) > getTierOrder(oldTier)) {
        const promoKey = `${oldTier}->${rank.tier}`
        const reward = RANK_PROMOTION_REWARDS[promoKey] || (rank.tier === 'king' ? 30 : 0)
        if (reward > 0) {
          setTimeout(() => {
            const { userId } = get()
            set(ss => {
              const nb = ss.balance + reward
              if (userId) {
                upsertUser(userId, { balance: nb })
                insertTransaction(userId, { desc: `段位提升·${rank.name}`, amount: reward, type: '段位', balance: nb })
              }
              return { balance: nb, todayEarned: ss.todayEarned + reward }
            })
            get().addNotification(`🎉 段位提升至 ${rank.name}！+${reward}元`)
          }, 500)
        }
      }

      const newLaneData = { id: laneId, totalStars: newTotal, tier: rank.tier, level: rank.level, starsInDiv }
      const { userId } = get()
      if (userId) upsertLane(userId, laneId, { total_stars: newTotal, tier: rank.tier, level: rank.level, stars_in_div: starsInDiv })

      return { lanes: { ...s.lanes, [laneId]: newLaneData } }
    })
  },

  // ═══════════════════════════════════════════════════════
  // 完成专注块
  // ═══════════════════════════════════════════════════════
  completeFocusBlock: (laneId, tag, difficulty, durationMin = 60) => {
    const { todayStatus, userId } = get()
    let reward = calcFocusReward(laneId, difficulty)
    if (todayStatus === 'poor') reward = Math.round(reward * 1.3)

    // 更新熟练度
    const profKey = `${laneId}:${tag}`
    const newPoints = (get().proficiency[profKey] || 0) + 1
    if (userId) upsertTag(userId, laneId, tag, newPoints)

    set(s => {
      const newSeq = s.focusSequence + 1
      // 序列里程碑
      let seqBonus = 0
      if (newSeq === 5)  seqBonus = 10
      if (newSeq === 10) seqBonus = 25
      if (newSeq === 20) seqBonus = 60
      if (newSeq === 30) seqBonus = 100
      const totalReward = reward + seqBonus

      const block = { id: Date.now(), laneId, tag, difficulty, durationMin, reward, completed: true, date: dayjs().format('YYYY-MM-DD HH:mm') }

      if (seqBonus > 0) setTimeout(() => get().addNotification(`#序列里程碑 #${newSeq}！+${seqBonus}元`), 100)

      const newBalance = s.balance + totalReward
      if (userId) {
        insertFocusBlock(userId, { laneId, tag, difficulty, durationMin, reward, completed: true })
        upsertUser(userId, { balance: newBalance, focus_sequence: newSeq })
        insertTransaction(userId, { desc: `专注块·${LANES[laneId]?.name}·${tag}`, amount: totalReward, type: '专注块', balance: newBalance })
      }

      return {
        proficiency: { ...s.proficiency, [profKey]: newPoints },
        focusSequence: newSeq,
        balance: newBalance,
        todayEarned: s.todayEarned + totalReward,
        focusBlocks: [block, ...s.focusBlocks].slice(0, 1000),
      }
    })
    get().addLedger(`专注块·${LANES[laneId]?.name}·${tag}`, reward, '专注块')
  },

  // 放弃专注块
  abandonFocusBlock: (laneId, tag, difficulty) => {
    const { userId } = get()
    set({ focusSequence: 0 })
    if (userId) {
      upsertUser(userId, { focus_sequence: 0 })
      insertFocusBlock(userId, { laneId, tag, difficulty, durationMin: 0, reward: 0, completed: false })
    }
    get().modifyLaneStars(laneId, -1)
  },

  // ═══════════════════════════════════════════════════════
  // 任务
  // ═══════════════════════════════════════════════════════
  addTask: async (task) => {
    const { userId } = get()
    let newTask = { id: Date.now(), ...task, completed: false, createdAt: dayjs().format('YYYY-MM-DD HH:mm') }
    if (userId) {
      const row = await insertTask(userId, task) // 返回 Supabase UUID
      if (row) newTask = { ...newTask, id: row.id }
    }
    set(s => ({ tasks: [...s.tasks, newTask] }))
    return newTask
  },

  completeTask: (taskId) => {
    set(s => {
      const task = s.tasks.find(t => t.id === taskId)
      if (!task || task.completed) return {}
      const reward = calcTaskReward(task.laneId, task.level, task.difficulty || 'medium')
      const starGain = task.level === 'small' ? 1 : task.level === 'medium' ? 3 : 10
      const finalReward = s.todayStatus === 'poor' ? Math.round(reward * 1.3) : reward
      const newBalance = s.balance + finalReward

      const { userId } = get()
      if (userId) {
        updateTask(taskId, { completed: true, completed_at: new Date().toISOString() })
        if (finalReward > 0) {
          upsertUser(userId, { balance: newBalance })
          insertTransaction(userId, { desc: `完成${task.level === 'small'?'小':task.level==='medium'?'中':'大'}任务·${LANES[task.laneId]?.name}`, amount: finalReward, type: '任务', balance: newBalance })
        }
      }

      setTimeout(() => {
        get().modifyLaneStars(task.laneId, starGain)
        if (finalReward > 0) get().addNotification(`✅ 任务完成！+${finalReward}元 +${starGain}星`)
      }, 100)

      return {
        balance: newBalance,
        todayEarned: s.todayEarned + finalReward,
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed: true, completedAt: dayjs().format('YYYY-MM-DD HH:mm') } : t),
      }
    })
  },

  deleteTask: (taskId) => {
    const { userId } = get()
    if (userId) dbDeleteTask(taskId)
    set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) }))
  },

  // ═══════════════════════════════════════════════════════
  // 国策
  // ═══════════════════════════════════════════════════════
  addPolicy: async (policy) => {
    const { userId } = get()
    let newPolicy = { id: Date.now(), ...policy, checkedDates: [], createdAt: dayjs().format('YYYY-MM-DD') }
    if (userId) {
      const row = await insertPolicy(userId, policy)
      if (row) newPolicy = { ...newPolicy, id: row.id }
    }
    set(s => ({ policies: [...s.policies, newPolicy] }))
  },

  checkPolicy: (policyId) => {
    const today = dayjs().format('YYYY-MM-DD')
    const { userId } = get()
    set(s => {
      const policy = s.policies.find(p => p.id === policyId)
      if (!policy || policy.checkedDates?.includes(today)) return {}
      const checkedDates = [...(policy.checkedDates || []), today]
      if (userId) updatePolicyDates(policyId, checkedDates)
      const newBalance = s.balance + 3
      if (userId) {
        upsertUser(userId, { balance: newBalance })
        insertTransaction(userId, { desc: `国策打卡·${policy.name}`, amount: 3, type: '国策', balance: newBalance })
      }
      get().addLedger('国策打卡', 3, '国策')
      return {
        balance: newBalance,
        todayEarned: s.todayEarned + 3,
        policies: s.policies.map(p => p.id === policyId ? { ...p, checkedDates } : p),
      }
    })
    get().checkPolicyStreak()
  },

  checkPolicyStreak: () => {
    const { policies, userId } = get()
    if (!policies.length) return
    const last7 = Array.from({ length: 7 }, (_, i) => dayjs().subtract(i, 'day').format('YYYY-MM-DD'))
    const allLit = policies.every(p => last7.every(d => p.checkedDates?.includes(d)))
    if (allLit) {
      set(s => {
        const newBalance = s.balance + 30
        if (userId) {
          upsertUser(userId, { balance: newBalance })
          insertTransaction(userId, { desc: '国策连续7天全点亮', amount: 30, type: '国策', balance: newBalance })
        }
        return { balance: newBalance, todayEarned: s.todayEarned + 30 }
      })
      get().modifyLaneStars('life', 5)
      get().addNotification('🔥 国策连续7天全点亮！+30元 +5星')
    }
  },

  // ═══════════════════════════════════════════════════════
  // 消费
  // ═══════════════════════════════════════════════════════
  addExpense: (amount, category, note) => {
    const { userId } = get()
    const expense = { id: Date.now(), amount, category, note, date: dayjs().format('YYYY-MM-DD HH:mm'), type: 'expense' }
    set(s => {
      const newBalance = s.balance - amount
      if (userId) {
        upsertUser(userId, { balance: newBalance })
        insertTransaction(userId, { desc: `消费·${category}${note?'·'+note:''}`, amount: -amount, type: '消费', balance: newBalance, category, note })
      }
      return {
        balance: newBalance,
        transactions: [expense, ...s.transactions].slice(0, 1000),
        ledger: [{ id: Date.now()+1, desc: `消费·${category}`, amount: -amount, type: '消费', balance: newBalance, date: dayjs().format('YYYY-MM-DD HH:mm') }, ...s.ledger].slice(0, 500),
      }
    })
  },

  // ═══════════════════════════════════════════════════════
  // 标签管理
  // ═══════════════════════════════════════════════════════
  addLaneTag: (laneId, tag) => {
    const { userId } = get()
    set(s => {
      const existing = s.laneTags[laneId] || []
      if (existing.includes(tag)) return {}
      const newTags = [...existing, tag]
      const newLaneTags = { ...s.laneTags, [laneId]: newTags }
      if (userId) {
        upsertUser(userId, { lane_tags: newLaneTags })
        upsertTag(userId, laneId, tag, 0)
      }
      return { laneTags: newLaneTags, proficiency: { ...s.proficiency, [`${laneId}:${tag}`]: s.proficiency[`${laneId}:${tag}`] ?? 0 } }
    })
  },

  removeLaneTag: (laneId, tag) => {
    const { userId } = get()
    set(s => {
      const newLaneTags = { ...s.laneTags, [laneId]: (s.laneTags[laneId] || []).filter(t => t !== tag) }
      if (userId) upsertUser(userId, { lane_tags: newLaneTags })
      return { laneTags: newLaneTags }
    })
  },

  addLanguage: (lang) => {
    const { userId } = get()
    set(s => {
      if (s.languageConfig.languages.includes(lang)) return {}
      const newLangs = [...s.languageConfig.languages, lang]
      const newConfig = { ...s.languageConfig, languages: newLangs }
      const newTags = getLanguageTags(newLangs)
      const newProf = { ...s.proficiency }
      newTags.forEach(t => { if (!(`language:${t}` in newProf)) newProf[`language:${t}`] = 0 })
      if (userId) {
        upsertUser(userId, { language_config: newConfig })
        getLanguageTags([lang]).forEach(t => upsertTag(userId, 'language', t, 0))
      }
      return { languageConfig: newConfig, proficiency: newProf }
    })
  },

  removeLanguage: (lang) => {
    const { userId } = get()
    set(s => {
      if (s.languageConfig.languages.length <= 1) return {}
      const newLangs = s.languageConfig.languages.filter(l => l !== lang)
      const newConfig = { ...s.languageConfig, languages: newLangs }
      if (userId) upsertUser(userId, { language_config: newConfig })
      return { languageConfig: newConfig }
    })
  },

  deduplicateTags: () => {
    set(s => {
      const newLaneTags = {}
      Object.entries(s.laneTags).forEach(([id, tags]) => { newLaneTags[id] = [...new Set(tags)] })
      return { laneTags: newLaneTags }
    })
  },

  getLaneTags: (laneId) => {
    const s = get()
    if (laneId === 'language') return getLanguageTags(s.languageConfig.languages, s.languageConfig.abilities)
    return s.laneTags[laneId] || LANES[laneId]?.tags || []
  },

  // ═══════════════════════════════════════════════════════
  // 登出：重置所有本地状态
  // ═══════════════════════════════════════════════════════
  resetStore: () => set({
    userId: null, dataLoaded: false, balance: 0, todayEarned: 0,
    focusSequence: 0, streakDays: 0, lastSignDate: null, lastMonthlyBonus: null,
    todayStatus: null, todayStatusDate: null,
    lanes: initLanes(), proficiency: initProficiency(),
    languageConfig: { languages: ['英语'], abilities: ['听力','阅读','写作','口语'] },
    laneTags: { research: ['论文写作','文献阅读','数据处理','实地调研','理论框架','学术汇报'], study: ['AI开发'], fitness: [], work: [] },
    tasks: [], focusBlocks: [], policies: [], ledger: [], transactions: [], notifications: [],
  }),
}))

export default useStore
