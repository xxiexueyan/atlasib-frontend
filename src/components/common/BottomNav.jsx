import {
  BookMarked,
  CalendarDays,
  GraduationCap,
  SlidersHorizontal,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { usePlan } from '../../context/PlanContext.jsx'

const tabs = [
  { id: 'wizard', label: '智能向导', Icon: Sparkles },
  { id: 'programs', label: '大学专业', Icon: GraduationCap },
  { id: 'harmonizer', label: '调和排课', Icon: SlidersHorizontal },
  { id: 'wiki', label: '科普与签证', Icon: BookMarked },
  { id: 'extra', label: '竞赛/CAS', Icon: Trophy },
  { id: 'timeline', label: '时间规划', Icon: CalendarDays },
]

export default function BottomNav({ conflicts = [] }) {
  const { activeTab, setActiveTab } = usePlan()
  const hasConflicts = Array.isArray(conflicts)
    ? conflicts.length > 0
    : Boolean(conflicts)

  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-slate-800 bg-slate-950/95 px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-lg"
    >
      <div className="grid grid-cols-6 gap-0.5">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id

          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1 text-[9px] transition active:scale-95 ${
                isActive
                  ? 'bg-cyan-500/10 font-bold text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {id === 'harmonizer' && hasConflicts && (
                <span
                  aria-label="存在排课冲突"
                  className="absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-red-500"
                />
              )}
              <Icon className="mb-0.5 h-3.5 w-3.5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
