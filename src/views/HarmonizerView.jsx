import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  GraduationCap,
  LoaderCircle,
  Plus,
  Save,
  SlidersHorizontal,
  Target,
  X,
} from 'lucide-react'
import { getPrograms } from '../api/dictionary.js'
import { calculateMultiScenario } from '../api/harmonizer.js'
import SoftEmailCaptureCard from '../components/common/SoftEmailCaptureCard.jsx'
import {
  getHarmonizerErrorMessage,
  getProgramFitStatus,
  getProgramLanguageTip,
  getSelectedScenarioId,
  requiresExternalLanguageStudy,
} from '../api/harmonizerData.js'
import { userProgramApi } from '../api/userPrograms.js'
import { usePlan } from '../context/PlanContext.jsx'

function asList(value) {
  return Array.isArray(value) ? value : []
}

function getProgramId(program) {
  return program?.program_id ?? program?.programId ?? program?.id
}

function getProgramDisplayName(program, t) {
  const university =
    program?.university_name ??
    program?.universityName ??
    t('programs.university_missing')
  const name =
    program?.program_name ??
    program?.name_en ??
    program?.name_cn ??
    program?.program_name_zh ??
    program?.programName ??
    t('programs.program_name_missing')
  return `${university} · ${name}`
}

function getWorkloadLabel(level, t) {
  return (
    {
      EXTREME: t('harmonizer.workload_extreme'),
      HIGH: t('harmonizer.workload_high'),
      BALANCED: t('harmonizer.workload_balanced'),
    }[level] ?? t('harmonizer.workload_unknown')
  )
}

function getWorkloadClass(level) {
  return (
    {
      EXTREME: 'text-red-300',
      HIGH: 'text-amber-300',
      BALANCED: 'text-emerald-300',
    }[level] ?? 'text-slate-300'
  )
}

function getErrorInfo(error, t) {
  return getHarmonizerErrorMessage(error, t)
}

