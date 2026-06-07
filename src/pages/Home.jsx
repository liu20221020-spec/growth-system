import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Hash, TrendingUp, Plus } from 'lucide-react'
import useStore from '../store/useStore'
import { LANES, LANE_ORDER } from '../lib/gameLogic'
import LaneCard from '../components/lanes/LaneCard'
import HexRadar from '../components/lanes/HexRadar'
import RankBadge from '../components/ui/RankBadge'
import dayjs from 'dayjs'

export default function Home() {
  const navigate = useNavigate()
  const {
    balance, todayEarned, focusSequence, streakDays,
    lanes, policies, tasks, username,
    todayStatus, todayStatusDate, setTodayStatus,
    doSignIn, lastSignDate, checkMonthlyBonus,
  } = useStore()

  const today = dayjs().format('YYYY-MM-DD')
  const hasSignedIn = lastSignDate === today
  const hasSetStatus = todayStatusDate === today

  // 月初基础额度检查
  useEffect(() => {
    checkMonthlyBonus()
  }, [])

  const [showStatusModal, setShowStatusModal] = useState(!hasSetStatus)
  const [showSignInBanner, setShowSignInBanner] = useState(!hasSignedIn)

  const todayPolicies = policies.filter(p => !p.checkedDates?.includes(today))
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 3)

  const handleSignIn = () => {
    const result = doSignIn()
    setShowSignInBanner(false)
  }

  const handleStatus = (status) => {
    setTodayStatus(status)
    setShowStatusModal(false)
    if (!hasSignedIn) handleSignIn()
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      {/* 状态询问弹窗 */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="card-bg rounded-2xl p-6 w-full max-w-sm border border-blue-500/20" style={{ boxShadow: '0 0 40px rgba(79,158,255,0.15)' }}>
            <h2 className="text-xl font-black text-center mb-2">今日状态如何？</h2>
            <p className="text-gray-400 text-sm text-center mb-6">状态影响今日额度系数</p>
            <div className="space-y-3">
              {[
                { key: 'good', emoji: '⚡', label: '状态很好', desc: '可挑战困难任务', color: 'border-green-500/40 hover:border-green-400/60' },
                { key: 'normal', emoji: '😊', label: '状态一般', desc: '正常系数', color: 'border-blue-500/40 hover:border-blue-400/60' },
                { key: 'poor', emoji: '😴', label: '状态很差', desc: '全部额度×1.3，建议选简单', color: 'border-orange-500/40 hover:border-orange-400/60' },
              ].map(s => (
                <button key={s.key} onClick={() => handleStatus(s.key)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border bg-white/5 hover:bg-white/10 transition-all ${s.color}`}>
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="text-left">
                    <div className="font-bold">{s.label}</div>
                    <div className="text-xs text-gray-400">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 顶部区域 */}
      <div className="px-4 pt-12 pb-4">

        {/* 日期栏 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-gray-500">{dayjs().format('YYYY年MM月DD日')}</div>
            <div className="text-sm font-bold text-gray-300 mt-0.5">
              {['周日','周一','周二','周三','周四','周五','周六'][dayjs().day()]}
              {todayStatus && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: todayStatus === 'good' ? 'rgba(0,200,83,0.15)' : todayStatus === 'poor' ? 'rgba(255,107,53,0.15)' : 'rgba(79,158,255,0.15)',
                    color:      todayStatus === 'good' ? '#00c853'              : todayStatus === 'poor' ? '#ff6b35'              : '#4f9eff',
                    border:     `1px solid ${todayStatus === 'good' ? 'rgba(0,200,83,0.3)' : todayStatus === 'poor' ? 'rgba(255,107,53,0.3)' : 'rgba(79,158,255,0.3)'}`,
                  }}>
                  {todayStatus === 'good' ? '⚡ 状态很好' : todayStatus === 'poor' ? '😴 状态很差' : '😊 状态一般'}
                </span>
              )}
            </div>
          </div>
          {/* 第几天 · 赛季进度 */}
          <div className="text-right">
            <div className="text-xs text-gray-600">
              {dayjs().format('YYYY')}赛季
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              第 {Math.ceil((dayjs().diff(dayjs().startOf('year'), 'day') + 1) / 7)} 周
            </div>
          </div>
        </div>

        {/* 签到提示 */}
        {showSignInBanner && !showStatusModal && (
          <div onClick={handleSignIn}
            className="mb-4 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-xl">☀️</span>
              <span className="text-sm font-bold text-yellow-300">点击签到领 +5元</span>
            </div>
            <span className="text-xs text-gray-400">连续{streakDays}天</span>
          </div>
        )}

        {/* 额度大字 */}
        <div className="text-center mb-6">
          <div className="text-xs text-gray-500 mb-1">当前额度余额</div>
          <div className={`text-5xl font-black ${balance < 0 ? 'text-red-400' : 'text-white'}`}
            style={balance >= 0 ? { textShadow: '0 0 30px rgba(245,197,24,0.3)' } : {}}>
            <span className="text-2xl font-bold" style={{ color: balance < 0 ? '#ff4757' : '#f5c518' }}>¥</span>
            {Math.abs(balance).toFixed(0)}
            {balance < 0 && <span className="text-lg text-red-400 ml-1">（透支）</span>}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} className="text-green-400" />
              今日+{todayEarned.toFixed(0)}元
            </span>
            <span className="flex items-center gap-1">
              <Hash size={12} className="text-blue-400" />
              序列#{focusSequence}
            </span>
            <span className="flex items-center gap-1">
              <Flame size={12} className="text-orange-400" />
              连续{streakDays}天
            </span>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="flex justify-center mb-4">
          <div className="w-40 h-40">
            <HexRadar lanesData={lanes} />
          </div>
        </div>
      </div>

      {/* 分路卡片 */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-300">六条分路</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LANE_ORDER.map(id => (
            <LaneCard key={id} lane={LANES[id]} data={lanes[id] || {}} tasks={tasks} />
          ))}
        </div>
      </div>

      {/* 今日国策 */}
      {todayPolicies.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-300">今日国策</h2>
            <button onClick={() => navigate('/policies')} className="text-xs text-blue-400">全部 →</button>
          </div>
          <div className="card-bg rounded-xl p-3 space-y-2">
            {todayPolicies.slice(0, 3).map(p => (
              <div key={p.id} onClick={() => navigate('/policies')} className="flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                </div>
                <span className="text-sm text-gray-300">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 进行中任务 */}
      {activeTasks.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-300">进行中任务</h2>
            <button onClick={() => navigate('/tasks')} className="text-xs text-blue-400">全部 →</button>
          </div>
          <div className="space-y-2">
            {activeTasks.map(t => (
              <div key={t.id} className="card-bg rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">{LANES[t.laneId]?.icon || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-gray-500">{LANES[t.laneId]?.name} · {t.level === 'small' ? '小任务' : t.level === 'medium' ? '中任务' : '大任务'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速开始专注 */}
      <div className="px-4">
        <button onClick={() => navigate('/focus')}
          className="w-full py-4 rounded-2xl font-black text-lg relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a3a6c, #0d2448)', border: '1px solid rgba(79,158,255,0.3)', boxShadow: '0 0 20px rgba(79,158,255,0.15)' }}>
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Zap size={20} className="text-yellow-400" fill="currentColor" />
            开始专注
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </button>
      </div>
    </div>
  )
}

function Zap({ size, className, fill }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth="2" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
