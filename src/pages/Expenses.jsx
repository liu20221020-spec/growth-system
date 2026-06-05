import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import useStore from '../store/useStore'
import dayjs from 'dayjs'

const CATEGORIES = ['餐饮', '购物', '交通', '娱乐', '其他']
const CAT_ICONS = { '餐饮': '🍜', '购物': '🛍️', '交通': '🚇', '娱乐': '🎮', '其他': '📦' }

export default function Expenses() {
  const { balance, ledger, transactions, addExpense } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('ledger') // ledger | expense

  const currentMonth = dayjs().format('YYYY-MM')
  const monthLedger = ledger.filter(l => l.date?.startsWith(currentMonth))
  const monthExpenses = transactions.filter(t => t.date?.startsWith(currentMonth))

  const totalIn = monthLedger.filter(l => l.amount > 0).reduce((s, l) => s + l.amount, 0)
  const totalOut = monthExpenses.reduce((s, t) => s + t.amount, 0)

  const catStats = CATEGORIES.map(cat => ({
    cat,
    amount: monthExpenses.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.amount > 0)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'radial-gradient(ellipse at top, #0d1526 0%, #0a0e1a 60%)' }}>
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black">收支</h1>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #3a1a2c, #1d0d18)', border: '1px solid rgba(255,71,87,0.4)' }}>
            <Plus size={16} /> 记录消费
          </button>
        </div>

        {/* 余额卡片 */}
        <div className="card-bg rounded-2xl p-5 mb-4" style={{ border: balance < 0 ? '1px solid rgba(255,71,87,0.3)' : '1px solid rgba(245,197,24,0.2)' }}>
          <div className="text-xs text-gray-400 mb-1">当前余额</div>
          <div className={`text-4xl font-black ${balance < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
            {balance < 0 ? '-' : ''}¥{Math.abs(balance).toFixed(2)}
          </div>
          {balance < 0 && <div className="text-xs text-red-400 mt-1">⚠️ 已透支，下次收入优先偿还</div>}
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp size={14} />
              本月收入 ¥{totalIn.toFixed(0)}
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown size={14} />
              本月支出 ¥{totalOut.toFixed(0)}
            </div>
          </div>
        </div>

        {/* 支出分类 */}
        {catStats.length > 0 && (
          <div className="card-bg rounded-2xl p-4 mb-4">
            <div className="text-sm font-bold mb-3 text-gray-300">本月支出分类</div>
            <div className="space-y-2">
              {catStats.sort((a, b) => b.amount - a.amount).map(c => (
                <div key={c.cat} className="flex items-center gap-3">
                  <span className="text-lg w-7">{CAT_ICONS[c.cat]}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{c.cat}</span>
                      <span className="text-red-400">-¥{c.amount.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500/60 rounded-full progress-bar"
                        style={{ width: `${(c.amount / totalOut) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 标签切换 */}
        <div className="flex gap-2 mb-4">
          {[['ledger', '收支明细'], ['expense', '消费记录']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === k ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* 明细列表 */}
        <div className="space-y-2">
          {tab === 'ledger' ? (
            monthLedger.length > 0 ? monthLedger.map(l => (
              <div key={l.id} className="card-bg rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{l.desc}</div>
                  <div className="text-xs text-gray-500">{l.date}</div>
                </div>
                <div className={`font-bold text-sm ${l.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {l.amount >= 0 ? '+' : ''}{l.amount.toFixed(1)}元
                </div>
              </div>
            )) : <EmptyState text="本月暂无收支记录" />
          ) : (
            monthExpenses.length > 0 ? monthExpenses.map(t => (
              <div key={t.id} className="card-bg rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CAT_ICONS[t.category]}</span>
                  <div>
                    <div className="text-sm font-medium">{t.note || t.category}</div>
                    <div className="text-xs text-gray-500">{t.date}</div>
                  </div>
                </div>
                <div className="text-red-400 font-bold text-sm">-¥{t.amount.toFixed(2)}</div>
              </div>
            )) : <EmptyState text="本月暂无消费记录" />
          )}
        </div>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="text-center text-gray-500 text-sm py-8">{text}</div>
}

function AddExpenseModal({ onClose }) {
  const { addExpense } = useStore()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('餐饮')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    addExpense(val, category, note)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg card-bg rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-black">记录消费</h2>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">¥</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-lg font-bold outline-none focus:border-red-500/50"
            inputMode="decimal" />
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">分类</div>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`py-2 rounded-xl text-center transition-all border ${category === cat ? 'border-red-500/50 bg-red-500/15' : 'border-white/10 bg-white/5'}`}>
                <div className="text-xl">{CAT_ICONS[cat]}</div>
                <div className="text-xs mt-1">{cat}</div>
              </button>
            ))}
          </div>
        </div>

        <input value={note} onChange={e => setNote(e.target.value)} placeholder="备注（可选）"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500/50" />

        <button onClick={handleSubmit} disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 rounded-xl font-bold text-base disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #3a1a2c, #1d0d18)', border: '1px solid rgba(255,71,87,0.4)' }}>
          确认记录
        </button>
      </div>
    </div>
  )
}
