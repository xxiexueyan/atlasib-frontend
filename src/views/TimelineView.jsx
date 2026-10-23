import { usePlan } from '../context/PlanContext.jsx'

const milestones = [
  {
    period: 'G9–G10 · 探索与基础',
    tone: 'border-indigo-500 bg-indigo-400',
    description: '了解 IB 学科组和不同专业方向，逐步建立学习、语言和数学基础。',
    actions: [
      '体验编程、科学、写作或设计项目，记录真正感兴趣的主题。',
      '与学校升学顾问了解课程先修、选课时间和目标国家差异。',
      '用稳定作息和阶段复盘建立可持续的学习习惯。',
    ],
  },
  {
    period: 'G11 / IB DP1 · 选课与预估分准备',
    tone: 'border-amber-500 bg-amber-400',
    description: '进入 DP 后，平衡 HL/SL 组合、IA 任务和日常学习，逐渐形成申请方向。',
    actions: [
      '确认目标专业对数学、理科及 HL/SL 的官方先修要求。',
      '按学校时间表推进 IA 和 EE 选题，尽早向教师获取反馈。',
      '与任课教师讨论阶段表现和预估分依据，制定重点提升计划。',
    ],
  },
  {
    period: 'G12 / IB DP2 · 申请与考试',
    tone: 'border-emerald-500 bg-emerald-400',
    description: '在申请、附加考核与最终考试之间安排优先级，按各校截止日期倒排任务。',
    actions: [
      '逐校核对申请截止日、文书、推荐信和语言成绩要求。',
      '若专业有入学考试或面试，按官方要求提前准备并安排模拟练习。',
      '保留复习时间并关注学校考试安排，避免申请活动挤占备考。',
    ],
  },
]

export default function TimelineView() {
  const { selectedProgramIds } = usePlan()

  return (
    <section className="space-y-4 pb-24" aria-labelledby="timeline-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          四年成长路线
        </p>
        <h2 id="timeline-heading" className="mt-1 text-lg font-bold text-white">
          G9–G12 关键里程碑
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          当前基于 {selectedProgramIds.length} 个志愿提供通用规划框架；请结合学校校历、申请国家和个人情况调整。
        </p>
      </div>

      <div className="relative space-y-3 before:absolute before:bottom-5 before:left-[1.125rem] before:top-5 before:w-px before:bg-slate-700">
        {milestones.map((milestone, index) => (
          <article
            key={milestone.period}
            className="relative rounded-2xl border border-slate-800 bg-slate-900 p-4 pl-12"
          >
            <span
              className={`absolute left-3 top-4 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 ${milestone.tone}`}
              aria-hidden="true"
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              阶段 {index + 1}
            </span>
            <h3 className="mt-0.5 text-sm font-bold text-white">{milestone.period}</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              {milestone.description}
            </p>
            <ul className="mt-3 space-y-2">
              {milestone.actions.map((action) => (
                <li
                  key={action}
                  className="flex gap-2 text-[11px] leading-relaxed text-slate-300"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" aria-hidden="true" />
                  {action}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <aside className="rounded-xl border border-cyan-900/70 bg-cyan-950/30 p-3 text-[11px] leading-relaxed text-cyan-100">
        时间线仅为规划提示，不替代学校的 IB 课程安排或大学官网的申请日期。每学期复核一次，必要时调整目标和节奏。
      </aside>
    </section>
  )
}
