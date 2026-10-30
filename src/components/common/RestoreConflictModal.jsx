import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'

export default function RestoreConflictModal({
  email,
  onResolve,
  onDismiss,
}) {
  const { t } = useTranslation()
  const [pendingAction, setPendingAction] = useState('')
  const [hasError, setHasError] = useState(false)
  const isSubmitting = Boolean(pendingAction)

  async function handleAction(action) {
    setPendingAction(action)
    setHasError(false)
    try {
      await onResolve(action)
    } catch {
      setHasError(true)
    } finally {
      setPendingAction('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-conflict-title"
        className="w-full max-w-sm space-y-3.5 rounded-3xl border border-indigo-700/80 bg-slate-900 p-5 shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-600/80 bg-amber-950/80">
            <AlertCircle className="h-4 w-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 id="restore-conflict-title" className="text-xs font-bold text-white">
              {t('restore_dialog.conflict_title')}
            </h3>
            <span className="break-all font-mono text-[10px] text-cyan-400">
              {email}
            </span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-300">
          {t('restore_dialog.conflict_desc', { email })}
        </p>

        {hasError && (
          <p role="alert" className="text-[10px] text-rose-400">
            {t('restore_dialog.err_failed')}
          </p>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('OVERWRITE')}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-3 py-2.5 text-xs font-bold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {pendingAction === 'OVERWRITE' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{t('restore_dialog.btn_overwrite')}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction('KEEP_NEW')}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            {pendingAction === 'KEEP_NEW' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            <span>{t('restore_dialog.btn_keep_both')}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onDismiss}
            className="w-full text-center text-[10px] text-slate-500 underline transition hover:text-slate-300 disabled:opacity-50"
          >
            {t('restore_dialog.btn_later')}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 pt-1 text-[10px] text-slate-500">
          <ShieldCheck className="h-3 w-3 text-emerald-400" aria-hidden="true" />
          <span>{t('restore_dialog.protected_note')}</span>
        </div>
      </div>
    </div>
  )
}
