import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { calculateHarmonizedPlan } from './api/harmonizer.js'
import { getExplicitLanguagePayload, getLanguagePayload } from './api/language.js'
import BottomNav from './components/common/BottomNav.jsx'
import GlossaryModal from './components/common/GlossaryModal.jsx'
import Header from './components/common/Header.jsx'
import { usePlan } from './context/PlanContext.jsx'
import ExtraView from './views/ExtraView.jsx'
import HarmonizerView from './views/HarmonizerView.jsx'
import ProgramsView from './views/ProgramsView.jsx'
import TimelineView from './views/TimelineView.jsx'
import WikiView from './views/WikiView.jsx'
import WizardView from './views/WizardView.jsx'

const views = {
  wizard: WizardView,
  programs: ProgramsView,
  harmonizer: HarmonizerView,
  wiki: WikiView,
  extra: ExtraView,
  timeline: TimelineView,
}

export default function App() {
  const {
    activeTab,
    selectedProgramIds,
    currentProfileId,
    wizardAnswers,
    persistenceError,
    clearPersistenceError,
    retryProgramSync,
    isSyncingPrograms,
    isLoadingSavedPrograms,
  } = usePlan()
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [glossaryTerm, setGlossaryTerm] = useState('ib')
  const CurrentView = views[activeTab] ?? WizardView
  const languagePayload = getLanguagePayload(wizardAnswers)
  const hasExplicitLanguages = Boolean(
    getExplicitLanguagePayload(wizardAnswers),
  )

  const harmonizerQuery = useQuery({
    queryKey: [
      'harmonized-plan',
      selectedProgramIds,
      currentProfileId,
      languagePayload,
    ],
    queryFn: () =>
      calculateHarmonizedPlan(selectedProgramIds, {
        profileId: currentProfileId,
        answers: wizardAnswers,
      }),
    enabled:
      activeTab === 'harmonizer' &&
      selectedProgramIds.length > 0 &&
      (Boolean(currentProfileId) || hasExplicitLanguages),
  })

  function openGlossary(term = 'ib') {
    setGlossaryTerm(term)
    setGlossaryOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-slate-800 bg-slate-950 shadow-2xl">
        <Header onOpenGlossary={openGlossary} />
        <main className="flex-1 px-4 py-4">
          {isLoadingSavedPrograms && (
            <p className="mb-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
              正在恢复云端画像与志愿…
            </p>
          )}
          {persistenceError && (
            <div
              role="alert"
              className="mb-3 rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-100"
            >
              <p>{persistenceError}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={retryProgramSync}
                  disabled={isSyncingPrograms || isLoadingSavedPrograms || !currentProfileId}
                  className="rounded-lg border border-amber-700 px-2.5 py-1 font-semibold transition hover:bg-amber-900/50 disabled:opacity-50"
                >
                  {isSyncingPrograms ? '同步中…' : '重试志愿同步'}
                </button>
                <button
                  type="button"
                  onClick={clearPersistenceError}
                  className="rounded-lg px-2.5 py-1 text-amber-200 transition hover:bg-amber-900/40"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
          <CurrentView />
        </main>
        <BottomNav conflicts={harmonizerQuery.data?.conflicts ?? []} />
        <GlossaryModal
          isOpen={glossaryOpen}
          initialTerm={glossaryTerm}
          onClose={() => setGlossaryOpen(false)}
        />
      </div>
    </div>
  )
}
