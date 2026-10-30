import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Check,
  CircleAlert,
  GraduationCap,
  ListChecks,
  LoaderCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react'
import {
  buildHarmonizerPayload,
  calculateMultiScenario,
} from '../api/harmonizer.js'
import { getPrograms, mergeProgramDetails } from '../api/dictionary.js'
import { getMandatorySubjectsForProgram } from '../api/harmonizerData.js'
import { formatLocalAnnualTuition } from '../api/programCost.js'
import { userProgramApi } from '../api/userPrograms.js'
import { usePlan } from '../context/PlanContext.jsx'

const allCountries = 'all'
const viewModes = [
  { id: 'selected', label: '已选志愿' },
  { id: 'recommended', label: '向导推荐' },
  { id: 'catalog', label: '全部专业' },
]

function getProgramList(response, t) {
  const programs = Array.isArray(response)
    ? response
    : response?.items ?? response?.programs

  if (!Array.isArray(programs)) {
    throw new TypeError(t('errors.invalid_program_response'))
  }

  return programs
}

function getProgramId(program) {
  return program.program_id ?? program.programId ?? program.id
}

function getProgramName(program, t, language) {
  const names =
    language === 'zh'
      ? [
          program.name_cn,
          program.program_name_zh,
          program.program_name,
          program.programName,
          program.name_en,
        ]
      : [
          program.name_en,
          program.program_name,
          program.programName,
          program.name_cn,
          program.program_name_zh,
        ]
  return names.find(Boolean) ?? getProgramId(program) ?? t('programs.program_name_missing')
}

function getUniversityName(program, t, language) {
  return (
    (language === 'zh'
      ? program.university_name_zh ?? program.university_name
      : program.university_name_en ?? program.university_name) ??
    program.universityName ??
    program.uniName ??
    t('programs.university_missing')
  )
}

function getCountryId(program) {
  return (
    program.country_id ??
    program.countryId ??
    program.country_code ??
    program.country
  )
}

function getCountryName(program, t) {
  return (
    program.country_name ??
    program.countryName ??
    program.country ??
    t('programs.country_other')
  )
}

