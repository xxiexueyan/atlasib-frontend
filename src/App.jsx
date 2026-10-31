import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomNav from './components/common/BottomNav.jsx'
import RestoreConflictModal from './components/common/RestoreConflictModal.jsx'
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
  const { t, i18n } = useTranslation()
  const {
    activeTab,
    currentProfileId,
    persistenceError,
    clearPersistenceError,
    retryProgramSync,
    isSyncingPrograms,
    isLoadingSavedPrograms,
    isSessionLoading,
    sessionRestoreError,
    restoreSession,
    restoreStatus,
    dismissRestoreStatus,
    conflictCandidate,
    dismissConflict,
    resolveRestoreConflict,
  } = usePlan()
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [glossaryTerm, setGlossaryTerm] = useState('ib')
  const CurrentView = views[activeTab] ?? WizardView

  useEffect(() => {
    const isChinese = i18n.language?.startsWith('zh')
    document.documentElement.lang = isChinese ? 'zh-CN' : 'en'
    document.title = t('app.document_title')
  }, [i18n.language, t])

  function openGlossary(term = 'ib') {
    setGlossaryTerm(term)
    setGlossaryOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-slate-800 bg-slate-950 shadow-2xl">
        <Header onOpenGlossary={openGlossary} />
        <main className="flex-1 px-4 py-4">
          {isSessionLoading && (
            <p
              role="status"
              className="mb-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400"
            >
              {t('auth.session_restoring')}
            </p>
          )}
          {sessionRestoreError && (
            <div
              role="alert"
              className="mb-3 rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-100"
            >
              <p>{t('auth.session_restore_failed')}</p>
              <button
                type="button"
                onClick={() => void restoreSession()}
                disabled={isSessionLoading}
                className="mt-2 rounded-lg border border-amber-700 px-2.5 py-1 font-semibold transition hover:bg-amber-900/50 disabled:opacity-50"
              >
                {isSessionLoading ? t('app.syncing') : t('auth.retry_restore')}
              </button>
            </div>
          )}
          {restoreStatus === 'syncing' && (
            <p role="status" className="mb-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
              {t('restore_dialog.status_syncing')}
            </p>
          )}
          {restoreStatus === 'restored' && (
            <div role="status" className="mb-3 rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-100">
              <p className="font-bold">{t('restore_dialog.welcome_back_title')}</p>
              <p className="mt-0.5 text-emerald-200/80">{t('restore_dialog.welcome_back_desc')}</p>
              <button type="button" onClick={dismissRestoreStatus} className="mt-2 text-emerald-200 underline">
                {t('app.dismiss')}
              </button>
            </div>
          )}
          {restoreStatus === 'failed' && (
            <div role="alert" className="mb-3 rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-100">
              <p>{t('restore_dialog.restore_failed')}</p>
              <button type="button" onClick={dismissRestoreStatus} className="mt-2 text-amber-200 underline">
                {t('app.dismiss')}
              </button>
            </div>
          )}
          {isLoadingSavedPrograms && (
            <p className="mb-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
              {t('app.restoring')}
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
                  {isSyncingPrograms ? t('app.syncing') : t('app.retry_sync')}
                </button>
                <button
                  type="button"
                  onClick={clearPersistenceError}
                  className="rounded-lg px-2.5 py-1 text-amber-200 transition hover:bg-amber-900/40"
                >
                  {t('app.dismiss')}
                </button>
              </div>
            </div>
          )}
          {!isSessionLoading && <CurrentView />}
        </main>
        <BottomNav />
        {conflictCandidate && (
          <RestoreConflictModal
            email={conflictCandidate.email}
            onResolve={resolveRestoreConflict}
            onDismiss={dismissConflict}
          />
        )}
        <GlossaryModal
          isOpen={glossaryOpen}
          initialTerm={glossaryTerm}
          onClose={() => setGlossaryOpen(false)}
        />
      </div>
    </div>
  )
}
