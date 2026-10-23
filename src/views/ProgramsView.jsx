import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { getPrograms } from '../api/dictionary.js'
import { userProgramApi } from '../api/userPrograms.js'
import { usePlan } from '../context/PlanContext.jsx'

const allCountries = 'all'
const viewModes = [
  { id: 'selected', label: '已选志愿' },
  { id: 'recommended', label: '向导推荐' },
  { id: 'catalog', label: '全部专业' },
]

function getProgramList(response) {
  const programs = Array.isArray(response)
    ? response
    : response?.items ?? response?.programs

  if (!Array.isArray(programs)) {
    throw new TypeError('专业接口返回的数据格式无效：预期为专业列表。')
  }

  return programs
}

function getProgramId(program) {
  return program.program_id ?? program.programId ?? program.id
}

function getProgramName(program) {
  return (
    program.name_cn ??
    program.program_name_zh ??
    program.program_name ??
    program.programName ??
    program.name_en ??
    getProgramId(program) ??
    '专业名称待补充'
  )
}

function getUniversityName(program) {
  return (
    program.university_name ??
    program.universityName ??
    program.uniName ??
    '院校信息待补充'
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

function getCountryName(program) {
  return program.country_name ?? program.countryName ?? program.country ?? '其他国家'
}

function getMandatorySubjects(program) {
  const subjects =
    program.mandatory_courses ??
    program.mandatoryCourses ??
    program.mandatory_subjects ??
    program.mandatorySubjects ??
    program.admission_requirements?.mandatory_courses ??
    program.admissionReqs?.mandatoryCourses ??
    []

  if (!Array.isArray(subjects)) return []

  return subjects
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
}

function getPredictedRequirement(program) {
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
    return `${recommended ? '建议' : '最低'}预估分 ${score}+`
  }
  return '暂无门槛数据'
}

function formatAnnualCost(value) {
  if (value === undefined || value === null || value === '') return '暂无开销数据'
  if (typeof value === 'number') return `约 ¥${value.toLocaleString('zh-CN')} / 年`
  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim())) {
    return `约 ¥${Number(value).toLocaleString('zh-CN')} / 年`
  }
  return value
}

function getWorkPermitOverview(program) {
  const overview =
    program.visa_work ??
    program.visaWork ??
    program.work_permit_overview ??
    program.workPermitOverview

  if (overview) return overview
  if (program.coop_available === true || program.coopAvailable === true) {
    return '提供 Co-op 带薪实习；毕业工签政策请以目的地官方规定为准。'
  }
  if (program.coop_available === false || program.coopAvailable === false) {
    return '暂无 Co-op；毕业工签政策请以目的地官方规定为准。'
  }
  return '暂无工签数据，请以院校及目的地官方政策为准。'
}

