import { useState, useEffect, useRef } from 'react'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function ExamPage({ examState, setPage, setExamState }) {
  const [state, setState] = useState(examState)
  const timerRef = useRef(null)
  const sidebarRef = useRef(null)
  const [headerVisible, setHeaderVisible] = useState(true)

  // 计时器
  useEffect(() => {
    if (state.finished) return
    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current)
          return { ...prev, timeLeft: 0, finished: true }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [state.finished])

  // 自动交卷
  useEffect(() => {
    if (state.finished) {
      clearInterval(timerRef.current)
      setExamState(state)
      setPage('result')
    }
  }, [state.finished])

  // 滚动监听：当单选题标签碰到顶部时隐藏计时和统计
  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleScroll = () => {
      const scrollTop = sidebar.scrollTop
      const hideThreshold = 150
      const showThreshold = 30
      
      if (headerVisible && scrollTop > hideThreshold) {
        setHeaderVisible(false)
      } else if (!headerVisible && scrollTop < showThreshold) {
        setHeaderVisible(true)
      }
    }

    sidebar.addEventListener('scroll', handleScroll, { passive: true })
    return () => sidebar.removeEventListener('scroll', handleScroll)
  }, [headerVisible])

  const q = state.questions[state.current]
  const total = state.questions.length
  const answered = Object.keys(state.answers).length
  const isLast = state.current === total - 1

  const selectOption = (key) => {
    if (state.finished) return
    const currentAns = state.answers[state.current] || []
    let nextAns
    if (q.type === 'multiple') {
      nextAns = currentAns.includes(key)
        ? currentAns.filter(k => k !== key)
        : [...currentAns, key].sort()
    } else {
      nextAns = [key]
    }
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.current]: nextAns }
    }))
    // 自动切题：单选/判断题选完直接切，多选题需要等再次点击确认或手动切
    if (state.autoNext && !isLast && q.type !== 'multiple') {
      setTimeout(() => goQuestion(state.current + 1), 200)
    }
  }

  const submitExam = () => {
    if (!confirm('确定交卷？')) return
    setState(prev => ({ ...prev, finished: true }))
  }

  const goQuestion = (idx) => {
    setState(prev => ({ ...prev, current: idx }))
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = state.answers[state.current] || []

  return (
    <div className="exam-page">
      {/* 左侧边栏 - 考试信息 */}
      <div ref={sidebarRef} className="exam-sidebar">
        <div className={`sidebar-header ${headerVisible ? '' : 'hidden'}`}>
          <div className="timer-box">
            <div className={state.timeLeft < 600 ? 'timer-danger' : 'timer-normal'}>
              ⏱️ {formatTime(state.timeLeft)}
            </div>
          </div>
          <div className="answer-stats">
            <div className="stat-item">
              <span className="stat-label stat-answered">已答</span>
              <span className="stat-value">{answered}/{total}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-label stat-unanswered">未答</span>
              <span className="stat-value">{total - answered}</span>
            </div>
          </div>
        </div>
        <div className="sidebar-scroll">
          <div className="qnum-grid">
            {/* 单选题 1-100 */}
            <div className="qnum-group-label">单选题 1-100</div>
            {state.questions.slice(0, 100).map((qq, idx) => {
              const hasAns = !!state.answers[idx]
              const isCurrent = idx === state.current
              return (
                <button
                  key={idx}
                  className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''}`}
                  onClick={() => goQuestion(idx)}
                  title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
                >
                  {idx + 1}
                </button>
              )
            })}

            {/* 多选题 101-140 */}
            <div className="qnum-group-label">多选题 101-140</div>
            {state.questions.slice(100, 140).map((qq, idx) => {
              const realIdx = idx + 100
              const hasAns = !!state.answers[realIdx]
              const isCurrent = realIdx === state.current
              return (
                <button
                  key={realIdx}
                  className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''}`}
                  onClick={() => goQuestion(realIdx)}
                  title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
                >
                  {realIdx + 1}
                </button>
              )
            })}

            {/* 判断题 141-200 */}
            <div className="qnum-group-label">判断题 141-200</div>
            {state.questions.slice(140).map((qq, idx) => {
              const realIdx = idx + 140
              const hasAns = !!state.answers[realIdx]
              const isCurrent = realIdx === state.current
              return (
                <button
                  key={realIdx}
                  className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''}`}
                  onClick={() => goQuestion(realIdx)}
                  title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
                >
                  {realIdx + 1}
                </button>
              )
            })}
          </div>
        </div>
        {total - answered === 0 && (
          <div className="sidebar-footer">
            <button className="btn-submit-exam" onClick={submitExam}>交卷</button>
          </div>
        )}
      </div>

      {/* 右侧主内容 - 试题 */}
      <div className="exam-main">
        <div className="exam-card">
          <div className="exam-toolbar">
            <label className="auto-next-toggle">
              <input
                type="checkbox"
                checked={state.autoNext}
                onChange={e => setState(prev => ({ ...prev, autoNext: e.target.checked }))}
              />
              <span>自动切题</span>
            </label>
          </div>
          <div className="exam-header">
            <span className="q-index">第 {state.current + 1} / {total} 题</span>
            <span className={`q-type-badge type-${q.type}`}>{typeMap[q.type]}</span>
          </div>

          <div className="question-text">{q.question}</div>

          <div className="options-list">
            {q.options.map((opt, idx) => {
              const key = opt.charAt(0)
              const selected = currentAns.includes(key)
              return (
                <div
                  key={idx}
                  className={`option-row ${selected ? 'selected' : ''}`}
                  onClick={() => selectOption(key)}
                >
                  <span className="option-key">{key}</span>
                  <span className="option-text">{opt}</span>
                </div>
              )
            })}
          </div>

          <div className="exam-nav">
            {!state.autoNext && (
              <>
                <button disabled={state.current === 0} onClick={() => goQuestion(state.current - 1)}>上一题</button>
                <button disabled={isLast} onClick={() => goQuestion(state.current + 1)}>下一题</button>
              </>
            )}
            {isLast && total - answered === 0 && <button className="btn-primary" onClick={submitExam}>交卷</button>}
          </div>
        </div>
      </div>
    </div>
  )
}