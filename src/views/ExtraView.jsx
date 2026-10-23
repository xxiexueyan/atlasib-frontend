import {
  Activity,
  Code2,
  HeartHandshake,
  Lightbulb,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { usePlan } from '../context/PlanContext.jsx'

const competitionStages = [
  {
    stage: '起步：打好基础',
    years: 'G9–G10',
    color: 'border-indigo-800 bg-indigo-950/30 text-indigo-200',
    ideas: [
      '编程方向：循序练习基础算法和数据结构，熟悉 USACO 等竞赛的题型与规则。',
      '数学方向：通过校内数学社团、数学建模或适龄竞赛培养解题习惯。',
      '每学期选择少量适合自己的活动，重视持续参与而非堆砌奖项。',
    ],
  },
  {
    stage: '进阶：形成专长',
    years: 'G10–G11',
    color: 'border-cyan-800 bg-cyan-950/30 text-cyan-200',
    ideas: [
      '有编程基础后可挑战 USACO 等分级竞赛，并按官方规则循序提升。',
      '关注 Euclid、CCC 等数学或计算机竞赛的适用年级、报名时间和赛制。',
      '整理训练过程、失败复盘与个人贡献，形成真实的成长记录。',
    ],
  },
  {
    stage: '深化：展示影响力',
    years: 'G11–G12',
    color: 'border-amber-800 bg-amber-950/30 text-amber-200',
    ideas: [
      '从兴趣出发完成可展示的项目，例如开源工具、校园服务系统或研究作品。',
      '如果适合，可参与 Technovation 等项目型活动；先核实当年赛制和资格。',
      '把重心放在成果质量、反思与实际影响，不将奖项数量当作唯一目标。',
    ],
  },
]

const casIdeas = [
  {
    strand: 'Creativity · 创造',
    icon: Lightbulb,
    color: 'border-indigo-500 text-indigo-200',
    title: '为真实需求制作数字工具',
    detail:
      '与同学或社团沟通需求，开发活动报名、资源共享或学习辅助工具；记录用户反馈、迭代过程和隐私保护考虑。',
  },
  {
    strand: 'Activity · 活动',
    icon: Activity,
    color: 'border-amber-500 text-amber-200',
    title: '持续参与运动或户外挑战',
    detail:
      '选择适合自己的跑步、球类、徒步或舞蹈计划，设定阶段目标并记录安全、坚持和团队协作方面的反思。',
  },
  {
    strand: 'Service · 服务',
    icon: HeartHandshake,
    color: 'border-emerald-500 text-emerald-200',
    title: '开展社区数字素养志愿活动',
    detail:
      '与社区或学校合作，为低年级学生设计编程入门活动；先了解服务对象需求，持续收集反馈并复盘改进。',
  },
]

export default function ExtraView() {
  const { selectedProgramIds } = usePlan()

  return (
    <section className="space-y-4 pb-24" aria-labelledby="extra-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          课外成长与项目实践
        </p>
        <h2 id="extra-heading" className="mt-1 text-lg font-bold text-white">
          竞赛阶梯与 CAS 规划
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          目前志愿车有 {selectedProgramIds.length} 个目标专业。以下建议是可选方向，请以兴趣、时间和资源为先。
        </p>
      </div>

      <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-white">循序渐进的竞赛阶梯</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          竞赛成绩并非所有专业或大学的必要条件。选择与兴趣相关的活动，合理安排学业和休息。
        </p>
        <div className="space-y-2.5">
          {competitionStages.map((stage) => (
            <section
              key={stage.stage}
              className={`space-y-2 rounded-xl border p-3 ${stage.color}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold">{stage.stage}</h4>
                <span className="rounded bg-slate-950/60 px-2 py-0.5 text-[10px]">
                  {stage.years}
                </span>
              </div>
              <ul className="list-inside list-disc space-y-1 text-[11px] leading-relaxed text-slate-300">
                {stage.ideas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>

      <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-white">CAS 项目灵感</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          CAS 重视持续投入、体验与反思。开始项目前请与 CAS 协调员确认学校要求、风险评估和证据记录方式。
        </p>
        <div className="space-y-2">
          {casIdeas.map(({ strand, icon: Icon, color, title, detail }) => (
            <article
              key={strand}
              className={`rounded-xl border-l-4 border border-slate-800 bg-slate-950 p-3 ${color}`}
            >
              <h4 className="flex items-center gap-1.5 text-xs font-bold">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {strand}
              </h4>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{detail}</p>
            </article>
          ))}
        </div>
      </article>

      <div className="flex items-start gap-2 rounded-xl border border-indigo-800/60 bg-indigo-950/30 p-3 text-[11px] leading-relaxed text-indigo-100">
        <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
        <p>
          活动记录可包含目标、过程、反馈和反思。申请材料应准确描述个人贡献，避免夸大团队成果或使用未经核实的数据。
        </p>
      </div>
      <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-400">
        <Medal className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        <p>
          竞赛规则、报名时间和年龄资格每年可能变化，报名之前请查阅主办方公告。
        </p>
      </div>
    </section>
  )
}
