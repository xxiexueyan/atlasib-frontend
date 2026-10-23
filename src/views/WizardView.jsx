import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { submitDiagnosis } from '../api/diagnose.js'
import { usePlan } from '../context/PlanContext.jsx'

const languageOptions = [
  'Chinese',
  'English',
  'Japanese',
  'Korean',
  'German',
  'French',
  'Spanish',
  'Greek',
  'Italian',
  'Portuguese',
  'Russian',
  'Arabic',
  'Hindi',
  'Other',
]

const primaryLanguageLevels = [
  {
    value: 'native_a',
    label: '母语水平 · Language A',
    description: '具备母语程度的阅读、写作与文学分析能力。',
  },
  {
    value: 'proficient',
    label: '熟练掌握',
    description: '能够熟练使用该语言；具体课程层级由学校与 IB 课程设置确认。',
  },
]

const secondaryLanguageLevels = [
  {
    value: 'fluent_b_hl',
    label: '熟练高阶 · Language B HL（推荐）',
    description:
      '例如托福 95–105 / 雅思 7.0+；具体大学的语言豁免政策请以院校要求为准。',
  },
  {
    value: 'bilingual_a',
    label: '双语母语级 · Language A',
    description: '第二语言也达到母语级，可按双语文凭路径评估。',
  },
  {
    value: 'standard_b_sl',
    label: '标准掌握 · Language B SL',
    description: '希望适当减轻语言课负担，将 HL 名额留给其他科目。',
  },
  {
    value: 'beginner_ab_initio',
    label: '零基础 · Language ab initio SL',
    description: '第二语言从入门开始学习，适合目标语言零基础的情况。',
  },
]

const questions = [
  {
    key: 'school_level',
    title: '孩子目前就读学校的过往表现如何？',
    subtitle: '大学会结合学校往届的学术表现理解申请成绩。',
    options: [
      {
        value: 'top',
        label: '顶级公立或顶尖名校',
        description: '学校往届 IB 平均分较高，课程体系成熟。',
      },
      {
        value: 'middle',
        label: '稳健的主流学校',
        description: '学校有稳定的 IB 教学和毕业生记录。',
      },
      {
        value: 'emerging',
        label: '新办学校或往届均分普通',
        description: '学校毕业生数据较少，或平均成绩仍在积累。',
      },
    ],
  },
  {
    key: 'student_rank',
    title: '孩子目前的平时成绩大约处于什么水平？',
    subtitle: '这有助于估计目前的学习基础，不代表最终录取结果。',
    options: [
      {
        value: 'top5',
        label: '年级前 5%–10%',
        description: '多数科目表现突出，有较强的冲刺基础。',
      },
      {
        value: 'top25',
        label: '年级前 15%–25%',
        description: '主要科目稳定优秀，个别科目仍有提升空间。',
      },
      {
        value: 'middle',
        label: '年级中游或仍在适应',
        description: '正在建立学习节奏，希望获得稳健的目标建议。',
      },
    ],
  },
  {
    key: 'interest_track',
    title: '孩子更喜欢哪类学习与专业方向？',
    subtitle: '兴趣方向有助于判断专业和先修科目的匹配度。',
    options: [
      {
        value: 'pure_cs',
        label: '编程、算法与数学',
        description: '喜欢代码、逻辑推理或计算机科学。',
      },
      {
        value: 'engineering',
        label: '工程实践与动手项目',
        description: '对物理、硬件、工程设计和实习感兴趣。',
      },
      {
        value: 'balanced',
        label: '文理兼顾、综合应用',
        description: '希望兼顾兴趣、课程负担和未来就业。',
      },
    ],
  },
  {
    key: 'country_pref',
    title: '目前有比较偏好的留学国家或地区吗？',
    subtitle: '可先选择开放选项，之后再结合预算和专业调整。',
    options: [
      {
        value: 'any',
        label: '暂不限定，全球统筹',
        description: '综合实力、课程、预算与发展计划进行匹配。',
      },
      {
        value: 'USA',
        label: '美国',
        description: '关注研究资源、校园体验和综合申请。',
      },
      {
        value: 'GBR',
        label: '英国',
        description: '关注专业课程、学术要求和较短学制。',
      },
      {
        value: 'CAN',
        label: '加拿大',
        description: '关注实习机会和毕业后的工作路径。',
      },
      {
        value: 'SGP',
        label: '新加坡',
        description: '关注亚洲高校、生活环境和就业机会。',
      },
      {
        value: 'EUROPE',
        label: '欧洲（英国除外）',
        description: '统筹德国、法国、爱尔兰、瑞士和荷兰等欧洲目的地。',
      },
    ],
  },
  {
    key: 'budget',
    title: '家庭每年的留学预算大约是多少？',
    subtitle: '预算请结合学费、生活费、保险和汇率一起考虑。',
    options: [
      {
        value: 'economy',
        label: '每年约 15–25 万人民币',
        description: '希望优先考虑成本较低或有资助机会的路径。',
      },
      {
        value: 'medium',
        label: '每年约 35–50 万人民币',
        description: '考虑主流留学目的地与奖学金、实习等因素。',
      },
      {
        value: 'abundant',
        label: '每年约 60 万人民币以上',
        description: '预算相对充裕，可比较多种院校和地区。',
      },
    ],
  },
  {
    key: 'stay_plan',
    title: '本科毕业后，对是否留在当地工作有什么计划？',
    subtitle: '移民和工签政策会变化，申请前应核对官方信息。',
    options: [
      {
        value: 'must_stay',
        label: '希望留当地工作或争取长期居留',
        description: '需要重点了解毕业工签、就业市场和长期居留条件。',
      },
      {
        value: 'work_few_years',
        label: '希望工作几年，再决定下一步',
        description: '希望先积累海外工作和生活经验。',
      },
      {
        value: 'return',
        label: '计划回国发展',
        description: '主要关注专业实力、学校资源和回国认可度。',
      },
    ],
  },
  {
    key: 'language_background',
    type: 'language',
    title: '学生的母语及常用第二语言？',
    subtitle:
      'IB 官方硬性规定必须修读两门语言（Group 1 母语研究 + Group 2 语言习得），系统将结合目标大学要求为您定制最高性价比的语言层级。',
  },
]

