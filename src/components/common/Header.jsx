import {
  ChevronRight,
  Compass,
  Globe,
  HelpCircle,
  ShoppingCart,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlan } from '../../context/PlanContext.jsx'

export default function Header({ onOpenGlossary }) {
  const { selectedProgramIds, setActiveTab } = usePlan()
  const { t, i18n } = useTranslation()
  const isEnglish = !i18n.language?.startsWith('zh')

  function toggleLanguage() {
    const nextLanguage = isEnglish ? 'zh' : 'en'
    void i18n.changeLanguage(nextLanguage)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-indigo-900/30 bg-gradient-to-b from-indigo-950/80 to-slate-950/40 px-4 pb-3 pt-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <Compass className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-1.5 text-base font-bold tracking-tight text-white">
              {t('brand.title')}
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                {t('brand.badge')}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {t('brand.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 transition hover:text-white"
            title={t('header.switch_language')}
            aria-label={t('header.switch_language')}
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span className="font-semibold">{isEnglish ? '中文' : 'EN'}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenGlossary?.('math_stream')}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-indigo-800/80 bg-indigo-950 px-2 py-1 text-[11px] text-indigo-300 transition hover:bg-indigo-900 active:scale-95"
            aria-label={t('header.glossary_aria')}
          >
            <HelpCircle className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span>{t('header.glossary')}</span>
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/60 pt-2">
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
    </header>
  )
}
