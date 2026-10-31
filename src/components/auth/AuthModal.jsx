import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react'
import { authApi } from '../../api/auth.js'
import { usePlan } from '../../context/PlanContext.jsx'

const OTP_COOLDOWN_SECONDS = 60

function getApiError(error) {
  const apiError = error?.response?.data?.error
  const details = apiError?.details
  const cooldownSeconds = Array.isArray(details)
    ? details.find((item) => item?.cooldown_seconds)?.cooldown_seconds
    : details?.cooldown_seconds
  return {
    message: apiError?.message,
    cooldownSeconds,
  }
}

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation()
  const { loginWithOtp } = usePlan()
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [step, setStep] = useState(1)
  const currentLang = i18n.language?.startsWith('zh') ? 'zh' : 'en'

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  function closeModal() {
    if (isSendingOtp || isVerifying) return
    setEmail('')
    setOtpCode('')
    setErrorMessage('')
    setCooldown(0)
    setStep(1)
    onClose()
  }

  if (!isOpen) return null

  async function handleSendCode(event) {
    event?.preventDefault()
    if (isSendingOtp || isVerifying || cooldown > 0) return
    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage(t('auth.err_invalid_email'))
      return
    }

    setErrorMessage('')
    setIsSendingOtp(true)
    try {
      const response = await authApi.sendOtp(normalizedEmail, currentLang)
      setCooldown(response?.cooldown_seconds || OTP_COOLDOWN_SECONDS)
      setStep(2)
    } catch (error) {
      const apiError = getApiError(error)
      if (error?.response?.status === 429 && apiError.cooldownSeconds) {
        setCooldown(apiError.cooldownSeconds)
      }
      setErrorMessage(apiError.message || t('auth.err_send_failed'))
    } finally {
      setIsSendingOtp(false)
    }
  }

  async function handleVerify(event) {
    event?.preventDefault()
    if (isSendingOtp || isVerifying) return
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setErrorMessage(t('auth.err_invalid_code'))
      return
    }

    setErrorMessage('')
    setIsVerifying(true)
    try {
      const result = await loginWithOtp(email.trim(), otpCode, currentLang)
      if (result?.success) {
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.error?.message ||
          error?.message ||
          t('auth.err_invalid_code'),
      )
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSendingOtp && !isVerifying) {
          closeModal()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-sm space-y-4 rounded-3xl border border-indigo-700/80 bg-slate-900 p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={closeModal}
          disabled={isSendingOtp || isVerifying}
          aria-label={t('common.close')}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-white disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-500/80 bg-indigo-950">
              <KeyRound className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            </div>
            <h2 id="auth-modal-title" className="text-sm font-bold text-white">
              {t('auth.modal_title')}
            </h2>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {t('auth.modal_subtitle')}
          </p>
        </div>

        <form
          onSubmit={step === 1 ? handleSendCode : handleVerify}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label
              htmlFor="auth-email"
              className="text-[10px] font-bold uppercase tracking-wider text-slate-300"
            >
              {t('auth.email_label')}
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErrorMessage('')
                }}
                placeholder={t('auth.email_placeholder')}
                disabled={step === 2 || isSendingOtp || isVerifying}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white transition placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {step === 2 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-otp"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-300"
                >
                  {t('auth.otp_label')}
                </label>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={cooldown > 0 || isSendingOtp || isVerifying}
                  className="text-[10px] text-cyan-400 transition hover:underline disabled:opacity-50"
                >
                  {cooldown > 0
                    ? t('auth.btn_resend_code', { seconds: cooldown })
                    : t('auth.btn_get_code')}
                </button>
              </div>
              <input
                id="auth-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                value={otpCode}
                onChange={(event) =>
                  setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder={t('auth.otp_placeholder')}
                disabled={isVerifying}
                className="w-full rounded-xl border border-indigo-500 bg-slate-950 py-2 text-center font-mono text-sm font-bold tracking-[6px] text-cyan-300 focus:outline-none disabled:opacity-60"
              />
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="pl-1 text-[10px] text-rose-400">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSendingOtp || isVerifying}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:opacity-95 disabled:opacity-50"
          >
            {isSendingOtp || isVerifying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <span>
                  {step === 1
                    ? t('auth.btn_get_code')
                    : t('auth.btn_submit_login')}
                </span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1 pt-1 text-[10px] text-slate-500">
          <ShieldCheck
            className="h-3 w-3 text-emerald-400"
            aria-hidden="true"
          />
          <span>{t('auth.privacy_hint')}</span>
        </div>
      </section>
    </div>
  )
}
