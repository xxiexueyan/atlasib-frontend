import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Minus,
  Target,
} from 'lucide-react'
import { getPrograms } from '../api/dictionary.js'
import { calculateHarmonizedPlan } from '../api/harmonizer.js'
import {
  getHarmonizerErrorMessage,
  getLanguageDowngradeWarnings,
  getRecommendedSubjectMatrix,
} from '../api/harmonizerData.js'
import {
  getExplicitLanguagePayload,
  getLanguagePayload,
} from '../api/language.js'
import { userProgramApi } from '../api/userPrograms.js'
import { usePlan } from '../context/PlanContext.jsx'

const subjectGuides = {
  MATH_AA: {
    name: '数学 AA',
    role: '数学推理与分析能力是计算机、工程等专业的重要基础。',
    pitfall: '不要只刷熟悉题型；留意无计算器题、书写步骤和内部评估（IA）的评分要求。',
    actions: [
      '分主题整理错题，注明错误类型、正确思路和复盘日期。',
      '交替练习代数、函数、三角、微积分等题型，并定期限时完成整卷。',
      'IA 选题应范围明确、数学过程可解释；提前按评分标准检查论证与反思。',
    ],
  },
  PHYSICS: {
    name: '物理',
    role: '工程及理工方向常见的基础学科，帮助建立定量建模能力。',
    pitfall: '只背公式容易在陌生情境题失分；作答时还需说明模型、单位和物理含义。',
    actions: [
      '按主题制作公式与概念表，练习从题目条件判断适用模型。',
      '完成实验题时规范记录变量、误差、不确定度及数据结论。',
      '练习历年题并对照评分标准，逐项检查单位、有效数字和解释。',
    ],
  },
  CHEMISTRY: {
    name: '化学',
    role: '部分工程和自然科学专业的先修科目，选课前确认目标专业要求。',
    pitfall: '公式、概念和有机反应需要持续复习；IA 要注意变量控制与数据质量。',
    actions: [
      '为反应类型、官能团和核心概念建立分主题复习卡。',
      '定期练习化学计量、平衡和数据分析题，写出完整推导。',
      'IA 提前确认实验可行性，记录原始数据并解释误差来源。',
    ],
  },
  CS: {
    name: '计算机科学',
    role: '通过编程、系统和算法知识展示计算思维与应用能力。',
    pitfall: 'IA 不能只展示成品；要清楚体现真实用户需求、开发过程和测试反馈。',
    actions: [
      '将抽象概念与小型代码练习结合，注重解释数据结构及算法选择。',
      '做 IA 时记录用户沟通、需求变化、测试用例和迭代过程。',
      '复习案例研究时练习把技术影响、限制与伦理考量联系起来。',
    ],
  },
}

function normalizeList(value) {
  if (Array.isArray(value)) return value
  return []
}

function getDisplaySubjects(subjects) {
  return [...subjects].sort((left, right) => {
    const getGroupOrder = (subject) => {
      const group = Number(subject.group_number ?? subject.groupNumber)
      return group === 1 ? 0 : group === 2 ? 1 : 2
    }
    return getGroupOrder(left) - getGroupOrder(right)
  })
}

