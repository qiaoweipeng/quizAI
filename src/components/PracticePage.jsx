/**
 * 练习模式页面组件
 * 
 * 功能：专项练习界面，支持：
 * - 单题模式答题
 * - 即时查看解析
 * - 显示正确答案和用户答案对比
 * - 自由切换上一题/下一题
 * - 无时间限制
 * 
 * Props:
 * - state: object - 练习状态（题目、答案、当前题索引等）
 * - setPage: function - 页面切换函数
 */
import { useState } from 'react'

export default function PracticePage({ state, setPage }) {
  const [s, setS] = useState(state)
  const q = s.questions[s.current]
  const total = s.questions.length
  const isLast = s.current === total - 1

  const selectOption = (key) => {
    const currentAns = s.answers[s.current] || []
    let nextAns
    if (q.type === 'multiple') {
      nextAns = currentAns.includes(key)
        ? currentAns.filter(k => k !== key)
        : [...currentAns, key].sort()
    } else {
      nextAns = [key]
    }
    setS(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.current]: nextAns }
    }))
  }

  const showParse = () => {
    setS(prev => ({ ...prev, showParse: { ...prev.showParse, [prev.current]: true } }))
  }

  const next = () => {
    if (isLast) {
      if (confirm('已经是最后一题，是否结束练习？')) setPage('home')
    } else {
      setS(prev => ({ ...prev, current: prev.current + 1 }))
    }
  }

  const prev = () => {
    if (s.current > 0) setS(prev => ({ ...prev, current: prev.current - 1 }))
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = s.answers[s.current] || []
  const hasParse = s.showParse[s.current]

  return (
    <div className="practice-page">
      <div className="practice-header">
        <span>专项练习 · {typeMap[q.type]} · 第 {s.current + 1} / {total} 题</span>
        <button className="btn-text" onClick={() => { if (confirm('确定退出练习？')) setPage('home') }}>退出</button>
      </div>

      <div className="practice-card">
        <div className="question-text">{q.question}</div>
        <div className="options-list">
          {q.options.map((opt, idx) => {
            const key = opt.charAt(0)
            const selected = currentAns.includes(key)
            let cls = 'option-row'
            if (hasParse) {
              if (q.answer.includes(key)) cls += ' correct'
              else if (selected && !q.answer.includes(key)) cls += ' wrong'
            } else if (selected) {
              cls += ' selected'
            }
            return (
              <div key={idx} className={cls} onClick={() => !hasParse && selectOption(key)}>
                <span className="option-key">{key}</span>
                <span className="option-text">{opt}</span>
              </div>
            )
          })}
        </div>

        {!hasParse && (
          <div className="practice-actions">
            <button className="btn-secondary" onClick={showParse}>查看解析</button>
          </div>
        )}

        {hasParse && (
          <div className="parse-box show">
            <div className="parse-title">📖 解析</div>
            <div className="parse-text">{q.parse || '暂无解析'}</div>
            <div className="parse-answer">
              正确答案：{q.answer.join(', ')} · 你的答案：{currentAns.length ? currentAns.join(', ') : '未选'}
            </div>
          </div>
        )}

        <div className="exam-nav">
          <button disabled={s.current === 0} onClick={prev}>上一题</button>
          <button onClick={next}>{isLast ? '结束练习' : '下一题'}</button>
        </div>
      </div>
    </div>
  )
}