function LanguagePicker({
  label,
  value,
  customValue,
  onChange,
  onCustomChange,
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-200">{label}</p>
      <div className="flex flex-wrap gap-2">
        {languageOptions.map((language) => (
          <button
            key={language}
            type="button"
            aria-pressed={value === language}
            onClick={() => onChange(language)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
              value === language
                ? 'border-cyan-400 bg-cyan-950/70 text-cyan-100'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
            }`}
          >
            {language === 'Other' ? '其他' : language}
          </button>
        ))}
      </div>
      {value === 'Other' && (
        <input
          type="text"
          value={customValue}
          onChange={(event) => onCustomChange(event.target.value)}
          aria-label={`${label}（请输入语言名称）`}
          placeholder="请输入语言名称，例如 Arabic"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      )}
    </div>
  )
}

function getRecommendedPrograms(result) {
  const programs =
    result?.recommended_programs ?? result?.recommendedPrograms ?? []
  return Array.isArray(programs) ? programs : []
}

function getProgramName(program) {
  return (
    program.program_name_zh ??
    program.program_name ??
    program.programName ??
    program.name ??
    '推荐专业'
  )
}

function getUniversityName(program) {
  return program.university_name ?? program.universityName ?? program.university ?? ''
}

function getProgramIds(programs) {
  return [
    ...new Set(
      programs
        .map((program) => program.id ?? program.program_id ?? program.programId)
        .filter((id) => typeof id === 'string' && id.trim())
        .map((id) => id.trim()),
    ),
  ]
}

function getDiagnosisErrorMessage(error) {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const location = Array.isArray(item?.loc) ? item.loc.join(' → ') : ''
        const message = item?.msg ?? '参数校验失败'
        return location ? `${location}: ${message}` : message
      })
      .join('；')
  }

  const apiError = error?.response?.data?.error
  if (typeof apiError?.message === 'string') {
    const details = Array.isArray(apiError.details)
      ? apiError.details.map((item) => item?.msg).filter(Boolean).join('；')
      : ''
    return details ? `${apiError.message} ${details}` : apiError.message
  }

  return error instanceof Error ? error.message : '请求暂时不可用。'
}

export default function WizardView() {
  const [step, setStep] = useState(0)
  const {
    wizardAnswers,
    setWizardAnswers,
    diagnosisResult,
    setDiagnosisResult,
    currentProfileId,
    clientDeviceId,
    saveProfileId,
    selectedProgramIds,
    toggleProgram,
    batchApplyDiagnosisPrograms,
    isSyncingPrograms,
    isLoadingSavedPrograms,
  } = usePlan()
  const mutation = useMutation({
    mutationFn: submitDiagnosis,
    onSuccess: async (result) => {
      setDiagnosisResult(result)
      setStep(questions.length)
      if (result.profile_id) await saveProfileId(result.profile_id)
    },
  })

  const currentQuestion = questions[step]
  const isComplete = questions.every((question) => {
    if (question.type !== 'language') return Boolean(wizardAnswers[question.key])
    const primaryComplete =
      wizardAnswers.primaryLanguage &&
      (wizardAnswers.primaryLanguage !== 'Other' ||
        wizardAnswers.primaryLanguageCustom?.trim())
    const secondaryComplete =
      wizardAnswers.secondaryLanguage &&
      (wizardAnswers.secondaryLanguage !== 'Other' ||
        wizardAnswers.secondaryLanguageCustom?.trim())
    return primaryComplete && secondaryComplete && wizardAnswers.secondaryLangLevel
  })
  const result = diagnosisResult
  const programs = getRecommendedPrograms(result)
  const programIds = getProgramIds(programs)

  function updateAnswer(key, value) {
    setWizardAnswers((currentAnswers) => ({
      ...currentAnswers,
      [key]: value,
    }))
    mutation.reset()
  }

  function updateLanguageAnswer(key, value) {
    setWizardAnswers((currentAnswers) => {
      const nextAnswers = { ...currentAnswers, [key]: value }
      if (key === 'primaryLanguage') {
        nextAnswers.primaryLanguageConfirmed =
          value !== 'Other' ||
          Boolean(nextAnswers.primaryLanguageCustom?.trim())
      } else if (key === 'primaryLanguageCustom') {
        nextAnswers.primaryLanguageConfirmed =
          nextAnswers.primaryLanguage === 'Other' && Boolean(value.trim())
      } else if (key === 'secondaryLanguage') {
        nextAnswers.secondaryLanguageConfirmed =
          value !== 'Other' ||
          Boolean(nextAnswers.secondaryLanguageCustom?.trim())
      } else if (key === 'secondaryLanguageCustom') {
        nextAnswers.secondaryLanguageConfirmed =
          nextAnswers.secondaryLanguage === 'Other' && Boolean(value.trim())
      }
      return nextAnswers
    })
    mutation.reset()
  }

  function submitAnswers() {
    if (isComplete) {
      mutation.mutate({
        ...wizardAnswers,
        client_device_id: clientDeviceId,
      })
    }
  }

  if (result && (step >= questions.length || currentProfileId)) {
    const minScore =
      result.calculated_ib_min ?? result.calculatedIbMin ?? result.estimatedIBMin
    const maxScore =
      result.calculated_ib_max ?? result.calculatedIbMax ?? result.estimatedIBMax
    const reasoning =
      result.reasoning_points ?? result.reasoningPoints ?? result.reasoning ?? []

    return (
      <section className="space-y-4 pb-24" aria-labelledby="diagnosis-heading">
        <div className="space-y-3 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="diagnosis-heading"
              className="flex items-center gap-1.5 text-sm font-bold text-cyan-300"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              专属诊断报告
            </h2>
            <button
              type="button"
              onClick={() => {
                setDiagnosisResult(null)
                setStep(0)
                mutation.reset()
              }}
              className="flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-white"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              重新答题
            </button>
          </div>

          <div>
            <p className="text-xs text-slate-300">当前诊断的 IB 目标区间</p>
            <p className="mt-1 text-2xl font-black text-white">
              {minScore ?? '—'} – {maxScore ?? '—'}
              <span className="ml-1 text-sm font-semibold text-cyan-300">分</span>
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              这是一份基于问卷信息的初步参考，不代表录取保证或最终校内预估分。
            </p>
          </div>

          {Array.isArray(reasoning) && reasoning.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
              <h3 className="flex items-center gap-1 text-xs font-semibold text-indigo-300">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                推荐依据
              </h3>
              {reasoning.map((point, index) => (
                <p key={`${point}-${index}`} className="text-[11px] leading-relaxed text-slate-300">
                  · {point}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            <h3 className="text-xs font-bold text-white">推荐大学与专业</h3>
          </div>
          {programs.length > 0 ? (
            <>
              <div className="space-y-2">
                {programs.map((program, index) => {
                  const programId =
                    program.program_id ?? program.id ?? program.programId
                  const isSelected = selectedProgramIds.includes(programId)

                  return (
                    <article
                      key={
                        programId ??
                        `${getProgramName(program)}-${index}`
                      }
                      className={`rounded-2xl border p-3 ${
                        isSelected
                          ? 'border-indigo-500/80 bg-slate-900 shadow-md shadow-indigo-500/10'
                          : 'border-slate-800 bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {getUniversityName(program) || '院校信息待补充'}
                          </h4>
                          <p className="mt-1 text-[11px] font-semibold text-indigo-300">
                            {getProgramName(program)}
                          </p>
                          {(program.country_name ?? program.countryName) && (
                            <span className="mt-2 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                              {program.flag_emoji ?? program.flagEmoji ?? ''}{' '}
                              {program.country_name ?? program.countryName}
                            </span>
                          )}
                        </div>
                        {programId && (
                          <button
                            type="button"
                            disabled={
                              isSyncingPrograms ||
                              isLoadingSavedPrograms ||
                              !currentProfileId
                            }
                            onClick={() => toggleProgram(programId)}
                            aria-pressed={isSelected}
                            className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-3 w-3" aria-hidden="true" />
                                已在志愿车
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" aria-hidden="true" />
                                加入志愿
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 rounded-xl bg-slate-950 p-2 text-[10px] text-slate-300">
                        {program.min_predicted !== undefined && (
                          <p>
                            录取预估门槛：
                            <span className="font-bold text-emerald-400">
                              {program.min_predicted} 分+
                            </span>
                          </p>
                        )}
                        {program.est_annual_rmb !== undefined && (
                          <p>折合年开销：约 {program.est_annual_rmb} 万人民币</p>
                        )}
                        {Array.isArray(program.fit_reasons) &&
                          program.fit_reasons.length > 0 && (
                            <p className="pt-0.5 text-slate-400">
                              推荐理由：{program.fit_reasons[0]}
                            </p>
                          )}
                      </div>
                    </article>
                  )
                })}
              </div>
              <button
                type="button"
                disabled={selectedProgramIds.length === 0 || isSyncingPrograms}
                onClick={() => batchApplyDiagnosisPrograms(selectedProgramIds)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-3 text-xs font-bold text-white transition hover:from-indigo-500 hover:to-cyan-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                保存已选志愿并开始排课
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {selectedProgramIds.length === 0 && programIds.length > 0 && (
                <p className="text-center text-[11px] text-amber-300">
                  请先选择想加入志愿车的推荐专业。
                </p>
              )}
              {programIds.length === 0 && (
                <p className="text-center text-[11px] text-amber-300">
                  推荐结果未包含可载入的专业 ID，请先到专业库选择志愿。
                </p>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
              诊断接口暂未返回推荐专业，可前往专业库手动选择目标。
            </div>
          )}
          <button
            type="button"
            disabled={isSyncingPrograms}
            onClick={() => {
              setDiagnosisResult(null)
              setStep(0)
            }}
            className="w-full rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
          >
            修改答案
          </button>
        </div>
      </section>
    )
  }

  const selectedValue = wizardAnswers[currentQuestion.key]
  const isCurrentQuestionComplete =
    currentQuestion.type === 'language'
      ? Boolean(
          wizardAnswers.primaryLanguage &&
            (wizardAnswers.primaryLanguage !== 'Other' ||
              wizardAnswers.primaryLanguageCustom?.trim()) &&
            wizardAnswers.secondaryLanguage &&
            (wizardAnswers.secondaryLanguage !== 'Other' ||
              wizardAnswers.secondaryLanguageCustom?.trim()) &&
            wizardAnswers.secondaryLangLevel,
        )
      : Boolean(selectedValue)

  return (
    <section className="space-y-4 pb-24" aria-labelledby="wizard-heading">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          从兴趣到专业方向
        </p>
        <h2 id="wizard-heading" className="text-lg font-bold text-white">
          零基础升学向导
        </h2>
        <p className="text-xs leading-relaxed text-slate-400">
          用 6 个简单问题和语言背景信息梳理目标。每一步都可以返回修改。
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-cyan-300">第 {step + 1} / {questions.length} 步</span>
          <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full border border-slate-800 bg-slate-900"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-valuenow={step + 1}
          aria-label="问卷进度"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-indigo-900/50 bg-gradient-to-b from-indigo-950/50 to-slate-900 p-4">
        <legend className="sr-only">{currentQuestion.title}</legend>
        <div>
          <h3 className="text-sm font-bold leading-snug text-white">
            {currentQuestion.title}
          </h3>
          <p className="mt-1 text-xs text-slate-400">{currentQuestion.subtitle}</p>
        </div>

        {currentQuestion.type === 'language' ? (
          <div className="space-y-5">
            <LanguagePicker
              label="第一母语（Group 1）"
              value={wizardAnswers.primaryLanguage}
              customValue={wizardAnswers.primaryLanguageCustom ?? ''}
              onChange={(value) =>
                updateLanguageAnswer('primaryLanguage', value)
              }
              onCustomChange={(value) =>
                updateLanguageAnswer('primaryLanguageCustom', value)
              }
            />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-200">
                母语掌握程度
              </p>
              <div className="grid grid-cols-2 gap-2">
                {primaryLanguageLevels.map((option) => {
                  const selected =
                    wizardAnswers.primaryLangLevel === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateLanguageAnswer('primaryLangLevel', option.value)
                      }
                      aria-pressed={selected}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? 'border-cyan-400 bg-indigo-600/20 text-white'
                          : 'border-slate-800 bg-slate-950/70 text-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">
                        {option.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <LanguagePicker
              label="常用第二语言（Group 2）"
              value={wizardAnswers.secondaryLanguage}
              customValue={wizardAnswers.secondaryLanguageCustom ?? ''}
              onChange={(value) =>
                updateLanguageAnswer('secondaryLanguage', value)
              }
              onCustomChange={(value) =>
                updateLanguageAnswer('secondaryLanguageCustom', value)
              }
            />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-200">
                第二语言掌握程度与选课倾向
              </p>
              {secondaryLanguageLevels.map((option) => {
                const selected =
                  wizardAnswers.secondaryLangLevel === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateLanguageAnswer('secondaryLangLevel', option.value)
                    }
                    aria-pressed={selected}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-cyan-400 bg-indigo-600/20 text-white'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => {
              const selected = selectedValue === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateAnswer(currentQuestion.key, option.value)}
                  aria-pressed={selected}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99] ${
                    selected
                      ? 'border-cyan-400 bg-indigo-600/20 text-white shadow-md shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                        : 'border-slate-600'
                    }`}
                  >
                    {selected && <Check className="h-2.5 w-2.5" aria-hidden="true" />}
                  </span>
                  <span>
                    <span className="block text-xs font-bold">{option.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">
                      {option.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </fieldset>

      {mutation.isError && (
        <div role="alert" className="flex gap-2 rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p>诊断提交失败，请检查网络后重试。</p>
            <p className="mt-1 text-[11px] text-red-300">
              {getDiagnosisErrorMessage(mutation.error)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 0 || mutation.isPending}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 transition hover:bg-slate-800 active:scale-95 disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          上一步
        </button>

        {step < questions.length - 1 ? (
          <button
            type="button"
            disabled={!isCurrentQuestionComplete}
            onClick={() => setStep((current) => current + 1)}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一步
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!isComplete || mutation.isPending}
            onClick={submitAnswers}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <>
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                正在生成报告
              </>
            ) : (
              <>
                生成诊断报告
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        )}
      </div>
      {!isComplete && step === questions.length - 1 && (
        <p className="text-right text-[11px] text-amber-300">
          请先完成全部问题及语言背景信息。
        </p>
      )}
    </section>
  )
}
