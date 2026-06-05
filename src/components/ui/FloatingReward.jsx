import { useEffect, useState } from 'react'

export default function FloatingReward({ amount, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.() }, 1500)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
      <div className="float-up text-3xl font-black text-yellow-400 drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(245,197,24,0.8)' }}>
        +{amount}元
      </div>
    </div>
  )
}
