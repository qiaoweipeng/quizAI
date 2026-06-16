/**
 * 练习模式页面组件
 * 
 * 专项练习界面，无时间限制，支持即时查看解析。
 * 
 * 功能特性：
 * - 单题模式答题，支持单选/多选/判断题型
 * - 即时查看解析和正确答案
 * - 显示用户答案与正确答案对比
 * - 自由切换上一题/下一题
 * - 无时间限制，学习压力小
 * 
 * Props:
 * @param {object} state - 练习状态对象
 * @param {array} state.questions - 题目数组
 * @param {object} state.answers - 用户答案对象
 * @param {number} state.current - 当前题目索引
 * @param {object} state.showParse - 解析显示状态
 * @param {function} setPage - 页面切换函数
 */
import { useState } from 'react'
import { Button, Modal } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

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
      Modal.confirm({
        title: '结束练习',
        content: '已经是最后一题，是否结束练习？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => setPage('home')
      })
    } else {
      setS(prev => ({ ...prev, current: prev.current + 1 }))
    }
  }

  const prev = () => {
    if (s.current > 0) setS(prev => ({ ...prev, current: prev.current - 1 }))
  }

  const handleExit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    Modal.confirm({
      title: '确认退出',
      content: '确定退出练习？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => setPage('home')
    })
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = s.answers[s.current] || []
  const hasParse = s.showParse[s.current]

  return (
    <div className="practice-page">
      <div className="practice-header">
        <span>专项练习 · {typeMap[q.type]} · 第 {s.current + 1} / {total} 题</span>
        <Button className="btn-link" onClick={handleExit}>退出</Button>
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
                <span className="option-text">{opt}</span>
              </div>
            )
          })}
        </div>

        {!hasParse && (
          <div className="practice-actions">
            <Button className="btn-secondary" onClick={showParse}>查看解析</Button>
          </div>
        )}

        {hasParse && (
          <div className="parse-box show">
            <div className="parse-title"><QuestionCircleOutlined /> 解析</div>
            <div className="parse-text">{q.parse || '暂无解析'}</div>
            <div className="parse-answer">
              正确答案：{q.answer.join(', ')} · 你的答案：{currentAns.length ? currentAns.join(', ') : '未选'}
            </div>
          </div>
        )}

        <div className="exam-nav">
          <Button disabled={s.current === 0} onClick={prev}>上一题</Button>
          <Button onClick={next}>{isLast ? '结束练习' : '下一题'}</Button>
        </div>
      </div>
    </div>
  )
}