function splitIntoChunks(items, chunkSize) {
  const chunks = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

function mergeHarmonizerScenarios(responses) {
  const scenarios = new Map()
  for (const response of responses) {
    for (const scenario of response?.scenarios ?? []) {
      const existing = scenarios.get(scenario.scenario_id)
      if (existing) {
        existing.subjects.push(...(scenario.subjects ?? []))
      } else {
        scenarios.set(scenario.scenario_id, {
          ...scenario,
          subjects: [...(scenario.subjects ?? [])],
        })
      }
    }
  }
  return { scenarios: [...scenarios.values()] }
}

function getMandatorySubjects(program, harmonizeData) {
  const subjects =
    program.mandatory_courses ??
    program.mandatoryCourses ??
    program.mandatory_subjects ??
    program.mandatorySubjects ??
    program.admission_requirements?.mandatory_courses ??
    program.admissionReqs?.mandatoryCourses ??
    []

  const savedSubjects = Array.isArray(subjects)
    ? subjects
        .map((subject) => {
          if (typeof subject === 'string') return subject
          return (
            subject?.label ??
            subject?.subject_name ??
            subject?.subjectName ??
            subject?.code
          )
        })
        .filter(Boolean)
    : []
  return savedSubjects.length > 0
    ? savedSubjects
    : getMandatorySubjectsForProgram(program, harmonizeData)
}

function getPredictedRequirement(program, t) {
  const admissions = program.admission_requirements ?? program.admissionReqs
  const text =
    program.predicted_text ??
    program.predictedText ??
    admissions?.predicted_text ??
    admissions?.predictedText
  const recommended =
    program.rec_predicted_min ?? admissions?.rec_predicted_min
  const minimum =
    program.min_predicted ??
    program.min_predicted_total ??
    admissions?.min_predicted ??
    admissions?.minPredicted
  const score = recommended ?? minimum

  if (text) return text
  if (score !== undefined && score !== null && score !== '') {
    return t(recommended ? 'programs.recommended_score' : 'programs.minimum_score', {
      score,
    })
  }
  return t('programs.no_score')
}

function getWorkPermitOverview(program, t) {
  const overview =
    program.visa_work ??
    program.visaWork ??
    program.work_permit_overview ??
    program.workPermitOverview

  if (overview) return overview
  if (program.coop_available === true || program.coopAvailable === true) {
    return t('programs.coop')
  }
  if (program.coop_available === false || program.coopAvailable === false) {
    return t('programs.no_coop')
  }
  return t('programs.no_visa_data')
}

function matchesFilters(program, search, countryId, t, language) {
  const query = search.trim().toLocaleLowerCase()
  const matchesSearch =
    !query ||
    `${getProgramName(program, t, language)} ${getUniversityName(program, t, language)} ${getCountryName(program, t)}`
      .toLocaleLowerCase()
      .includes(query)
  const itemCountry = getCountryId(program)
  const matchesCountry =
    countryId === allCountries ||
    itemCountry === undefined ||
    String(itemCountry) === countryId

  return matchesSearch && matchesCountry
}

function ProgramCard({
  program,
  harmonizeData,
  mandatorySubjectsLoading,
  mandatorySubjectsError,
  mandatorySubjectsNeedsDiagnosis,
  selected,
  disabled,
  onToggle,
  removable = true,
}) {
  const { t, i18n } = useTranslation()
  const subjects = getMandatorySubjects(program, harmonizeData)
  const programId = getProgramId(program)

  return (
    <article
      className={`space-y-3 rounded-2xl border p-3.5 ${
        selected
          ? 'border-indigo-500/70 bg-slate-900 shadow-md shadow-indigo-500/10'
          : 'border-slate-800 bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-bold text-white">{getProgramName(program, t, i18n.language)}</h3>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              {program.flag_emoji ?? program.flagEmoji ?? ''} {getCountryName(program, t)}
            </span>
          </div>
          <p className="mt-1 text-xs text-indigo-300">{getUniversityName(program, t, i18n.language)}</p>
        </div>

        {removable && programId && (
          <button
            type="button"
            onClick={() => onToggle(programId)}
            disabled={disabled}
            aria-pressed={selected}
            aria-label={`${t(selected ? 'programs.remove_from_cart' : 'programs.add')}: ${getProgramName(program, t, i18n.language)}`}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {selected ? (
              <>
                <Check className="h-3 w-3" aria-hidden="true" />
                {t('programs.selected_badge')}
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" aria-hidden="true" />
                {t('programs.unselected_badge')}
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2 rounded-xl bg-slate-950/80 p-2.5 text-[11px] text-slate-300">
        <p>
          <strong className="text-slate-200">{t('common.min_predicted')}</strong>
          <span className="text-emerald-300">{getPredictedRequirement(program, t)}</span>
        </p>
        <div>
          <strong className="text-slate-200">{t('programs.subjects')}</strong>
          {subjects.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {subjects.map((subject, index) => (
                <span
                  key={`${subject}-${index}`}
                  className="rounded-md border border-indigo-800/70 bg-indigo-950/50 px-1.5 py-1 text-[10px] text-indigo-200"
                >
                  {subject}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500">
              {mandatorySubjectsLoading
                ? ` ${t('programs.checking')}`
                : mandatorySubjectsError
                  ? ` ${t('programs.subjects_unavailable')}`
                  : mandatorySubjectsNeedsDiagnosis
                    ? ` ${t('programs.finish_diagnosis')}`
                  : ` ${t('programs.no_subjects')}`}
            </span>
          )}
        </div>
        <div className="flex items-start gap-1.5">
          <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
          <p>
            <strong className="text-slate-200">{t('common.tuition')}</strong>
            {formatLocalAnnualTuition(program, t, i18n.language)}
          </p>
        </div>
        <div className="flex items-start gap-1.5">
          <SlidersHorizontal
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300"
            aria-hidden="true"
          />
          <p>
            <strong className="text-slate-200">{t('programs.work_permit')}</strong>
            {getWorkPermitOverview(program, t)}
          </p>
        </div>
        {Array.isArray(program.fit_reasons) && program.fit_reasons.length > 0 && (
          <p className="border-t border-slate-800 pt-2 text-slate-400">
            {t('programs.fit_reason')} {program.fit_reasons[0]}
          </p>
        )}
      </div>
    </article>
  )
}

export default function ProgramsView() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [countryId, setCountryId] = useState(allCountries)
  const [viewMode, setViewMode] = useState('selected')
  const {
    selectedProgramIds,
    toggleProgram,
    setActiveTab,
    isSyncingPrograms,
    isLoadingSavedPrograms,
    currentProfileId,
    diagnosisResult,
    wizardAnswers,
  } = usePlan()
  const queryClient = useQueryClient()

  const params = {}
  if (search.trim()) params.search = search.trim()
  if (countryId !== allCountries) params.country_id = countryId

  const catalogQuery = useQuery({
    queryKey: ['programs', params],
    queryFn: async () => getProgramList(await getPrograms(params), t),
  })

  const countriesQuery = useQuery({
    queryKey: ['programs', 'complete-catalog'],
    queryFn: async () => {
      const programs = []
      const pageSize = 100
      let offset = 0
      let total = Number.POSITIVE_INFINITY

      while (offset < total) {
        const response = await getPrograms({ limit: pageSize, offset })
        const page = getProgramList(response, t)
        programs.push(...page)
        total = Array.isArray(response)
          ? programs.length
          : response?.total ?? programs.length
        if (page.length < pageSize) break
        offset += page.length
      }

      return programs
    },
  })

  const canCheckMandatorySubjects =
    selectedProgramIds.length > 0 &&
    selectedProgramIds.length <= 50 &&
    (Boolean(currentProfileId) ||
      (Boolean(wizardAnswers.primaryLanguageConfirmed) &&
        Boolean(wizardAnswers.secondaryLanguageConfirmed)))
  const harmonizeQuery = useQuery({
    queryKey: ['harmonize_multi', selectedProgramIds, currentProfileId],
    queryFn: () =>
      calculateMultiScenario(
        buildHarmonizerPayload(selectedProgramIds, {
          profileId: currentProfileId,
          answers: wizardAnswers,
        }),
      ),
    enabled: canCheckMandatorySubjects,
    retry: false,
  })

  const selectedQuery = useQuery({
    queryKey: ['profile-programs', currentProfileId],
    queryFn: () => userProgramApi.getSelectedPrograms(currentProfileId),
    enabled: Boolean(currentProfileId),
  })

  const countries = useMemo(() => {
    const programs = countriesQuery.data ?? catalogQuery.data ?? []
    const uniqueCountries = new Map()

    for (const program of programs) {
      const id = getCountryId(program)
      const name = getCountryName(program, t)
      if (id !== undefined && id !== null && !uniqueCountries.has(String(id))) {
        uniqueCountries.set(String(id), name)
      }
    }

    return [...uniqueCountries].map(([id, name]) => ({ id, name }))
  }, [countriesQuery.data, catalogQuery.data, t])

  const recommendationResult =
    diagnosisResult?.recommended_programs ??
    diagnosisResult?.recommendedPrograms ??
    []
  const recommendedPrograms = Array.isArray(recommendationResult)
    ? recommendationResult
    : []
  const allCatalogPrograms =
    countriesQuery.data ?? catalogQuery.data ?? []
  const selectedDetails = selectedQuery.data ?? []
  const detailsById = new Map(
    selectedDetails.map((program) => [getProgramId(program), program]),
  )
  const catalogById = new Map(
    allCatalogPrograms.map((program) => [getProgramId(program), program]),
  )
  const recommendedById = new Map(
    (Array.isArray(recommendedPrograms) ? recommendedPrograms : []).map(
      (program) => {
        const programId = getProgramId(program)
        return [
          programId,
          mergeProgramDetails(program, catalogById.get(programId)),
        ]
      },
    ),
  )

  const selectedPrograms = selectedProgramIds.map((id) => {
    const catalogProgram = catalogById.get(id)
    const selectedDetail = detailsById.get(id)
    if (catalogProgram) {
      return mergeProgramDetails(selectedDetail ?? {}, catalogProgram)
    }
    return (
      selectedDetail ??
      recommendedById.get(id) ?? {
        program_id: id,
        name_cn: id,
        university_name: t('programs.details_unavailable'),
      }
    )
  })
  const enrichedRecommendations = recommendedPrograms.map((program) => {
    const programId = getProgramId(program)
    return mergeProgramDetails(program, catalogById.get(programId))
  })
  const recommendationProgramIds = [
    ...new Set(
      enrichedRecommendations
        .map(getProgramId)
        .filter((id) => typeof id === 'string' && id.trim()),
    ),
  ]
  const additionalRecommendationIds = recommendationProgramIds.filter(
    (id) => !selectedProgramIds.includes(id),
  )
  const recommendationHarmonizerQuery = useQuery({
    queryKey: [
      'harmonize_recommended_programs',
      recommendationProgramIds,
      currentProfileId,
    ],
    queryFn: async () => {
      const responses = await Promise.all(
        splitIntoChunks(additionalRecommendationIds, 50).map((programIds) =>
          calculateMultiScenario(
            buildHarmonizerPayload(programIds, {
              profileId: currentProfileId,
              answers: wizardAnswers,
            }),
          ),
        ),
      )
      return mergeHarmonizerScenarios(responses)
    },
    enabled:
      viewMode === 'recommended' &&
      additionalRecommendationIds.length > 0 &&
      (Boolean(currentProfileId) ||
        (Boolean(wizardAnswers.primaryLanguageConfirmed) &&
          Boolean(wizardAnswers.secondaryLanguageConfirmed))),
    retry: false,
  })
  const recommendationHarmonizeData = mergeHarmonizerScenarios([
    harmonizeQuery.data ?? {},
    recommendationHarmonizerQuery.data ?? {},
  ])
  const filteredCatalog = (catalogQuery.data ?? []).filter((program) =>
    matchesFilters(program, search, countryId, t, i18n.language),
  )
  const filteredRecommendations = enrichedRecommendations.filter((program) =>
    matchesFilters(program, search, countryId, t, i18n.language),
  )
  const visiblePrograms =
    viewMode === 'selected'
      ? selectedPrograms
      : viewMode === 'recommended'
        ? filteredRecommendations
        : filteredCatalog
  const currentQuery =
    viewMode === 'selected' ? selectedQuery : catalogQuery
  const mandatorySubjectsQuery =
    viewMode === 'recommended' ? recommendationHarmonizerQuery : harmonizeQuery
  const mandatorySubjectsData =
    viewMode === 'recommended'
      ? recommendationHarmonizeData
      : harmonizeQuery.data

  async function handleToggleProgram(programId) {
    const result = await toggleProgram(programId)
    if (result?.success && currentProfileId) {
      await queryClient.invalidateQueries({
        queryKey: ['profile-programs', currentProfileId],
      })
    }
  }

  return (
    <section className="space-y-4 pb-24" aria-labelledby="programs-heading">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t('programs.section')}
          </p>
          <h2 id="programs-heading" className="mt-1 text-lg font-bold text-white">
            {t('programs.title')}
          </h2>
        </div>

        <div
          className="grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1"
          role="tablist"
          aria-label={t('programs.list_type')}
        >
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={viewMode === mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`rounded-lg px-2 py-2 text-[11px] font-semibold transition active:scale-95 ${
                viewMode === mode.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(`programs.${mode.id}`)}
              {mode.id === 'selected' && ` (${selectedProgramIds.length})`}
            </button>
          ))}
        </div>

        {viewMode !== 'selected' && (
          <>
            <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 focus-within:border-indigo-500">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="sr-only">{t('common.search')}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('common.search')}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <div
              className="flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-label={t('programs.country_filter')}
            >
              <button
                type="button"
                onClick={() => setCountryId(allCountries)}
                aria-pressed={countryId === allCountries}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition active:scale-95 ${
                  countryId === allCountries
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {t('common.all_countries')}
              </button>
              {countries.map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => setCountryId(country.id)}
                  aria-pressed={countryId === country.id}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition active:scale-95 ${
                    countryId === country.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {(catalogQuery.isPending && viewMode !== 'selected') ||
      (selectedQuery.isPending && viewMode === 'selected' && currentProfileId) ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t(viewMode === 'selected' ? 'programs.loading_selected' : 'programs.loading_catalog')}
        </div>
      ) : null}

      {currentQuery.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p>{t(viewMode === 'selected' ? 'programs.selected_error' : 'programs.catalog_error')}</p>
            <p className="mt-1 text-xs text-red-300">
              {currentQuery.error instanceof Error
                ? currentQuery.error.message
                : t('errors.request_failed')}
            </p>
            <button
              type="button"
              onClick={() => currentQuery.refetch()}
              className="mt-2 rounded-lg border border-red-700 px-2.5 py-1 text-xs transition hover:bg-red-900/50"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'recommended' &&
        recommendedPrograms.length === 0 &&
        !currentProfileId && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
            <GraduationCap className="mx-auto h-6 w-6 text-slate-500" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-300">{t('programs.empty_title')}</p>
            <p className="mt-1 text-xs text-slate-500">
              {t('programs.empty_body')}
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('wizard')}
              className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
            >
              {t('programs.go_wizard')}
            </button>
          </div>
        )}

      {viewMode === 'recommended' &&
        recommendedPrograms.length === 0 &&
        currentProfileId && (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
            {t('programs.no_snapshot')}
          </p>
        )}

      {viewMode === 'selected' &&
        !selectedQuery.isPending &&
        !selectedQuery.isError &&
        selectedPrograms.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-10 text-center">
            <ListChecks className="mx-auto h-7 w-7 text-slate-500" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-slate-300">{t('programs.no_saved')}</p>
            <p className="mt-1 text-xs text-slate-500">
              {t('programs.no_saved_hint')}
            </p>
            <button
              type="button"
              onClick={() => setViewMode(diagnosisResult ? 'recommended' : 'catalog')}
              className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
            >
              {diagnosisResult ? t('programs.recommended') : t('programs.browse')}
            </button>
          </div>
        )}

      {visiblePrograms.length === 0 &&
        (viewMode === 'catalog' ||
          (viewMode === 'recommended' && recommendedPrograms.length > 0)) &&
        !catalogQuery.isPending &&
        !catalogQuery.isError && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-10 text-center">
            <GraduationCap className="mx-auto h-7 w-7 text-slate-500" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-slate-300">{t('programs.empty_catalog')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('programs.empty_catalog_hint')}</p>
          </div>
        )}

      {visiblePrograms.length > 0 && (
        <div className="space-y-3">
          {visiblePrograms.map((program, index) => {
            const programId = getProgramId(program)
            const selected = selectedProgramIds.includes(programId)

            return (
              <ProgramCard
                key={programId ?? `${getProgramName(program, t, i18n.language)}-${index}`}
                program={program}
                harmonizeData={mandatorySubjectsData}
                mandatorySubjectsLoading={mandatorySubjectsQuery.isFetching}
                mandatorySubjectsError={mandatorySubjectsQuery.isError}
                mandatorySubjectsNeedsDiagnosis={!canCheckMandatorySubjects}
                selected={selected}
                disabled={isSyncingPrograms || isLoadingSavedPrograms}
                onToggle={handleToggleProgram}
              />
            )
          })}
        </div>
      )}

      <aside className="fixed inset-x-0 bottom-14 z-30 mx-auto max-w-md px-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-700/60 bg-slate-900/95 px-3.5 py-2.5 shadow-xl shadow-black/30 backdrop-blur">
          <div>
            <p className="text-xs font-semibold text-white">{t('programs.cart_title')}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {t('programs.cart_count', { count: selectedProgramIds.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('harmonizer')}
            className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-500 active:scale-95"
          >
            {t('programs.go_harmonizer')}
          </button>
        </div>
      </aside>
    </section>
  )
}
