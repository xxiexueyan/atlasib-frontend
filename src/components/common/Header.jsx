import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Globe,
  HelpCircle,
  LogIn,
  LogOut,
  ShoppingCart,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthModal from '../auth/AuthModal.jsx'
import { usePlan } from '../../context/PlanContext.jsx'

const BTN =
  'flex h-7 shrink-0 items-center gap-1 rounded-lg border px-2 text-[11px] font-medium transition active:scale-95'

export default function Header({ onOpenGlossary }) {
  const {
    selectedProgramIds,
    setActiveTab,
    currentUser,
    isSessionLoading,
    sessionRestoreError,
    restoreSession,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = usePlan()
  const { t, i18n } = useTranslation()
  const isEnglish = !i18n.language?.startsWith('zh')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [authNotice, setAuthNotice] = useState(null)

  function toggleLanguage() {
    void i18n.changeLanguage(isEnglish ? 'zh' : 'en')
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    const result = await logout()
    setIsLoggingOut(false)
    setShowUserMenu(false)
    setAuthNotice({
      key: result.success ? 'auth.logout_success' : 'auth.logout_unconfirmed',
      isError: !result.success,
    })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 px-3 py-2.5 backdrop-blur-md sm:px-4">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2">
        <div className="flex min-w-0 shrink items-center gap-2">
          <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-px shadow-md shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-slate-950">
              <Compass className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="text-base font-extrabold leading-none tracking-tight text-white">
              {t('brand.title')}
            </h1>
            <p className="mt-1 truncate text-[10px] leading-tight text-slate-400">
              {t('brand.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={toggleLanguage}
            className={`${BTN} border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white`}
            title={t('header.switch_language')}
            aria-label={t('header.switch_language')}
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span className="font-semibold">{isEnglish ? '中文' : 'EN'}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenGlossary?.('math_stream')}
            className={`${BTN} border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white`}
            aria-label={t('header.glossary_aria')}
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
            <span className="hidden sm:inline">{t('header.glossary')}</span>
          </button>
          {!isSessionLoading &&
            (currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((visible) => !visible)}
                  aria-expanded={showUserMenu}
                  className={`${BTN} border-slate-700 bg-slate-900 text-slate-200 hover:border-indigo-500`}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span className="max-w-[70px] truncate sm:max-w-[120px]">
                    {currentUser.email}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0 text-slate-500" aria-hidden="true" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 z-40 mt-1.5 w-48 rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-xl">
                    <p className="truncate border-b border-slate-800 px-2 py-1.5 text-[10px] text-slate-400">
                      {t('auth.logged_in_as')} {currentUser.email}
                    </p>
                    <button
                      type="button"
                      disabled={isLoggingOut}
                      onClick={handleLogout}
                      className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-rose-400 transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('auth.sign_out')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : sessionRestoreError ? (
              <button
                type="button"
                onClick={() => void restoreSession()}
                className={`${BTN} border-amber-800 bg-amber-950/60 text-amber-200 hover:bg-amber-900/60`}
              >
                {t('auth.retry_restore')}
              </button>
            ) : (
              <button
                type="button"
                aria-label={t('auth.sign_in')}
                onClick={() => {
                  setAuthNotice(null)
                  setIsAuthModalOpen(true)
                }}
                className={`${BTN} whitespace-nowrap border-indigo-700/80 bg-indigo-950/70 font-semibold text-indigo-200 shadow-sm hover:bg-indigo-900 hover:text-white`}
              >
                <LogIn className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                <span className="sm:hidden">{t('auth.sign_in_short')}</span>
                <span className="hidden sm:inline">{t('auth.sign_in')}</span>
              </button>
            ))}
        </div>
      </div>

      {authNotice && (
        <p
          role={authNotice.isError ? 'alert' : 'status'}
          className={`mt-2 text-right text-[10px] ${
            authNotice.isError ? 'text-amber-300' : 'text-emerald-300'
          }`}
        >
          {t(authNotice.key)}
        </p>
      )}

      <div className="mx-auto mt-2.5 flex w-full max-w-4xl items-center justify-between border-t border-slate-800/60 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <ShoppingCart className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          <span>{t('header.selected')}</span>
          <span className="rounded bg-indigo-600/60 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {t('header.program_count', { count: selectedProgramIds.length })}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('harmonizer')}
          className="flex items-center gap-1 rounded-md border border-cyan-800/50 bg-cyan-950/40 px-2 py-0.5 text-[11px] font-semibold text-cyan-400 transition hover:text-cyan-300 active:scale-95"
        >
          <span>{t('header.view_plan')}</span>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setAuthNotice(null)}
      />
    </header>
  )
}
