import { useState } from 'react'
import {
  BookMarked,
  BriefcaseBusiness,
  CircleHelp,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const scoreBands = [
  {
    score: '42–45 分',
    label: '高分冲刺区间',
    detail: '可考虑竞争激烈的项目，但成绩并不保证录取；课程匹配、申请材料和院校要求同样重要。',
    color: 'border-emerald-800 bg-emerald-950/30 text-emerald-200',
  },
  {
    score: '38–41 分',
    label: '竞争力较强',
    detail: '可对照目标院校的专业门槛、HL 科目和先修要求，制定分层申请清单。',
    color: 'border-cyan-800 bg-cyan-950/30 text-cyan-200',
  },
  {
    score: '34–37 分',
    label: '拓展与匹配区间',
    detail: '建议综合评估专业门槛、选课组合和个人优势，合理安排冲刺、匹配与稳妥项目。',
    color: 'border-indigo-800 bg-indigo-950/30 text-indigo-200',
  },
  {
    score: '24–33 分',
    label: '优先稳固基础',
    detail: '关注文凭授予条件和各科目要求；尽早与 IB 协调员及教师讨论学习支持。',
    color: 'border-amber-800 bg-amber-950/30 text-amber-200',
  },
]

const subjectGroups = [
  ['第一组：语言与文学', '通常为母语课程，例如中文 A 或英语 A。'],
  ['第二组：语言习得', '例如英语 B、其他外语或初级语言课程。'],
  ['第三组：个人与社会', '例如经济学、历史、地理、心理学或商业管理。'],
  ['第四组：科学', '例如物理、化学、生物或计算机科学。'],
  ['第五组：数学', '数学课程通常在 AA（分析与方法）和 AI（应用与解释）中选择。'],
  ['第六组：艺术与选修', '可选艺术课程，或按项目规则从其他学科组增加选修。'],
]

const coreElements = [
  {
    code: 'TOK',
    name: '知识理论',
    detail: '通过展览与论文探讨知识如何形成、证据如何支持主张等问题。',
  },
  {
    code: 'EE',
    name: '拓展论文',
    detail: '在指导下围绕一个学科问题进行独立研究并完成学术论文。',
  },
  {
    code: 'CAS',
    name: '创造、活动与服务',
    detail: '参与持续的创意、活动与服务体验并进行反思；CAS 本身不计入总分，但需满足项目完成要求。',
  },
]

const countryPolicies = [
  {
    id: 'canada',
    flag: '🇨🇦',
    country: '加拿大',
    visa: '毕业后工作许可（PGWP）',
    summary:
      '符合条件的毕业生可能申请毕业后工作许可；时长、院校与项目资格受现行规则约束。可关注 Express Entry、加拿大经验类和省提名等经济类移民通道。',
    checklist: [
      '确认学校及具体项目是否符合当期 PGWP 资格。',
      '工作经验、职业类别、语言成绩等会影响经济类移民资格。',
      'Co-op 实习许可与毕业后工作许可是不同事项。',
    ],
  },
  {
    id: 'uk',
    flag: '🇬🇧',
    country: '英国',
    visa: 'Graduate Route 与 Skilled Worker',
    summary:
      '完成符合条件的英国课程后，可能申请毕业生路线；之后可由符合条件的雇主担保申请 Skilled Worker。长期居留取决于签证类别和持续满足的条件。',
    checklist: [
      '毕业生签证的适用资格和期限以申请时的官方规则为准。',
      '转技术工签通常要求合资格雇主、职业和薪资条件。',
      '不要把毕业生路线的居留时间自动等同于永居年限。',
    ],
  },
  {
    id: 'usa',
    flag: '🇺🇸',
    country: '美国',
    visa: 'F-1 OPT / STEM OPT 与雇主工作签证',
    summary:
      '符合条件的 F-1 毕业生可申请 OPT；部分 STEM 学位可申请延期。后续工作身份及永久居留通常还需满足雇主、抽签或移民类别条件。',
    checklist: [
      '确认专业是否符合 STEM 延期资格及雇主是否满足要求。',
      'H-1B 等工作身份有申请条件和年度名额限制。',
      '就业许可与永久居留是不同程序，应提前规划并咨询合格顾问。',
    ],
  },
  {
    id: 'singapore',
    flag: '🇸🇬',
    country: '新加坡',
    visa: '就业准证（EP）等工作准证',
    summary:
      '毕业后通常需要符合条件的工作机会和相应准证才能工作；永久居民申请由主管部门综合评估，并非毕业或就业后的自动结果。',
    checklist: [
      '工作准证的薪资、职位和雇主要求会调整。',
      '部分助学金可能附带服务义务，签约前仔细核对条款。',
      'PR 审核具有裁量性，不能仅凭学历或工作年限保证获批。',
    ],
  },
  {
    id: 'germany',
    flag: '🇩🇪',
    country: '德国',
    visa: '毕业求职居留与欧盟蓝卡',
    summary:
      '符合条件的德国高校毕业生可了解毕业后求职居留；取得合资格工作后可能申请相应工作居留或欧盟蓝卡，并按规定申请长期居留。',
    checklist: [
      '求职居留、蓝卡薪资门槛和长期居留条件以申请时规则为准。',
      '德语水平会影响就业选择及部分居留路径的要求。',
      '需核对 IB 文凭和所选学科组合是否满足德国大学入学资格。',
    ],
  },
  {
    id: 'australia',
    flag: '🇦🇺',
    country: '澳大利亚',
    visa: 'Temporary Graduate（Subclass 485）等',
    summary:
      '符合条件的毕业生可了解临时毕业生签证；技术移民可能涉及职业清单、技能评估、英语、年龄和邀请等条件。',
    checklist: [
      '签证类别、毕业资格和停留期限会随政策调整。',
      '技术移民通常采用积分或州/地区提名等规则，不保证获邀。',
      '在选课阶段可留意目标职业的课程认证和技能评估要求。',
    ],
  },
]

export default function WikiView() {
  const [section, setSection] = useState('ib')

  return (
    <section className="space-y-4 pb-24" aria-labelledby="wiki-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
          IB 课程与留学路径
        </p>
        <h2 id="wiki-heading" className="mt-1 text-lg font-bold text-white">
          留学政策与 IB 科普
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          用简明信息了解课程和常见毕业后路径；具体政策请以官方最新说明为准。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-800 bg-slate-900 p-1">
        <button
          type="button"
          onClick={() => setSection('ib')}
          aria-pressed={section === 'ib'}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${
            section === 'ib'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookMarked className="h-4 w-4" aria-hidden="true" />
          IB 课程体系
        </button>
        <button
          type="button"
          onClick={() => setSection('visas')}
          aria-pressed={section === 'visas'}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition active:scale-95 ${
            section === 'visas'
              ? 'bg-cyan-700 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          国家与工作路径
        </button>
      </div>

      {section === 'ib' ? (
        <div className="space-y-3.5">
          <article className="space-y-3 rounded-2xl border border-indigo-700/50 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Layers3 className="h-4 w-4 text-amber-400" aria-hidden="true" />
                IB 45 分制怎么构成？
              </h3>
              <span className="rounded-full border border-cyan-800 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                42 学科分 + 最多 3 核心加分
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              IB Diploma Programme 通常由 6 门学科组成，每科最高 7 分，学科总分最高 42 分；TOK 与 EE 的成绩组合最多可贡献 3 分。CAS 不计入 45 分，但属于必须完成的核心要求。
            </p>
            <div className="space-y-2">
              {scoreBands.map((band) => (
                <div
                  key={band.score}
                  className={`rounded-xl border p-2.5 ${band.color}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold">{band.score}</span>
                    <span className="text-[10px]">{band.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    {band.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-white">TOK、EE 与 CAS</h3>
            </div>
            <div className="space-y-2">
              {coreElements.map((item) => (
                <div
                  key={item.code}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <h4 className="text-xs font-bold text-indigo-300">
                    {item.code} · {item.name}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-purple-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-white">六大学科组</h3>
            </div>
            <div className="space-y-2">
              {subjectGroups.map(([group, description]) => (
                <div
                  key={group}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-2.5"
                >
                  <h4 className="text-xs font-semibold text-purple-200">{group}</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 rounded-xl border border-amber-800/70 bg-amber-950/30 p-3 text-[11px] leading-relaxed text-amber-100">
            <CircleHelp className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
            <p>
              毕业工签和永居资格受个人条件及政策调整影响。以下为常见路径概览，不构成法律或移民建议；请在申请前查看政府官网。
            </p>
          </div>
          {countryPolicies.map((policy) => (
            <details
              key={policy.id}
              className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5 marker:hidden">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{policy.flag}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white">
                      {policy.country}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-cyan-300">
                      {policy.visa}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-500 transition group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              <div className="space-y-2 border-t border-slate-800 px-3.5 pb-3.5 pt-3">
                <p className="text-xs leading-relaxed text-slate-300">
                  {policy.summary}
                </p>
                <h4 className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  规划时留意
                </h4>
                <ul className="list-inside list-disc space-y-1 text-[11px] leading-relaxed text-slate-400">
                  {policy.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
          <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-400">
            <BriefcaseBusiness className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden="true" />
            <p>
              比较国家时，也要评估专业就业需求、语言要求、实习资源、生活成本和个人适应度，避免只依据单一签证期限做决定。
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