function ProgramFitCard({ program, covered, onRemove, removing }) {
  const { t, i18n } = useTranslation()
  const fitStatus = getProgramFitStatus(program, covered)
  const needsExternalLanguageTest =
    fitStatus === 'SUBJECT_FIT_EXTERNAL_LANG_REQ'
  const isUnfit = fitStatus === 'UNFIT'
  const statusClass = needsExternalLanguageTest
    ? 'border-cyan-800/60'
    : isUnfit
      ? 'border-amber-900/60'
      : 'border-emerald-900/40'
  const badgeClass = needsExternalLanguageTest
    ? 'border-cyan-700 bg-cyan-950 text-cyan-300'
    : isUnfit
      ? 'border-amber-800 bg-amber-950 text-amber-300'
      : 'border-emerald-800 bg-emerald-950 text-emerald-300'
  const badgeLabel = needsExternalLanguageTest
    ? `⚠️ ${t('status_badges.subject_fit_lang_req')}`
    : isUnfit
      ? `❌ ${t('status_badges.unfit')}`
      : `✅ ${t('status_badges.fully_covered')}`

  return (
    <article
      className={`space-y-2.5 rounded-2xl border bg-slate-900/90 p-3.5 shadow-sm ${statusClass}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1 space-y-1 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-sm" aria-hidden="true">
              {program.flag_emoji || '🌐'}
            </span>
            <h4 className="min-w-0 text-xs font-bold leading-snug tracking-tight text-white sm:text-sm">
              {program.university_name}
            </h4>
          </div>
          <div className="mt-0.5 text-[11px] font-medium leading-normal text-slate-300 sm:text-xs">
            {program.program_name}
          </div>
        </div>
        <div className="shrink-0 pt-0.5">
          <span
            className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium shadow-sm ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        </div>
      </div>
      {isUnfit && onRemove && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRemove(program.program_id)}
            disabled={removing}
            className="text-[10px] text-slate-400 underline underline-offset-2 hover:text-white disabled:opacity-50"
          >
            {t('harmonizer.remove')}
          </button>
        </div>
      )}
      {needsExternalLanguageTest && (
        <div className="mt-2.5 w-full space-y-1 rounded-xl border border-slate-800/80 bg-slate-950/80 p-2.5 text-[11px] leading-relaxed text-slate-300">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
            <span aria-hidden="true">💡</span>
            <span>{t('harmonizer.language_tip')}</span>
          </div>
          <p className="pl-4 text-[11px] leading-relaxed text-slate-300">
            {getProgramLanguageTip(program, t, i18n.language)}
          </p>
        </div>
      )}
      {isUnfit && program.unfit_reason && (
        <p className="mt-2.5 w-full rounded-xl border border-amber-900/40 bg-slate-950/70 p-2.5 text-xs leading-relaxed text-amber-100/90">
          <strong>{t('harmonizer.unfit_reason')}</strong> {program.unfit_reason}
        </p>
      )}
    </article>
  )
}

function ScenarioPrintCard({ scenario, selectedProgramIds, t, language }) {
  if (!scenario) return null

  return (
    <div className="scenario-print-card">
      <h1>AtlasIB · {scenario.name}</h1>
      <p>{scenario.strategy_tag}</p>
      <p>
        {t('harmonizer.coverage')} {scenario.coverage_rate_percent}% ·{' '}
        {asList(scenario.covered_programs).length}/
        {selectedProgramIds.length} {t('programs.selected')}
      </p>
      <h2>{t('harmonizer.covered', { count: asList(scenario.covered_programs).length })}</h2>
      <ul>
        {asList(scenario.covered_programs).map((program) => (
          <li key={program.program_id}>
            {program.university_name} · {program.program_name} ·{' '}
            {getProgramFitStatus(program, true) ===
            'SUBJECT_FIT_EXTERNAL_LANG_REQ'
              ? t('status_badges.subject_fit_lang_req')
              : t('status_badges.fully_covered')}
            {getProgramFitStatus(program, true) ===
              'SUBJECT_FIT_EXTERNAL_LANG_REQ' &&
              `: ${getProgramLanguageTip(program, t, language)}`}
          </li>
        ))}
      </ul>
      <h2>{t('harmonizer.uncovered', { count: asList(scenario.uncovered_programs).length })}</h2>
      <ul>
        {asList(scenario.uncovered_programs).map((program) => (
          <li key={program.program_id}>
            {program.university_name} · {program.program_name}：
            {program.unfit_reason}
          </li>
        ))}
      </ul>
      <h2>{t('harmonizer.subjects', { name: scenario.name })}</h2>
      <ol>
        {asList(scenario.subjects).map((subject) => (
          <li key={subject.subject_code}>
            Group {subject.group_number} · {subject.subject_name} ·{' '}
            {subject.level} · {t('harmonizer.target_grade', { grade: subject.target_grade })}
            {subject.advisory_notes ? ` · ${subject.advisory_notes}` : ''}
          </li>
        ))}
      </ol>
      <h2>{t('harmonizer.strategy')}</h2>
      <p>{scenario.strategic_summary}</p>
      <p>{getWorkloadLabel(scenario.workload_level, t)}</p>
    </div>
  )
}

export default function HarmonizerView() {
  const { t, i18n } = useTranslation()
  const {
    selectedProgramIds,
    setActiveTab,
    toggleProgram,
    removeProgramsFromSelection,
    currentProfileId,
    diagnosisResult,
    isSyncingPrograms,
    activeScenario,
    activeScenarioIsStale,
    applyScenarioAsActive,
  } = usePlan()
  const [scenarioSelection, setScenarioSelection] = useState(null)
  const [applyError, setApplyError] = useState('')

  const harmonizeQuery = useQuery({
    queryKey: ['harmonize_multi', selectedProgramIds, currentProfileId],
    queryFn: () =>
      calculateMultiScenario({
        program_ids: selectedProgramIds,
        ...(currentProfileId ? { profile_id: currentProfileId } : {}),
      }),
    enabled: selectedProgramIds.length > 0 && selectedProgramIds.length <= 50,
    retry: false,
  })

  const selectedProgramsQuery = useQuery({
    queryKey: ['profile-programs', currentProfileId],
    queryFn: () => userProgramApi.getSelectedPrograms(currentProfileId),
    enabled: Boolean(currentProfileId),
  })

  const catalogQuery = useQuery({
    queryKey: ['programs', 'multi-scenario-labels'],
    queryFn: async () => {
      const response = await getPrograms({ limit: 100 })
      return Array.isArray(response)
        ? response
        : response?.items ?? response?.programs ?? []
    },
  })

  const harmonizeData = harmonizeQuery.data
  const scenarios = asList(harmonizeData?.scenarios)
  const activeScenarioId = getSelectedScenarioId(
    scenarioSelection,
    harmonizeData,
  )

  const currentScenario = useMemo(
    () =>
      scenarios.find((scenario) => scenario.scenario_id === activeScenarioId) ??
      scenarios[0] ??
      null,
    [scenarios, activeScenarioId],
  )

  const programDetails = useMemo(() => {
    const details = new Map()
    for (const program of selectedProgramsQuery.data ?? []) {
      details.set(getProgramId(program), program)
    }
    for (const program of diagnosisResult?.recommended_programs ?? []) {
      if (!details.has(getProgramId(program))) {
        details.set(getProgramId(program), program)
      }
    }
    for (const program of catalogQuery.data ?? []) {
      if (!details.has(getProgramId(program))) {
        details.set(getProgramId(program), program)
      }
    }
    return details
  }, [
    selectedProgramsQuery.data,
    diagnosisResult,
    catalogQuery.data,
  ])

  async function removeSelectedProgram(programId) {
    await toggleProgram(programId)
  }

  async function removeInvalidPrograms(programIds) {
    await removeProgramsFromSelection(programIds)
    await selectedProgramsQuery.refetch()
  }

  function saveCurrentScenario() {
    setApplyError('')
    const result = applyScenarioAsActive(currentScenario)
    if (!result.success) setApplyError(result.error)
  }

  function exportScenario() {
    window.print()
  }

  const errorInfo = harmonizeQuery.isError
    ? getErrorInfo(harmonizeQuery.error, t)
    : null
  const coveredPrograms = asList(currentScenario?.covered_programs)
  const uncoveredPrograms = asList(currentScenario?.uncovered_programs)
  const subjects = asList(currentScenario?.subjects)
  const invalidProgramIds = errorInfo?.programIds ?? []
  const isCurrentScenarioSaved =
    Boolean(activeScenario) &&
    !activeScenarioIsStale &&
    activeScenario.scenario_id === currentScenario?.scenario_id

  if (selectedProgramIds.length === 0) {
    return (
      <section className="rounded-2xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
        {t('harmonizer.no_programs')}
        <button
          type="button"
          onClick={() => setActiveTab('programs')}
          className="ml-2 font-semibold text-cyan-300 underline underline-offset-2"
        >
          {t('harmonizer.choose_programs')}
        </button>
      </section>
    )
  }

  if (selectedProgramIds.length > 50) {
    return (
      <section className="rounded-2xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-100">
        {t('harmonizer.too_many', { count: selectedProgramIds.length })}
        <button
          type="button"
          onClick={() => setActiveTab('programs')}
          className="ml-2 font-semibold text-cyan-300 underline underline-offset-2"
        >
          {t('harmonizer.manage')}
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-4 pb-28" aria-labelledby="harmonizer-heading">
      <style>{`
        .scenario-print-card { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .scenario-print-card, .scenario-print-card * { visibility: visible !important; }
          .scenario-print-card {
            display: block !important;
            position: absolute;
            inset: 0;
            padding: 24px;
            color: #111827;
            background: white;
            font: 12pt/1.5 sans-serif;
          }
          .scenario-print-card h1 { font-size: 22pt; margin-bottom: 8px; }
          .scenario-print-card h2 { font-size: 15pt; margin: 18px 0 6px; }
          .scenario-print-card ul, .scenario-print-card ol { padding-left: 24px; }
        }
      `}</style>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          {t('harmonizer.section')}
        </p>
        <h2 id="harmonizer-heading" className="text-lg font-bold text-white">
          {t('harmonizer.title')}
        </h2>
        <p className="text-xs text-slate-400">
          {t('harmonizer.subtitle')}
        </p>
      </div>

      <section
        aria-label={t('harmonizer.current_programs', { count: selectedProgramIds.length })}
        className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-white">
            {t('harmonizer.current_programs', { count: selectedProgramIds.length })}
          </h3>
          <button
            type="button"
            onClick={() => setActiveTab('programs')}
            className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            {t('harmonizer.add_program')}
          </button>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          {selectedProgramIds.map((programId) => (
            <span
              key={programId}
              className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-indigo-800 bg-indigo-950/60 py-1 pl-2.5 pr-1.5 text-[10px] text-indigo-100"
            >
              <span className="min-w-0 truncate">
                {getProgramDisplayName(programDetails.get(programId) ?? {
                  program_id: programId,
                }, t)}
              </span>
              <button
                type="button"
                aria-label={`${t('common.remove')} ${programId}`}
                title={t('harmonizer.remove')}
                disabled={isSyncingPrograms || selectedProgramIds.length <= 1}
                onClick={() => removeSelectedProgram(programId)}
                className="rounded-full p-0.5 text-slate-400 hover:bg-red-900/60 hover:text-red-200 disabled:opacity-40"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      </section>

      {activeScenarioIsStale && (
        <p
          role="status"
          className="rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200"
        >
          {t('harmonizer.stale')}
        </p>
      )}

      {harmonizeQuery.isPending && (
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('harmonizer.loading')}
          </div>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-12 animate-pulse rounded-xl bg-slate-800/70"
            />
          ))}
        </div>
      )}

      {harmonizeQuery.isError && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200"
        >
          <p className="font-bold">
            {errorInfo.code === 'program_not_found'
              ? t('harmonizer.program_not_found')
              : t('harmonizer.failed')}
          </p>
          <p className="text-xs leading-relaxed">{errorInfo.message}</p>
          {invalidProgramIds.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold">{t('harmonizer.invalid_programs')}</p>
              {invalidProgramIds.map((programId) => (
                <p key={programId} className="text-[11px] text-red-100">
                  · {getProgramDisplayName(programDetails.get(programId) ?? {
                    program_id: programId,
                  }, t)}
                </p>
              ))}
              <button
                type="button"
                disabled={isSyncingPrograms}
                onClick={() => removeInvalidPrograms(invalidProgramIds)}
                className="mt-2 rounded-lg border border-red-700 px-3 py-2 text-xs font-semibold hover:bg-red-900/50 disabled:opacity-50"
              >
                {isSyncingPrograms ? t('harmonizer.removing') : t('harmonizer.remove_invalid')}
              </button>
            </div>
          )}
          {errorInfo.code === 'profile_not_found' && (
            <button
              type="button"
              onClick={() => setActiveTab('wizard')}
              className="rounded-lg border border-red-700 px-3 py-2 text-xs font-semibold hover:bg-red-900/50"
            >
              {t('harmonizer.diagnose_again')}
            </button>
          )}
          <button
            type="button"
            onClick={() => harmonizeQuery.refetch()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {harmonizeQuery.isSuccess && harmonizeData && (
        <>
          {asList(harmonizeData.universal_warnings).length > 0 && (
            <section
              aria-label={t('harmonizer.universal_warnings')}
              className="space-y-1.5 rounded-xl border border-amber-800 bg-amber-950/30 p-3"
            >
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {t('harmonizer.universal_warnings')}
              </h3>
              {harmonizeData.universal_warnings.map((warning, index) => (
                <p
                  key={`${warning}-${index}`}
                  className="text-[11px] leading-relaxed text-amber-100/90"
                >
                  · {warning}
                </p>
              ))}
            </section>
          )}

          {scenarios.length > 1 && (
            <div
              role="tablist"
              aria-label={t('harmonizer.choose_scenario')}
              className="grid min-w-0 grid-cols-1 gap-2"
            >
              {scenarios.map((scenario) => {
                const isActive =
                  scenario.scenario_id === currentScenario?.scenario_id
                const coveredCount = asList(scenario.covered_programs).length
                return (
                  <button
                    key={scenario.scenario_id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() =>
                      setScenarioSelection({
                        data: harmonizeData,
                        scenarioId: scenario.scenario_id,
                      })
                    }
                    className={`flex min-w-0 flex-col gap-1 rounded-2xl border px-3 py-2 text-left transition ${
                      isActive
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-950 to-slate-900 shadow-md shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span
                        className={`min-w-0 text-xs font-bold ${
                          isActive ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {scenario.name}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300">
                        {scenario.strategy_tag}
                      </span>
                      {requiresExternalLanguageStudy(scenario) && (
                        <span className="rounded border border-amber-700 bg-amber-950/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
                          {t('harmonizer.ext_lang_required')}
                        </span>
                      )}
                      {scenario.scenario_id ===
                        harmonizeData.recommended_scenario_id && (
                        <span className="text-[9px] text-amber-300">
                          {t('harmonizer.recommended')}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t('harmonizer.coverage')}{' '}
                      <strong
                        className={
                          scenario.coverage_rate_percent === 100
                            ? 'text-emerald-300'
                            : 'text-amber-300'
                        }
                      >
                        {scenario.coverage_rate_percent}%
                      </strong>{' '}
                      ({coveredCount}/{harmonizeData.total_selected_programs}
                      )
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {currentScenario && (
            <>
              <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('harmonizer.covered', { count: coveredPrograms.length })}
                    </h3>
                    <span className="text-[10px] font-normal text-slate-400">
                      {t('harmonizer.fit_check')}
                    </span>
                  </div>
                  {coveredPrograms.length > 0 ? (
                    coveredPrograms.map((program) => (
                      <ProgramFitCard
                        key={program.program_id}
                        program={program}
                        covered
                      />
                    ))
                  ) : (
                    <p className="rounded-lg bg-slate-950/70 p-2 text-[11px] text-slate-400">
                      {t('harmonizer.no_coverage')}
                    </p>
                  )}
                </div>

                {uncoveredPrograms.length > 0 && (
                  <div className="space-y-1.5 border-t border-slate-800 pt-2">
                    <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('harmonizer.uncovered', { count: uncoveredPrograms.length })}
                    </h3>
                    {uncoveredPrograms.map((program) => (
                      <ProgramFitCard
                        key={program.program_id}
                        program={program}
                        covered={false}
                        onRemove={removeSelectedProgram}
                        removing={isSyncingPrograms}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <GraduationCap
                        className="h-4 w-4 text-indigo-400"
                        aria-hidden="true"
                      />
                      {t('harmonizer.subjects', { name: currentScenario.name })}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {currentScenario.strategy_tag}
                    </p>
                    {requiresExternalLanguageStudy(currentScenario) ? (
                      <p className="mt-1.5 rounded-lg border border-amber-800 bg-amber-950/40 px-2 py-1 text-[10px] leading-relaxed text-amber-100">
                        <strong>{t('harmonizer.ext_lang_required')}</strong>
                        {' · '}
                        {t('harmonizer.ext_lang_required_desc')}
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-emerald-300/90">
                        {t('harmonizer.ext_lang_not_required')}
                      </p>
                    )}
                  </div>
                  {coveredPrograms.length > 0 &&
                    currentScenario.target_ib_score > 0 && (
                      <span className="rounded-full border border-indigo-800 bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        {t('harmonizer.predicted_floor', { score: currentScenario.target_ib_score })}
                      </span>
                    )}
                </div>
                {coveredPrograms.length === 0 && (
                  <p className="text-[11px] text-amber-300">
                    {currentScenario.strictest_program}
                  </p>
                )}

                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <article
                      key={subject.subject_code}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                            Group {subject.group_number}
                            {subject.group_name ? ` · ${subject.group_name}` : ''}
                          </span>
                          <span className="font-bold text-white">
                            {subject.subject_name}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              subject.level === 'HL'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {subject.level}
                          </span>
                        </div>
                        {asList(subject.requested_by).length > 0 && (
                          <p className="line-clamp-2 text-[10px] leading-relaxed text-slate-400">
                            {t('harmonizer.requirements_source')} {subject.requested_by.join(' · ')}
                          </p>
                        )}
                        {subject.advisory_notes && (
                          <p className="mt-2 rounded-lg border border-indigo-800/50 bg-indigo-950/40 p-2 text-[10px] leading-relaxed text-indigo-200">
                            {subject.advisory_notes}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-amber-300">
                          {t('harmonizer.target_grade', { grade: subject.target_grade })}
                        </p>
                        <p className="text-[9px] text-slate-500">{t('harmonizer.advisory_target')}</p>
                      </div>
                    </article>
                  ))}
                  {subjects.length !== 6 && (
                    <p className="text-[11px] text-amber-300">
                      {t('harmonizer.subject_count_warning', { count: subjects.length })}
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-2 rounded-2xl border border-indigo-900/50 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/30 p-3.5">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Target className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  {t('harmonizer.strategy')}
                </h3>
                <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-300">
                  {currentScenario.strategic_summary}
                </p>
                <p className="flex items-center gap-2 border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                  <SlidersHorizontal
                    className="h-3 w-3"
                    aria-hidden="true"
                  />
                  {t('harmonizer.workload')}
                  <strong
                    className={getWorkloadClass(
                      currentScenario.workload_level,
                    )}
                  >
                    {getWorkloadLabel(currentScenario.workload_level, t)}
                  </strong>
                  · {t('harmonizer.hl_count', { count: currentScenario.hl_count })}
                </p>
              </section>

              <SoftEmailCaptureCard
                scenarios={harmonizeData?.scenarios ?? null}
                activeScenarioId={currentScenario?.scenario_id ?? null}
              />

              {applyError && (
                <p role="alert" className="text-xs text-red-300">
                  {applyError}
                </p>
              )}
              <div className="fixed inset-x-0 bottom-[58px] z-30 mx-auto flex max-w-md gap-2 border-t border-slate-800 bg-slate-950/95 p-3 backdrop-blur">
                <button
                  type="button"
                  onClick={saveCurrentScenario}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 active:scale-95"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(isCurrentScenarioSaved ? 'harmonizer.saved_plan' : 'harmonizer.save_plan')}
                </button>
                <button
                  type="button"
                  onClick={exportScenario}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('harmonizer.export')}
                </button>
              </div>
              <div className="sr-only" aria-live="polite">
                {t('harmonizer.current_scenario', { name: currentScenario.name })}
              </div>
              <ScenarioPrintCard
                scenario={currentScenario}
                selectedProgramIds={selectedProgramIds}
                t={t}
                language={i18n.language}
              />
            </>
          )}
        </>
      )}
    </section>
  )
}
