import { useEffect, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

const glossaryEntries = [
  {
    key: 'ib',
    label: 'IB 总览',
    title: '什么是 IB（国际文凭）？',
    summary:
      '国际公认含金量高、课程全面的高中课程体系。总分 45 分，38 分左右通常已具竞争力，42 分以上可冲刺顶尖名校。',
    detail:
      '学生通常修读 6 门学科（一般为 3 门 HL 高难度课程和 3 门 SL 标准课程），另完成 TOK、EE 和 CAS 三项核心要求；TOK 与 EE 可带来最多 3 分额外分。',
  },
  {
    key: 'hl_sl',
    label: 'HL 与 SL',
    title: 'HL 和 SL 有什么区别？',
    summary: 'HL（Higher Level）是高阶课程，SL（Standard Level）是标准课程。',
    detail:
      'HL 学习内容更深入、课时更多。有些大学专业要求特定科目达到 HL，并取得指定成绩（例如计算机专业可能要求数学 HL）。IB 通常最多选 4 门 HL，需结合目标专业和学习负担规划。',
  },
  {
    key: 'math_stream',
    label: 'Math AA/AI',
    title: 'Math AA 与 Math AI 怎么选？',
    summary:
      'Math AA（分析与方法）侧重代数、函数和微积分推导；Math AI（应用与解释）更侧重统计、建模和实际应用。',
    detail:
      '数学课程选择会影响专业申请资格。部分数学、计算机和工程项目可能要求或更偏好 Math AA HL；应逐个核对目标院校当年的官方入学要求，不要仅凭课程名称判断。',
  },
  {
    key: 'predicted',
    label: '预估分',
    title: '什么是预估分（Predicted Grade）？',
    summary:
      '学校老师根据平时表现和阶段考试，对学生最终 IB 成绩作出的预测。',
    detail:
      '不少大学会在 IB 最终考试前审核申请，因此预估分可能影响是否获得录取或有条件录取。它不是最终成绩，具体要求和使用方式因国家、院校及专业而异。',
  },
]

export default function GlossaryModal({
  isOpen,
  onClose,
  initialTerm = 'ib',
}) {
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
              留学与 IB「避坑」词典
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭词典"
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5" aria-label="词条">
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
                {entry.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
          <h3 className="text-xs font-bold text-indigo-300">{selectedEntry.title}</h3>
          <p className="rounded-xl border border-indigo-800/30 bg-indigo-950/30 p-2 text-xs font-medium leading-relaxed text-slate-200">
            <strong className="text-cyan-300">一句话说明：</strong>
            {selectedEntry.summary}
          </p>
          <p className="pt-1 text-xs leading-relaxed text-slate-400">
            {selectedEntry.detail}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95"
        >
          我明白了
        </button>
      </section>
    </div>
  )
}
