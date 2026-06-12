import { useState, useEffect, useRef } from 'react'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatUsedTime(seconds) {
  if (seconds < 60) {
    return '不足一分钟'
  }
  const minutes = Math.round(seconds / 60)
  return `${minutes} 分钟`
}

// 计分函数
function calcScore(q, userAns) {
  if (!userAns || userAns.length === 0) return 0
  if (q.type === 'multiple') {
    const userSet = new Set(userAns)
    const correctSet = new Set(q.answer)
    if (userSet.size === correctSet.size && [...userSet].every(x => correctSet.has(x))) return 0.5
    for (const u of userSet) {
      if (!correctSet.has(u)) return 0
    }
    return 0
  }
  return userAns[0] === q.answer[0] ? 0.5 : 0
}

export default function ExamPage({ examState, setPage }) {
  const [state, setState] = useState(examState)
  const timerRef = useRef(null)
  const sidebarRef = useRef(null)
  const scrollRef = useRef(null)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [showPreselectModal, setShowPreselectModal] = useState(true)
  const [viewMode, setViewMode] = useState('single') // single | overview
  const [showResultModal, setShowResultModal] = useState(false)
  const [examResult, setExamResult] = useState(null)
  const [sidebarHidden, setSidebarHidden] = useState(false) // 新增：控制侧边栏显示

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

  // 考试结束时计算结果
  useEffect(() => {
    if (state.finished && !examResult) {
      clearInterval(timerRef.current)
      calculateResult()
    }
  }, [state.finished])

  const calculateResult = () => {
    const { questions, answers } = state
    let rawScore = 0
    let correct = 0, wrong = 0, unanswered = 0
    const details = []

    const questionsWithStatus = questions.map((q, idx) => {
      const ans = answers[idx]
      const s = calcScore(q, ans)
      rawScore += s
      let status
      if (!ans || ans.length === 0) {
        unanswered++
        status = 'unanswered'
      } else if (s > 0) {
        correct++
        status = 'correct'
      } else {
        wrong++
        status = 'wrong'
      }
      details.push({ idx, q, ans, score: s, status })
      return { ...q, status, userAns: ans }
    })

    const maxScore = questions.length * 0.5
    const rawPercent = maxScore > 0 ? (rawScore / maxScore) * 100 : 0
    const clampedPercent = Math.max(0, rawPercent)
    const score = clampedPercent % 1 === 0 ? Math.round(clampedPercent) : clampedPercent

    const result = {
      score,
      passed: score >= 60,
      total: questions.length,
      correct,
      wrong,
      unanswered,
      usedTime: 90 * 60 - state.timeLeft,
      wrongList: details.filter(d => d.status === 'wrong' || d.status === 'unanswered'),
      paperName: state.paperName,
      questionsWithStatus
    }

    setExamResult(result)
    setState(prev => ({ 
      ...prev, 
      mode: 'review',
      questions: questionsWithStatus 
    }))
    setShowResultModal(true)
  }

  // 滚动监听：当单选题标签碰到顶部时隐藏计时和统计
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const handleScroll = () => {
      const scrollTop = scrollEl.scrollTop
      const hideThreshold = 150
      const showThreshold = 30
      
      if (headerVisible && scrollTop > hideThreshold) {
        setHeaderVisible(false)
      } else if (!headerVisible && scrollTop < showThreshold) {
        setHeaderVisible(true)
      }
    }

    scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [headerVisible])

  const q = state.questions[state.current]
  const total = state.questions.length
  const answered = Object.keys(state.answers).length
  const isLast = state.current === total - 1
  const isReviewMode = state.mode === 'review'

  const selectOption = (key) => {
    if (state.finished || isReviewMode) return
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

  // 一键预选题
  const preselectAll = () => {
    const newAnswers = {}
    state.questions.forEach((q, idx) => {
      if (q.type === 'single') {
        // 单选题选A
        newAnswers[idx] = ['A']
      } else if (q.type === 'judge') {
        // 判断题选第一个选项（正确）
        newAnswers[idx] = [q.options[0]]
      } else if (q.type === 'multiple') {
        // 多选题全选
        const keys = q.options.map(opt => opt.charAt(0))
        newAnswers[idx] = keys.sort()
      }
    })
    setState(prev => ({ ...prev, answers: newAnswers }))
    setShowPreselectModal(false)
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = state.answers[state.current] || []

  return (
    <div className="exam-page">
      {/* 一键预选题弹窗 */}
      {showPreselectModal && (
        <div className="modal-overlay" onClick={() => setShowPreselectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-body">
              <div className="modal-title">是否需要一键预选？</div>
              <div className="modal-desc">
                <p>一键预选将自动完成以下操作：</p>
                <ul>
                  <li>单选题：全部选择 A 选项</li>
                  <li>多选题：全部选项都选中</li>
                  <li>判断题：全部选择 对(A)</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPreselectModal(false)}>不需要</button>
              <button className="btn-primary" onClick={preselectAll}>确定预选</button>
            </div>
          </div>
        </div>
      )}

      {/* 左侧边栏 - 考试信息 */}
      <div ref={sidebarRef} className={`exam-sidebar ${sidebarHidden ? 'hidden' : ''}`}>
        {!isReviewMode && (
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
        )}
        <div ref={scrollRef} className="sidebar-scroll">
          <div className="qnum-grid">
            {/* 单选题 1-100 */}
            <div className="qnum-group-label">单选题 <span className="qnum-group-range">1-100</span></div>
            {state.questions.slice(0, 100).map((qq, idx) => {
              const hasAns = !!state.answers[idx]
              const isCurrent = idx === state.current
              const statusClass = isReviewMode && qq.status ? qq.status : ''
              return (
                <button
                  key={idx}
                  className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${statusClass}`}
                  onClick={() => goQuestion(idx)}
                  title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
                >
                  {idx + 1}
                </button>
              )
            })}

            {/* 多选题 101-140 */}
            <div className="qnum-group-label">多选题 <span className="qnum-group-range">101-140</span></div>
            {state.questions.slice(100, 140).map((qq, idx) => {
              const realIdx = idx + 100
              const hasAns = !!state.answers[realIdx]
              const isCurrent = realIdx === state.current
              const statusClass = isReviewMode && qq.status ? qq.status : ''
              return (
                <button
                  key={realIdx}
                  className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${statusClass}`}
                  onClick={() => goQuestion(realIdx)}
                  title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
                >
                  {realIdx + 1}
                </button>
              )
            })}

            {/* 判断题 141-200 */}
            <div className="qnum-group-label">判断题 <span className="qnum-group-range">141-200</span></div>
            {state.questions.slice(140).map((qq, idx) => {
              const realIdx = idx + 140
              const hasAns = !!state.answers[realIdx]
              const isCurrent = realIdx === state.current
              const statusClass = isReviewMode && qq.status ? qq.status : ''
              return (
                <button
                  key={realIdx}
                  className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${statusClass}`}
                  onClick={() => goQuestion(realIdx)}
                  title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
                >
                  {realIdx + 1}
                </button>
              )
            })}
          </div>
        </div>
        {!isReviewMode && total - answered === 0 && (
          <div className="sidebar-footer">
            <button className="btn-submit-exam" onClick={submitExam}>交卷</button>
          </div>
        )}
      </div>

      {/* 右侧主内容 - 试题 */}
      <div className={`exam-main ${sidebarHidden ? 'full-width' : ''}`}>
        {viewMode === 'single' ? (
          <div className="exam-card">
            <div className="card-content">
              <div className="exam-toolbar">
            <button 
              className={`toolbar-btn auto-next-btn ${state.autoNext ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, autoNext: !prev.autoNext }))}
              title={state.autoNext ? '切换为手动切题' : '切换为自动切题'}
            >
              {state.autoNext ? '👆' : '⚡'}
            </button>
            <button 
              className={`toolbar-btn view-mode-btn ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode(viewMode === 'single' ? 'overview' : 'single')}
              title={viewMode === 'overview' ? '切换为单题模式' : '切换为全览模式'}
            >
              {viewMode === 'overview' ? '▦' : '▣'}
            </button>
            <button 
              className={`toolbar-btn sidebar-toggle-btn ${sidebarHidden ? 'active' : ''}`}
              onClick={() => setSidebarHidden(!sidebarHidden)}
              title={sidebarHidden ? '显示侧边栏' : '隐藏侧边栏'}
            >
              {sidebarHidden ? '◀' : '▶'}
            </button>
              </div>
              <div className="exam-header">
                <span className="q-index">第 {state.current + 1} / {total} 题</span>
                <span className={`q-type-badge type-${q.type}`}>{typeMap[q.type]}</span>
              </div>

              <div className="question-content">
                <div className="question-text">{q.question}</div>

                <div className="options-list">
                  {q.options.map((opt, idx) => {
                    const key = opt.charAt(0)
                    const selected = isReviewMode ? q.userAns?.includes(key) : currentAns.includes(key)
                    const isCorrect = q.answer.includes(key)
                    let optionClass = ''
                    if (isReviewMode) {
                      if (selected && isCorrect) {
                        optionClass = 'selected correct'
                      } else if (selected && !isCorrect) {
                        optionClass = 'selected wrong'
                      } else if (!selected && isCorrect) {
                        optionClass = 'correct'
                      }
                    } else {
                    optionClass = selected ? 'selected' : ''
                  }
                  return (
                    <div
                      key={idx}
                      className={`option-row ${optionClass} ${isReviewMode ? 'readonly' : ''}`}
                      onClick={() => selectOption(key)}
                    >
                      <span className="option-key">{key}</span>
                      <span className="option-text">{opt}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          {!state.autoNext || (isLast && total - answered === 0) ? (
            <div className="exam-nav">
              {!state.autoNext && (
                <>
                  <button disabled={state.current === 0} onClick={() => goQuestion(state.current - 1)}>上一题</button>
                  <button disabled={isLast} onClick={() => goQuestion(state.current + 1)}>下一题</button>
                </>
              )}
              {!isReviewMode && isLast && total - answered === 0 && <button className="btn-primary" onClick={submitExam}>交卷</button>}
            </div>
          ) : null}
            </div>
        </div>
        ) : (
          /* 全览模式 */
          <div className="exam-overview">
            {state.questions.map((qq, idx) => {
              const ans = state.answers[idx] || []
              const statusClass = isReviewMode && qq.status ? `status-${qq.status}` : ''
              return (
                <div 
                  key={idx} 
                  className={`overview-item ${idx === state.current ? 'current' : ''} ${statusClass}`}
                  onClick={() => goQuestion(idx)}
                >
                  <div className="overview-header">
                    <span className="overview-index">{idx + 1}</span>
                    <span className={`overview-type type-${qq.type}`}>{typeMap[qq.type]}</span>
                    <span className={`overview-status ${ans.length > 0 ? 'answered' : 'unanswered'}`}>
                      {isReviewMode && qq.status ? (qq.status === 'correct' ? '正确' : qq.status === 'wrong' ? '错误' : '未答') : (ans.length > 0 ? '已答' : '未答')}
                    </span>
                  </div>
                  <div className="overview-question">{qq.question}</div>
                  <div className="overview-options">
                    {qq.options.map((opt, optIdx) => {
                      const key = opt.charAt(0)
                      const selected = isReviewMode ? qq.userAns?.includes(key) : ans.includes(key)
                      const isCorrect = qq.answer.includes(key)
                      let optionClass = selected ? 'selected' : ''
                      if (isReviewMode) {
                        if (selected && isCorrect) {
                          optionClass = 'selected correct'
                        } else if (selected && !isCorrect) {
                          optionClass = 'selected wrong'
                        } else if (!selected && isCorrect) {
                          optionClass = 'correct'
                        }
                      }
                      return (
                        <span 
                          key={optIdx} 
                          className={`overview-option ${optionClass}`}
                        >
                          {key}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 考试结果模态框 */}
      {showResultModal && examResult && (
        <div className="modal-overlay" onClick={() => {
          setShowResultModal(false)
        }}>
          <div className="result-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => {
              setShowResultModal(false)
            }}>×</button>
            <div className="result-modal-body">
              <div className="result-title">{examResult.paperName}</div>
              <div className={`score-circle ${examResult.passed ? 'pass' : 'fail'}`}>
                <div className="score-num">{Number.isInteger(examResult.score) ? examResult.score : examResult.score.toFixed(1)}</div>
              </div>
              <div className={`pass-badge ${examResult.passed ? 'pass' : 'fail'}`}>
                {examResult.passed ? '及格' : '不及格'}
              </div>

              <div className="result-stats">
                <div className="stat-item">
                  <div className="stat-num stat-correct">{examResult.correct}</div>
                  <div className="stat-label">正确</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num stat-wrong">{examResult.wrong}</div>
                  <div className="stat-label">错误</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num stat-unanswered">{examResult.unanswered}</div>
                  <div className="stat-label">未答</div>
                </div>
                <div className="stat-item">
                  <div className={`stat-num stat-time ${examResult.usedTime < 60 ? 'short-time' : ''}`}>{formatUsedTime(examResult.usedTime)}</div>
                  <div className="stat-label">用时</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}