function matchesFilters(program, search, countryId) {
  const query = search.trim().toLocaleLowerCase()
  const matchesSearch =
    !query ||
    `${getProgramName(program)} ${getUniversityName(program)} ${getCountryName(program)}`
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
  selected,
  disabled,
  onToggle,
  removable = true,
}) {
  const subjects = getMandatorySubjects(program)
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
            <h3 className="text-sm font-bold text-white">{getProgramName(program)}</h3>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              {program.flag_emoji ?? program.flagEmoji ?? ''} {getCountryName(program)}
            </span>
          </div>
          <p className="mt-1 text-xs text-indigo-300">{getUniversityName(program)}</p>
        </div>

        {removable && programId && (
          <button
            type="button"
            onClick={() => onToggle(programId)}
            disabled={disabled}
            aria-pressed={selected}
            aria-label={`${selected ? '移出' : '加入'}志愿车：${getProgramName(program)}`}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {selected ? (
              <>
                <Check className="h-3 w-3" aria-hidden="true" />
                已选择
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" aria-hidden="true" />
                加入
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2 rounded-xl bg-slate-950/80 p-2.5 text-[11px] text-slate-300">
        <p>
          <strong className="text-slate-200">门槛预估分：</strong>
          <span className="text-emerald-300">{getPredictedRequirement(program)}</span>
        </p>
        <div>
          <strong className="text-slate-200">必修科目：</strong>
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
            <span className="text-slate-500"> 暂无数据</span>
          )}
        </div>
        <div className="flex items-start gap-1.5">
          <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
          <p>
            <strong className="text-slate-200">折合年开销：</strong>
            {formatAnnualCost(
              program.est_annual_rmb ??
                program.est_total_rmb_per_year ??
                program.est_total_rmb ??
                program.totalAnnualRmb ??
                program.annual_cost_rmb,
            )}
          </p>
        </div>
        <div className="flex items-start gap-1.5">
          <SlidersHorizontal
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300"
            aria-hidden="true"
          />
          <p>
            <strong className="text-slate-200">工签 / 实习：</strong>
            {getWorkPermitOverview(program)}
          </p>
        </div>
        {Array.isArray(program.fit_reasons) && program.fit_reasons.length > 0 && (
          <p className="border-t border-slate-800 pt-2 text-slate-400">
            推荐理由：{program.fit_reasons[0]}
          </p>
        )}
      </div>
    </article>
  )
}

export default function ProgramsView() {
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
  } = usePlan()
  const queryClient = useQueryClient()

  const params = {}
  if (search.trim()) params.search = search.trim()
  if (countryId !== allCountries) params.country_id = countryId

  const catalogQuery = useQuery({
    queryKey: ['programs', params],
    queryFn: async () => getProgramList(await getPrograms(params)),
  })

  const countriesQuery = useQuery({
    queryKey: ['programs', 'country-options'],
    queryFn: async () => getProgramList(await getPrograms()),
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
      const name = getCountryName(program)
      if (id !== undefined && id !== null && !uniqueCountries.has(String(id))) {
        uniqueCountries.set(String(id), name)
      }
    }

    return [...uniqueCountries].map(([id, name]) => ({ id, name }))
  }, [countriesQuery.data, catalogQuery.data])

  const recommendedPrograms =
    diagnosisResult?.recommended_programs ??
    diagnosisResult?.recommendedPrograms ??
    []
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
      (program) => [getProgramId(program), program],
    ),
  )

  const selectedPrograms = selectedProgramIds.map(
    (id) =>
      detailsById.get(id) ??
      catalogById.get(id) ??
      recommendedById.get(id) ?? {
        program_id: id,
        name_cn: id,
        university_name: '专业详情暂不可用',
      },
  )
  const filteredCatalog = (catalogQuery.data ?? []).filter((program) =>
    matchesFilters(program, search, countryId),
  )
  const filteredRecommendations = (
    Array.isArray(recommendedPrograms) ? recommendedPrograms : []
  ).filter((program) => matchesFilters(program, search, countryId))
  const visiblePrograms =
    viewMode === 'selected'
      ? selectedPrograms
      : viewMode === 'recommended'
        ? filteredRecommendations
        : filteredCatalog
  const currentQuery =
    viewMode === 'selected' ? selectedQuery : catalogQuery

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
            志愿车与专业库
          </p>
          <h2 id="programs-heading" className="mt-1 text-lg font-bold text-white">
            查看和管理目标专业
          </h2>
        </div>

        <div
          className="grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1"
          role="tablist"
          aria-label="专业列表类型"
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
              {mode.label}
              {mode.id === 'selected' && ` (${selectedProgramIds.length})`}
            </button>
          ))}
        </div>

        {viewMode !== 'selected' && (
          <>
            <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 focus-within:border-indigo-500">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="sr-only">搜索大学或专业</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索大学或专业"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <div
              className="flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-label="按国家筛选"
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
                全部国家
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
          {viewMode === 'selected' ? '正在加载已选志愿…' : '正在加载专业列表…'}
        </div>
      ) : null}

      {currentQuery.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p>{viewMode === 'selected' ? '已选志愿加载失败。' : '专业列表加载失败。'}</p>
            <p className="mt-1 text-xs text-red-300">
              {currentQuery.error instanceof Error
                ? currentQuery.error.message
                : '请稍后重试。'}
            </p>
            <button
              type="button"
              onClick={() => currentQuery.refetch()}
              className="mt-2 rounded-lg border border-red-700 px-2.5 py-1 text-xs transition hover:bg-red-900/50"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {viewMode === 'recommended' &&
        recommendedPrograms.length === 0 &&
        !currentProfileId && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
            <GraduationCap className="mx-auto h-6 w-6 text-slate-500" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-300">暂无向导推荐专业</p>
            <p className="mt-1 text-xs text-slate-500">
              完成智能向导诊断后，推荐结果会显示在这里。
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('wizard')}
              className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
            >
              前往智能向导
            </button>
          </div>
        )}

      {viewMode === 'recommended' &&
        recommendedPrograms.length === 0 &&
        currentProfileId && (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
            该画像没有保存推荐专业快照，请重新完成向导诊断。
          </p>
        )}

      {viewMode === 'selected' &&
        !selectedQuery.isPending &&
        !selectedQuery.isError &&
        selectedPrograms.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-10 text-center">
            <ListChecks className="mx-auto h-7 w-7 text-slate-500" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-slate-300">志愿车还没有专业</p>
            <p className="mt-1 text-xs text-slate-500">
              可以从向导推荐或全部专业中添加。
            </p>
            <button
              type="button"
              onClick={() => setViewMode(diagnosisResult ? 'recommended' : 'catalog')}
              className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
            >
              {diagnosisResult ? '查看向导推荐' : '浏览全部专业'}
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
            <p className="mt-2 text-sm font-medium text-slate-300">没有找到匹配的专业</p>
            <p className="mt-1 text-xs text-slate-500">试试更换国家或搜索关键词。</p>
          </div>
        )}

      {visiblePrograms.length > 0 && (
        <div className="space-y-3">
          {visiblePrograms.map((program, index) => {
            const programId = getProgramId(program)
            const selected = selectedProgramIds.includes(programId)

            return (
              <ProgramCard
                key={programId ?? `${getProgramName(program)}-${index}`}
                program={program}
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
            <p className="text-xs font-semibold text-white">志愿车已选</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {selectedProgramIds.length} 个专业
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('harmonizer')}
            className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-500 active:scale-95"
          >
            直达排课调和
          </button>
        </div>
      </aside>
    </section>
  )
}