function getConflictText(conflict, key, fallback) {
  const value = conflict?.[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

function getConflictProgramIds(conflict, selectedIds) {
  const ids =
    conflict?.affected_program_ids ??
    conflict?.conflicting_program_ids ??
    conflict?.involved_program_ids ??
    conflict?.program_ids ??
    conflict?.affected_programs ??
    conflict?.involved_programs

  if (!Array.isArray(ids)) return selectedIds

  const normalizedIds = ids
    .map((item) =>
      typeof item === 'string'
        ? item
        : item?.program_id ?? item?.programId ?? item?.id,
    )
    .filter((id) => typeof id === 'string')

  const selectedSet = new Set(selectedIds)
  const matchingIds = normalizedIds.filter((id) => selectedSet.has(id))
  return matchingIds.length > 0 ? matchingIds : selectedIds
}

function getProgramName(program) {
  const name =
    program?.program_name ??
    program?.name_cn ??
    program?.program_name_zh ??
    program?.programName ??
    program?.name_en
  const university =
    program?.university_name ?? program?.universityName ?? program?.uniName

  if (university && name) return `${university} · ${name}`
  return name ?? university ?? program?.program_id ?? program?.id
}

function getSubjectGuide(subject) {
  const code = subject.subject_code ?? subject.subjectCode
  return subjectGuides[code] ?? {
    name: subject.subject_name ?? subject.subjectName ?? 'IB 科目',
    role: '根据当前选课方案中的目标要求进行针对性准备。',
    pitfall: '目标分及课程难度应结合学校课程大纲和教师反馈持续调整。',
    actions: [
      '拆分知识点，制定每周复习与练习计划。',
      '完成阶段练习后对照评分标准订正并整理错题。',
      '提前规划内部评估任务，按节点向任课教师确认反馈。',
    ],
  }
}

export default function HarmonizerView() {
  const {
    selectedProgramIds,
    setActiveTab,
    toggleProgram,
    currentProfileId,
    wizardAnswers,
    diagnosisResult,
    isSyncingPrograms,
  } = usePlan()
  const languagePayload = getLanguagePayload(wizardAnswers)
  const hasExplicitLanguages = Boolean(
    getExplicitLanguagePayload(wizardAnswers),
  )

  const query = useQuery({
    queryKey: [
      'harmonized-plan',
      selectedProgramIds,
      currentProfileId,
      languagePayload,
    ],
    queryFn: () =>
      calculateHarmonizedPlan(selectedProgramIds, {
        profileId: currentProfileId,
        answers: wizardAnswers,
      }),
    enabled:
      selectedProgramIds.length > 0 &&
      (Boolean(currentProfileId) || hasExplicitLanguages),
  })

  const selectedProgramsQuery = useQuery({
    queryKey: ['profile-programs', currentProfileId],
    queryFn: () => userProgramApi.getSelectedPrograms(currentProfileId),
    enabled: Boolean(currentProfileId),
  })

  const catalogQuery = useQuery({
    queryKey: ['programs', 'harmonizer-labels'],
    queryFn: async () => {
      const response = await getPrograms({ limit: 100 })
      return Array.isArray(response)
        ? response
        : response?.items ?? response?.programs ?? []
    },
    enabled: !currentProfileId,
  })

  const programDetails = new Map()
  for (const program of selectedProgramsQuery.data ?? []) {
    programDetails.set(
      program.program_id ?? program.programId ?? program.id,
      program,
    )
  }
  for (const program of diagnosisResult?.recommended_programs ?? []) {
    const id = program.program_id ?? program.programId ?? program.id
    if (!programDetails.has(id)) programDetails.set(id, program)
  }
  for (const program of catalogQuery.data ?? []) {
    const id = program.program_id ?? program.programId ?? program.id
    if (!programDetails.has(id)) programDetails.set(id, program)
  }

  async function removeProgramFromConflict(programId) {
    const result = await toggleProgram(programId)
    if (result?.success && currentProfileId) {
      await selectedProgramsQuery.refetch()
    }
  }

  const plan = query.data
  const conflicts = normalizeList(plan?.conflicts)
  const warnings = normalizeList(plan?.warnings)
  const subjects = getRecommendedSubjectMatrix(plan)
  const displaySubjects = getDisplaySubjects(subjects)
  const languageDowngradeWarnings = getLanguageDowngradeWarnings(warnings)
  const otherWarnings = warnings.filter(
    (warning) =>
      (warning?.rule_code ?? warning?.ruleCode) !==
      'SECOND_LANGUAGE_HL_DOWNGRADED',
  )
  const courseValidation = plan?.course_validation

  if (selectedProgramIds.length === 0) {
    return (
      <section className="rounded-2xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
        志愿车暂无专业，无法生成排课方案。
        <button
          type="button"
          onClick={() => setActiveTab('programs')}
          className="ml-2 font-semibold text-cyan-300 underline underline-offset-2"
        >
          去选择专业
        </button>
      </section>
    )
  }

  if (!currentProfileId && !hasExplicitLanguages) {
    return (
      <section className="space-y-3 rounded-2xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-100">
        <h2 className="font-bold">请先完成诊断</h2>
        <p className="text-xs leading-relaxed text-amber-200/90">
          排课需要诊断画像 ID，或明确提供第一语言和第二语言。请先完成智能向导，保存画像语言偏好后再生成排课方案。
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('wizard')}
          className="rounded-lg border border-amber-700 px-3 py-2 text-xs font-semibold transition hover:bg-amber-900/50"
        >
          前往智能向导
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-4 pb-24" aria-labelledby="harmonizer-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          多志愿倒推与冲突检测
        </p>
        <h2 id="harmonizer-heading" className="mt-1 text-lg font-bold text-white">
          IB 选课调和方案
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          正在依据志愿车中的 {selectedProgramIds.length} 个专业统筹课程要求。
        </p>
      </div>

      {query.isPending && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          正在倒推选课方案…
        </div>
      )}

      {query.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">排课方案加载失败</p>
            <p className="mt-1 text-xs leading-relaxed text-red-300">
              {getHarmonizerErrorMessage(query.error)}
            </p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-2 rounded-lg border border-red-700 px-2.5 py-1 text-xs transition hover:bg-red-900/50"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {query.isSuccess && plan && (
        <>
          <div className="space-y-3 rounded-2xl border border-indigo-600/40 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/40 p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <h3 className="text-xs font-bold text-indigo-200">统筹目标分</h3>
            </div>
            <div className="flex items-end justify-between gap-3">
              <p className="text-sm text-slate-300">最高预估分基准</p>
              <p className="text-3xl font-black text-emerald-300">
                {plan.target_ib_score ?? '—'}
                <span className="ml-1 text-sm font-semibold">分</span>
              </p>
            </div>
            {plan.strictest_program && (
              <p className="border-t border-slate-700/70 pt-2 text-xs text-slate-400">
                门槛最高的志愿：{plan.strictest_program}
              </p>
            )}
            {plan.hl_count !== undefined && (
              <p className="text-xs text-slate-400">
                方案涉及 {plan.hl_count} 门 HL 科目
              </p>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('programs')}
              className="text-xs font-semibold text-cyan-300 underline underline-offset-2"
            >
              调整志愿组合
            </button>
          </div>

          {conflicts.length > 0 && (
            <section
              aria-labelledby="conflicts-heading"
              className="space-y-2"
              aria-live="polite"
            >
              <h3
                id="conflicts-heading"
                className="flex items-center gap-1.5 text-xs font-bold text-red-300"
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                严重选课冲突：请优先查看解决方案
              </h3>
              {conflicts.map((conflict, index) => (
                (() => {
                  const conflictProgramIds = getConflictProgramIds(
                    conflict,
                    selectedProgramIds,
                  )
                  const hasSpecificProgramIds = [
                    conflict?.affected_program_ids,
                    conflict?.conflicting_program_ids,
                    conflict?.involved_program_ids,
                    conflict?.program_ids,
                    conflict?.affected_programs,
                    conflict?.involved_programs,
                  ].some(
                    (ids) =>
                      Array.isArray(ids) &&
                      ids.some(
                        (item) =>
                          typeof item === 'string' ||
                          typeof item?.program_id === 'string' ||
                          typeof item?.programId === 'string' ||
                          typeof item?.id === 'string',
                      ),
                  )

                  return (
                    <article
                      key={conflict.rule_code ?? conflict.ruleCode ?? `${conflict.title}-${index}`}
                      className="space-y-2.5 rounded-2xl border border-red-800 bg-red-950/40 p-3.5"
                    >
                      <h4 className="flex items-center gap-1.5 text-sm font-bold text-red-200">
                        <CircleAlert className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                        {getConflictText(conflict, 'title', '存在选课冲突')}
                      </h4>
                      <p className="text-xs leading-relaxed text-red-100/90">
                        {getConflictText(conflict, 'description', '请核对各目标专业的课程要求。')}
                      </p>
                      <div className="rounded-xl border border-emerald-800/70 bg-slate-950/90 p-3">
                        <p className="mb-1 text-xs font-bold text-emerald-300">
                          解冲突方案
                        </p>
                        <p className="whitespace-pre-line text-xs leading-relaxed text-slate-200">
                          {getConflictText(
                            conflict,
                            'solution',
                            '暂无自动建议，请向升学顾问或 IB 协调员核实。',
                          )}
                        </p>
                      </div>
                      <div className="space-y-2 rounded-xl border border-red-900/70 bg-red-950/30 p-3">
                        <div>
                          <p className="text-xs font-bold text-red-200">
                            {hasSpecificProgramIds
                              ? '涉及的志愿专业'
                              : '当前触发冲突的志愿组合'}
                          </p>
                          <p className="mt-1 text-[10px] leading-relaxed text-red-200/70">
                            {hasSpecificProgramIds
                              ? '可直接移除不打算申请的专业，系统会按剩余志愿重新计算。'
                              : '后端尚未标注具体冲突专业，因此先列出当前参与倒推的志愿；移除后系统会重新检测。'}
                          </p>
                        </div>
                        {conflictProgramIds.map((programId) => {
                          const program = programDetails.get(programId)
                          return (
                            <div
                              key={programId}
                              className="flex items-center justify-between gap-2 rounded-lg border border-red-900/60 bg-slate-950/80 px-2.5 py-2"
                            >
                              <p className="min-w-0 text-[11px] font-medium text-slate-200">
                                {getProgramName(program) ?? programId}
                              </p>
                              <button
                                type="button"
                                disabled={isSyncingPrograms || selectedProgramIds.length <= 1}
                                onClick={() => removeProgramFromConflict(programId)}
                                className="flex shrink-0 items-center gap-1 rounded-lg border border-red-800 bg-red-950/60 px-2 py-1 text-[10px] font-semibold text-red-200 transition hover:bg-red-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Minus className="h-3 w-3" aria-hidden="true" />
                                移除
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </article>
                  )
                })()
              ))}
            </section>
          )}

          {languageDowngradeWarnings.map((warning, index) => (
            <aside
              key={`language-hl-downgrade-${index}`}
              role="status"
              className="space-y-1 rounded-xl border border-amber-700 bg-amber-950/40 p-3 text-amber-100"
            >
              <h3 className="text-xs font-bold">
                {getConflictText(
                  warning,
                  'title',
                  '第二语言已协调降为 SL',
                )}
              </h3>
              <p className="whitespace-pre-line text-xs leading-relaxed text-amber-200">
                {warning.description ??
                  warning.message ??
                  warning.solution ??
                  '因其他核心课程已占用 HL 名额，第二语言已自动协调为 SL。'}
              </p>
            </aside>
          ))}

          {otherWarnings.length > 0 && (
            <section aria-labelledby="warnings-heading" className="space-y-2">
              <h3
                id="warnings-heading"
                className="flex items-center gap-1.5 text-xs font-bold text-amber-300"
              >
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                院校特殊要求与避坑提醒
              </h3>
              {otherWarnings.map((warning, index) => (
                <article
                  key={warning.rule_code ?? warning.ruleCode ?? `${warning.title}-${index}`}
                  className="space-y-1.5 rounded-xl border border-amber-800 bg-amber-950/30 p-3"
                >
                  <h4 className="text-xs font-bold text-amber-200">
                    {getConflictText(warning, 'title', '院校特殊要求')}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {getConflictText(warning, 'description', '请查看目标院校的官方要求。')}
                  </p>
                  {warning.solution && (
                    <p className="whitespace-pre-line rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-xs leading-relaxed text-cyan-200">
                      <strong>建议应对：</strong> {warning.solution}
                    </p>
                  )}
                </article>
              ))}
            </section>
          )}

          <section
            aria-labelledby="subjects-heading"
            className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <h3 id="subjects-heading" className="text-xs font-bold text-white">
                推荐的 6 门 IB 选课矩阵
              </h3>
            </div>
            <p className="rounded-lg border border-cyan-900/70 bg-cyan-950/30 p-2.5 text-[11px] leading-relaxed text-cyan-100">
              根据 IB 官方规范，高中阶段必须同时修读两门语言（母语 + 二外），缺一将无法核发正式 IB 国际文凭。
            </p>
            {courseValidation && (
              <div
                className={`space-y-1 rounded-lg border p-2.5 text-[11px] ${
                  courseValidation.language_requirements_met
                    ? 'border-emerald-800 bg-emerald-950/30 text-emerald-200'
                    : 'border-red-800 bg-red-950/40 text-red-200'
                }`}
                role={
                  courseValidation.language_requirements_met
                    ? 'status'
                    : 'alert'
                }
              >
                <p className="font-bold">
                  {courseValidation.language_requirements_met
                    ? '语言组完整性：符合要求'
                    : '语言组完整性：未通过校验'}
                </p>
                <p>
                  Group 1：{courseValidation.language_group_1_count ?? 0} 门；
                  Group 2：{courseValidation.language_group_2_count ?? 0} 门
                </p>
                {courseValidation.group_4_science_count !== undefined && (
                  <p>
                    Group 4 理科：{courseValidation.group_4_science_count} 门
                    {courseValidation.science_slot_limit_met === false &&
                      '（超过建议槽位）'}
                  </p>
                )}
              </div>
            )}

            {displaySubjects.length > 0 ? (
              <div className="space-y-2">
                {displaySubjects.map((subject, index) => {
                  const groupNumber = Number(
                    subject.group_number ?? subject.groupNumber,
                  )
                  const languageGroup =
                    groupNumber === 1
                      ? '第 1 组 · 母语研究'
                      : groupNumber === 2
                        ? '第 2 组 · 语言习得'
                        : null
                  const groupName =
                    subject.group_name ?? subject.groupName ?? '学科组待确认'
                  const name =
                    subject.subject_name ??
                    subject.subjectName ??
                    subject.subject_code ??
                    `推荐科目 ${index + 1}`
                  const level = subject.level ?? '待确认'
                  const targetGrade =
                    subject.target_grade ?? subject.targetGrade ?? '待确认'
                  const sources = normalizeList(
                    subject.requested_by ?? subject.requestedBy,
                  )

                  return (
                    <article
                      key={
                        subject.subject_code ??
                        subject.subjectCode ??
                        `${name}-${index}`
                      }
                      className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-indigo-200">
                            {index + 1}. {name}
                          </h4>
                          <span className="mt-1 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                            Group {Number.isFinite(groupNumber) ? groupNumber : '—'} · {groupName}
                          </span>
                          {languageGroup && (
                            <span className="mt-1 inline-block rounded bg-cyan-950/70 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">
                              {languageGroup}
                            </span>
                          )}
                          {subject.is_mandatory && (
                            <span className="mt-1 inline-block rounded bg-red-950/60 px-1.5 py-0.5 text-[10px] text-red-200">
                              必修
                            </span>
                          )}
                        </div>
                        <span className="rounded-md border border-cyan-800 bg-cyan-950/60 px-2 py-1 text-[11px] font-bold text-cyan-200">
                          {level} · 目标 {targetGrade}
                        </span>
                      </div>
                      {sources.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {sources.map((source, sourceIndex) => (
                            <span
                              key={`${source}-${sourceIndex}`}
                              className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-slate-300"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500">
                          暂无提出要求的院校信息
                        </p>
                      )}
                    </article>
                  )
                })}
                {displaySubjects.length !== 6 && (
                  <p className="text-[11px] text-amber-300">
                    当前可展示 {displaySubjects.length} 门科目；完整六科组合请结合学校 IB 课程设置确认。
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                接口暂未返回选课矩阵，请重试或检查志愿专业的要求数据。
              </p>
            )}
          </section>

          <section
            aria-labelledby="guides-heading"
            className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <h3 id="guides-heading" className="text-xs font-bold text-white">
                单科保姆级提分指南
              </h3>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              按统筹方案中的科目目标分开展复习。具体学习节奏请结合任课教师反馈调整。
            </p>
            {displaySubjects.length > 0 ? (
              <div className="space-y-2">
                {displaySubjects.map((subject, index) => {
                  const guide = getSubjectGuide(subject)
                  const code =
                    subject.subject_code ?? subject.subjectCode ?? `subject-${index}`
                  const grade =
                    subject.target_grade ?? subject.targetGrade ?? '待确认'

                  return (
                    <details
                      key={`${code}-guide`}
                      className="group rounded-xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <summary className="cursor-pointer list-none text-xs font-semibold text-cyan-200 marker:hidden">
                        <span className="flex items-center justify-between gap-2">
                          {guide.name} · 目标 {grade}
                          <span className="text-slate-500 transition group-open:rotate-180">
                            ⌄
                          </span>
                        </span>
                      </summary>
                      <div className="mt-3 space-y-2 text-[11px] leading-relaxed">
                        <p className="text-slate-300">{guide.role}</p>
                        <p className="rounded-lg border border-amber-900/70 bg-amber-950/30 p-2 text-amber-200">
                          <strong>常见失分点：</strong> {guide.pitfall}
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-slate-400">
                          {guide.actions.map((action) => (
                            <li key={action}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                暂无科目矩阵，暂时无法生成对应的提分指南。
              </p>
            )}
          </section>
        </>
      )}
    </section>
  )
}
