import { useEffect, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const glossaryEntries = [
  {
    key: 'ib',
    labelKey: 'ib',
    contentKey: 'ib',
  },
  {
    key: 'hl_sl',
    labelKey: 'hl_sl',
    contentKey: 'hl',
  },
  {
    key: 'math_stream',
    labelKey: 'math',
    contentKey: 'math',
  },
  {
    key: 'predicted',
    labelKey: 'predicted',
    contentKey: 'predicted',
  },
]

export default function GlossaryModal({
  isOpen,
  onClose,
  initialTerm = 'ib',
}) {
  const { t } = useTranslation()
  const [selectedKey, setSelectedKey] = useState(
    glossaryEntries.some((entry) => entry.key === initialTerm)
      ? initialTerm
      : 'ib',
  )
  const selectedEntry =
    glossaryEntries.find((entry) => entry.key === selectedKey) ??
    glossaryEntries[0]

  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-title"
        className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            <h2 id="glossary-title" className="text-sm font-bold text-white">
              {t('glossary.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('glossary.close')}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5" aria-label={t('glossary.terms')}>
          {glossaryEntries.map((entry) => {
            const isSelected = selectedKey === entry.key

            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => setSelectedKey(entry.key)}
                aria-pressed={isSelected}
                className={`rounded-lg border py-1.5 text-center text-[11px] font-medium transition ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-600 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(`glossary.${entry.labelKey}`)}
              </button>
            )
          })}
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
          <h3 className="text-xs font-bold text-indigo-300">
            {t(`glossary.${selectedEntry.contentKey}_title`)}
          </h3>
          <p className="rounded-xl border border-indigo-800/30 bg-indigo-950/30 p-2 text-xs font-medium leading-relaxed text-slate-200">
            <strong className="text-cyan-300">{t('glossary.one_line')}</strong>
            {t(`glossary.${selectedEntry.contentKey}_summary`)}
          </p>
          <p className="pt-1 text-xs leading-relaxed text-slate-400">
            {t(`glossary.${selectedEntry.contentKey}_detail`)}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95"
        >
          {t('glossary.done')}
        </button>
      </section>
    </div>
  )
}
