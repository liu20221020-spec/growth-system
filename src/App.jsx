import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import NotificationToast from './components/ui/NotificationToast'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Focus from './pages/Focus'
import Policies from './pages/Policies'
import Expenses from './pages/Expenses'
import Summary from './pages/Summary'
import LaneDetail from './pages/LaneDetail'

export default function App() {
  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      <NotificationToast />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/lane/:id" element={<LaneDetail />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
