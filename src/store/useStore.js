import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { LANES, LANE_ORDER, getRankFromTotalStars, calcFocusReward, calcTaskReward, RANK_PROMOTION_REWARDS, getTierOrder, getLanguageTags } from '../lib/gameLogic'
import dayjs from 'dayjs'

// 初始分路数据
const initLanes = () => {
  const lanes = {}
  LANE_ORDER.forEach(id => {
    lanes[id] = {
      id,
      totalStars: 0,
      tier: 'bronze',
      level: 3,
      starsInDiv: 0,
    }
  })
  return lanes
}

// 初始标签熟练度
const initProficiency = () => {
  const p = {}
  // research
  ;['论文写作', '文献阅读', '数据处理', '实地调研', '理论框架', '学术汇报'].forEach(t => { p[`research:${t}`] = 0 })
  // study
  ;['AI开发'].forEach(t => { p[`study:${t}`] = 0 })
  // language - 默认英语×4能力
  getLanguageTags(['英语']).forEach(t => { p[`language:${t}`] = 0 })
  return p
}

const useStore = create(
  persist(
    (set, get) => ({
      // ============ 用户配置 ============
      supabaseUrl: '',
      supabaseKey: '',
      username: '勇士',

      // ============ 核心数据 ============
      balance: 0,         // 当前额度余额
      todayEarned: 0,     // 今日赚取
      focusSequence: 0,   // #序列
      streakDays: 0,      // 连续签到天数
      lastSignDate: null, // 上次签到日期

      // 分路数据
      lanes: initLanes(),

      // 熟练度数据
      proficiency: initProficiency(),

      // 语言分路配置
      languageConfig: {
        languages: ['英语'],
        abilities: ['听力', '阅读', '写作', '口语'],
      },

      // 分路自定义标签
      laneTags: {
        research: ['论文写作', '文献阅读', '数据处理', '实地调研', '理论框架', '学术汇报'],
        study: ['AI开发'],
        fitness: [],
        work: [],
      },

      // 任务列表
      tasks: [],

      // 专注块记录
      focusBlocks: [],

      // 国策
      policies: [],
      policyGroups: [],

      // 每日记录
      dailyLogs: [],

      // 今日状态
      todayStatus: null, // 'good' | 'normal' | 'poor'
      todayStatusDate: null,

      // 消费记录
      transactions: [],

      // 额度收支记录
      ledger: [],

      // 通知/弹出消息
      notifications: [],

      // 月初是否已导入基础额度
      lastMonthlyBonus: null,

      // ============ Actions ============

      setConfig: (url, key) => set({ supabaseUrl: url, supabaseKey: key }),
      setUsername: (name) => set({ username: name }),

      // 添加通知
      addNotification: (msg) => set(s => ({
        notifications: [...s.notifications, { id: Date.now(), msg, time: Date.now() }]
      })),
      dismissNotification: (id) => set(s => ({
        notifications: s.notifications.filter(n => n.id !== id)
      })),

      // 设置今日状态
      setTodayStatus: (status) => set({ todayStatus: status, todayStatusDate: dayjs().format('YYYY-MM-DD') }),

      // 签到
      doSignIn: () => {
        const today = dayjs().format('YYYY-MM-DD')
        const { lastSignDate, streakDays } = get()
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
        let newStreak = 1
        if (lastSignDate === yesterday) {
          newStreak = streakDays + 1
        } else if (lastSignDate === today) {
          return // 已签到
        }

        let reward = 5 // 基础签到奖励
        let bonusMsg = ''

        // 里程碑奖励
        if (newStreak === 3) { reward += 10; bonusMsg = '连续3天！+10元' }
        else if (newStreak === 7) { reward += 30; bonusMsg = '连续7天！+30元 解锁专注加成' }
        else if (newStreak === 14) { reward += 60; bonusMsg = '连续14天！+60元 解锁双倍周末' }
        else if (newStreak === 30) { reward += 150; bonusMsg = '连续30天！+150元' }

        set(s => ({
          streakDays: newStreak,
          lastSignDate: today,
          balance: s.balance + reward,
          todayEarned: s.todayEarned + reward,
        }))
        get().addLedger('签到奖励', reward, '签到')
        if (bonusMsg) get().addNotification(bonusMsg)
        return { streak: newStreak, reward }
      },

      // 月初基础额度
      checkMonthlyBonus: () => {
        const today = dayjs().format('YYYY-MM')
        const { lastMonthlyBonus } = get()
        if (lastMonthlyBonus !== today && dayjs().date() === 1) {
          set(s => ({ balance: s.balance + 500, lastMonthlyBonus: today }))
          get().addLedger('月初基础额度', 500, '系统')
          get().addNotification('月初基础额度 +500元 已到账！')
        }
      },

      // 记录收支
      addLedger: (desc, amount, type) => {
        const { balance } = get()
        set(s => ({
          ledger: [{
            id: Date.now(),
            desc,
            amount,
            type,
            balance: s.balance,
            date: dayjs().format('YYYY-MM-DD HH:mm'),
          }, ...s.ledger].slice(0, 500)
        }))
      },

      // 完成专注块
      completeFocusBlock: (laneId, tag, difficulty, durationMin = 60) => {
        const { todayStatus } = get()
        let reward = calcFocusReward(laneId, difficulty)
        if (todayStatus === 'poor') reward = Math.round(reward * 1.3)

        // 更新熟练度
        const profKey = `${laneId}:${tag}`
        set(s => {
          const newProf = { ...s.proficiency, [profKey]: (s.proficiency[profKey] || 0) + 1 }
          const newSeq = s.focusSequence + 1
          let seqBonus = 0
          if (newSeq === 5) seqBonus = 10
          else if (newSeq === 10) seqBonus = 25
          else if (newSeq === 20) seqBonus = 60
          else if (newSeq === 30) seqBonus = 100

          const block = {
            id: Date.now(),
            laneId, tag, difficulty, durationMin,
            reward, completed: true,
            date: dayjs().format('YYYY-MM-DD HH:mm'),
          }

          if (seqBonus > 0) {
            setTimeout(() => get().addNotification(`#序列里程碑 #${newSeq}！+${seqBonus}元`), 100)
          }

          return {
            proficiency: newProf,
            focusSequence: newSeq,
            balance: s.balance + reward + seqBonus,
            todayEarned: s.todayEarned + reward + seqBonus,
            focusBlocks: [block, ...s.focusBlocks].slice(0, 1000),
          }
        })
        get().addLedger(`专注块·${LANES[laneId]?.name}·${tag}`, reward, '专注块')
      },

      // 放弃专注块
      abandonFocusBlock: (laneId, tag, difficulty) => {
        set(s => ({ focusSequence: 0 }))
        // -1星
        get().modifyLaneStars(laneId, -1)
        const block = {
          id: Date.now(),
          laneId, tag, difficulty,
          reward: 0, completed: false,
          date: dayjs().format('YYYY-MM-DD HH:mm'),
        }
        set(s => ({ focusBlocks: [block, ...s.focusBlocks].slice(0, 1000) }))
      },

      // 修改分路星数（触发段位变化检查）
      modifyLaneStars: (laneId, delta) => {
        set(s => {
          const lane = { ...s.lanes[laneId] }
          const oldTier = lane.tier
          const newTotal = Math.max(0, lane.totalStars + delta)
          const { rank, starsInDiv } = getRankFromTotalStars(newTotal)

          // 检测段位提升
          if (rank.tier !== oldTier && getTierOrder(rank.tier) > getTierOrder(oldTier)) {
            const promoKey = `${oldTier}->${rank.tier}`
            const promoReward = RANK_PROMOTION_REWARDS[promoKey] || (rank.tier === 'king' ? 30 : 0)
            if (promoReward > 0) {
              setTimeout(() => {
                set(ss => ({ balance: ss.balance + promoReward, todayEarned: ss.todayEarned + promoReward }))
                get().addLedger(`段位提升·${rank.name}`, promoReward, '段位')
                get().addNotification(`🎉 段位提升至 ${rank.name}！+${promoReward}元`)
              }, 500)
            }
          }

          return {
            lanes: {
              ...s.lanes,
              [laneId]: {
                ...lane,
                totalStars: newTotal,
                tier: rank.tier,
                level: rank.level,
                starsInDiv,
              }
            }
          }
        })
      },

      // 完成任务
      completeTask: (taskId) => {
        set(s => {
          const task = s.tasks.find(t => t.id === taskId)
          if (!task || task.completed) return {}
          const level = task.level // 'small' | 'medium' | 'large'
          const reward = calcTaskReward(task.laneId, level, task.difficulty || 'medium')
          const starGain = level === 'small' ? 1 : level === 'medium' ? 3 : 10

          const { todayStatus } = s
          const finalReward = todayStatus === 'poor' ? Math.round(reward * 1.3) : reward

          setTimeout(() => {
            if (finalReward > 0) {
              get().addLedger(`完成${level === 'small' ? '小' : level === 'medium' ? '中' : '大'}任务·${LANES[task.laneId]?.name}`, finalReward, '任务')
              get().addNotification(`✅ 任务完成！+${finalReward}元 +${starGain}星`)
            }
            get().modifyLaneStars(task.laneId, starGain)
          }, 100)

          return {
            balance: s.balance + finalReward,
            todayEarned: s.todayEarned + finalReward,
            tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed: true, completedAt: dayjs().format('YYYY-MM-DD HH:mm') } : t),
          }
        })
      },

      // 新增任务
      addTask: (task) => {
        const newTask = {
          id: Date.now(),
          ...task,
          completed: false,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
        }
        set(s => ({ tasks: [...s.tasks, newTask] }))
        return newTask
      },

      deleteTask: (taskId) => set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) })),

      // 国策打卡
      checkPolicy: (policyId) => {
        const today = dayjs().format('YYYY-MM-DD')
        set(s => ({
          policies: s.policies.map(p => {
            if (p.id !== policyId) return p
            const alreadyChecked = p.checkedDates?.includes(today)
            if (alreadyChecked) return p
            const checkedDates = [...(p.checkedDates || []), today]
            return { ...p, checkedDates }
          })
        }))
        // +3元
        set(s => ({ balance: s.balance + 3, todayEarned: s.todayEarned + 3 }))
        get().addLedger('国策打卡', 3, '国策')
        get().checkPolicyStreak()
      },

      // 检查国策连续7天
      checkPolicyStreak: () => {
        const { policies } = get()
        const today = dayjs()
        const last7 = Array.from({ length: 7 }, (_, i) => today.subtract(i, 'day').format('YYYY-MM-DD'))
        const allLit = policies.every(p => last7.every(d => p.checkedDates?.includes(d)))
        if (allLit && policies.length > 0) {
          // 检查是否已发过奖励
          const bonusKey = `policy_streak_${today.format('YYYY-WW')}`
          // 简单处理，不重复发
          set(s => ({ balance: s.balance + 30, todayEarned: s.todayEarned + 30 }))
          get().addLedger('国策连续7天全点亮', 30, '国策')
          get().addNotification('🔥 国策连续7天全点亮！+30元 +5星')
          get().modifyLaneStars('life', 5)
        }
      },

      // 结算理想生活分路星数（每天）
      settleLifeLaneStars: () => {
        const { policies } = get()
        const today = dayjs().format('YYYY-MM-DD')
        if (!policies.length) return
        const litCount = policies.filter(p => p.checkedDates?.includes(today)).length
        const litRate = litCount / policies.length
        const delta = litRate >= 1.0 ? 2 : litRate >= 0.8 ? 1 : litRate >= 0.5 ? 0 : -1
        if (delta !== 0) get().modifyLaneStars('life', delta)
      },

      // 添加国策
      addPolicy: (policy) => {
        const newPolicy = {
          id: Date.now(),
          checkedDates: [],
          createdAt: dayjs().format('YYYY-MM-DD'),
          ...policy,
        }
        set(s => ({ policies: [...s.policies, newPolicy] }))
      },

      // 消费记录
      addExpense: (amount, category, note) => {
        const expense = {
          id: Date.now(),
          amount, category, note,
          date: dayjs().format('YYYY-MM-DD HH:mm'),
          type: 'expense',
        }
        set(s => ({
          balance: s.balance - amount,
          transactions: [expense, ...s.transactions].slice(0, 1000),
        }))
        get().addLedger(`消费·${category}${note ? '·' + note : ''}`, -amount, '消费')
      },

      // 添加语言标签
      addLanguage: (lang) => {
        set(s => {
          const newLangs = [...s.languageConfig.languages, lang]
          const newTags = getLanguageTags(newLangs)
          const newProf = { ...s.proficiency }
          newTags.forEach(t => {
            const k = `language:${t}`
            if (!(k in newProf)) newProf[k] = 0
          })
          return {
            languageConfig: { ...s.languageConfig, languages: newLangs },
            proficiency: newProf,
          }
        })
      },

      // 添加分路自定义标签
      addLaneTag: (laneId, tag) => {
        set(s => {
          const tags = [...(s.laneTags[laneId] || []), tag]
          const profKey = `${laneId}:${tag}`
          return {
            laneTags: { ...s.laneTags, [laneId]: tags },
            proficiency: { ...s.proficiency, [profKey]: 0 },
          }
        })
      },

      // 重置今日赚取（每天凌晨）
      resetDailyEarned: () => {
        const today = dayjs().format('YYYY-MM-DD')
        set({ todayEarned: 0 })
      },

      // 获取分路标签列表
      getLaneTags: (laneId) => {
        const s = get()
        if (laneId === 'language') {
          return getLanguageTags(s.languageConfig.languages, s.languageConfig.abilities)
        }
        return s.laneTags[laneId] || LANES[laneId]?.tags || []
      },
    }),
    {
      name: 'growth-system-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useStore
