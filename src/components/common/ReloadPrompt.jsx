import { RefreshCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'

const CHECK_INTERVAL_MS = 60 * 60 * 1000

export default function ReloadPrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (registration.installing || !navigator.onLine) return
        void registration.update().catch(() => {})
      }
      setInterval(check, CHECK_INTERVAL_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-20 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-sm items-center gap-3 rounded-2xl border border-indigo-500/40 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md"
    >
      <RefreshCw className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs text-slate-200">{t('pwa.update_available')}</p>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
      >
        {t('pwa.refresh')}
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label={t('pwa.later')}
        className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
