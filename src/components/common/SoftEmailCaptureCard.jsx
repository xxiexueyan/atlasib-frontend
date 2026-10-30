import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  RotateCw,
  Sparkles,
  SquarePen,
} from 'lucide-react'
import { userProgramApi } from '../../api/userPrograms.js'
import { usePlan } from '../../context/PlanContext.jsx'

const RESEND_COOLDOWN_SECONDS = 30

export default function SoftEmailCaptureCard({
  onSaved,
  scenarios = null,
  activeScenarioId = null,
}) {
  const { t, i18n } = useTranslation()
  const { currentProfileId } = usePlan()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorKey, setErrorKey] = useState('')
  const [isDismissed, setIsDismissed] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  if (isDismissed) return null

  const currentLang = i18n.language?.startsWith('zh') ? 'zh' : 'en'

  async function handleSubmit(event) {
    event?.preventDefault()
    if (isSubmitting || cooldown > 0) return
    const normalizedEmail = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorKey('email_gate.err_invalid_email')
      return
    }

    if (!currentProfileId) {
      setErrorKey('email_gate.err_profile_missing')
      return
    }

    setErrorKey('')
    setIsSubmitting(true)

    try {
      await userProgramApi.claimProfileEmail(
        currentProfileId,
        normalizedEmail,
        currentLang,
        scenarios,
        activeScenarioId,
      )
    } catch {
      setErrorKey('email_gate.err_failed')
      return
    } finally {
      setIsSubmitting(false)
    }

    setIsSuccess(true)
    setCooldown(RESEND_COOLDOWN_SECONDS)
    onSaved?.(normalizedEmail)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-indigo-700/60 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-cyan-950/40 p-4 shadow-lg transition-all">
      {isSuccess ? (
        <div
          role="status"
          className="flex items-center gap-3 py-2"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/80 bg-emerald-950/80">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white">
              {t('email_gate.success_title')}
            </h4>
            <p className="text-[11px] leading-snug text-slate-300">
              {t('email_gate.success_desc', { email: email.trim() })}
            </p>
            {errorKey && (
              <p role="alert" className="text-[10px] text-rose-400">
                {t(errorKey)}
              </p>
            )}
            <div className="flex gap-3 pt-1 text-[10px]">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || cooldown > 0}
                className="flex items-center gap-1 font-semibold text-cyan-300 transition hover:text-cyan-200 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCw className="h-3 w-3" aria-hidden="true" />
                )}
                {cooldown > 0
                  ? `${t('email_gate.btn_resend')} (${cooldown}s)`
                  : t('email_gate.btn_resend')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false)
                  setErrorKey('')
                }}
                disabled={isSubmitting}
                className="flex items-center gap-1 text-slate-400 transition hover:text-slate-200 disabled:opacity-50"
              >
                <SquarePen className="h-3 w-3" aria-hidden="true" />
                {t('email_gate.btn_change_email')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <h4 className="text-xs font-bold text-white">
                {t('email_gate.title')}
              </h4>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {t('email_gate.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-1.5">
              <div className="relative min-w-0 flex-1">
                <Mail
                  className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (errorKey) setErrorKey('')
                  }}
                  placeholder={t('email_gate.placeholder')}
                  autoComplete="email"
                  maxLength={254}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errorKey)}
                  aria-describedby={errorKey ? 'email-capture-error' : undefined}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white transition placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:opacity-95 disabled:cursor-wait disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <span>{t('email_gate.btn_submit')}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            {errorKey && (
              <p
                id="email-capture-error"
                role="alert"
                className="pl-1 text-[10px] text-rose-400"
              >
                {t(errorKey)}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-slate-500">
              <span className="flex min-w-0 items-center gap-1">
                <ShieldCheck
                  className="h-3 w-3 shrink-0 text-emerald-400/80"
                  aria-hidden="true"
                />
                <span>{t('email_gate.privacy_note')}</span>
              </span>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                disabled={isSubmitting}
                className="shrink-0 underline transition hover:text-slate-300 disabled:opacity-50"
              >
                {t('email_gate.skip_btn')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
