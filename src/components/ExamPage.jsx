/**
 * 考试页面组件
 * 
 * 功能：核心考试界面，整合以下子组件：
 * - ExamTimer: 倒计时显示
 * - QuestionSidebar: 题目导航侧边栏
 * - QuestionCard: 题目卡片
 * - ExamResultModal: 考试结果弹窗
 * 
 * 主要功能：
 * - 90分钟倒计时（剩余10分钟变红警示）
 * - 题目导航侧边栏（按题型分组，显示答题状态）
 * - 单题模式和全览模式切换
 * - 自动切题功能（单选/判断题答对后自动跳转）
 * - 一键预答功能（单选选A、多选全选、判断选对）
 * - 考试结果计算与展示（弹窗形式）
 * - 错题回顾模式（查看错题和解析）
 * - 考试状态持久化（刷新页面不丢失，localStorage存储）
 * - 全览模式滚动定位（点击侧边栏题目自动滚动居中）
 * 
 * Props:
 * - examState: object - 考试状态（题目、答案、时间等）
 * - setPage: function - 页面切换函数
 */
import { useState, useEffect, useRef } from 'react'
import { calcScore, clearExamState, STORAGE_KEY } from '../utils/examUtils'
import { Modal, Tooltip, FloatButton, Button, notification, Dropdown, Space, Popconfirm, message } from 'antd'
import { LeftOutlined, RightOutlined, RollbackOutlined, VerticalLeftOutlined, VerticalRightOutlined, CheckOutlined, CloseOutlined, VerticalAlignTopOutlined, QuestionCircleOutlined, BarChartOutlined, DownOutlined, EllipsisOutlined } from '@ant-design/icons'
import ExamTimer from './ExamTimer'
import QuestionSidebar from './QuestionSidebar'
import QuestionCard from './QuestionCard'
import ExamResultModal from './ExamResultModal'

// 从 localStorage 恢复考试状态
function loadExamState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load exam state:', e)
  }
  return null
}

// 保存考试状态到 localStorage
function saveExamState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save exam state:', e)
  }
}

export default function ExamPage({ examState, setPage }) {
  // 优先使用传入的 examState，如果与 localStorage 中的不同（新的随机卷），则清除旧缓存
  const [state, setState] = useState(() => {
    const saved = loadExamState()
    // 如果 localStorage 中有保存的状态，且试卷名称与传入的不同，说明是新考试
    if (saved && saved.paperName !== examState?.paperName) {
      clearExamState()
      return examState
    }
    // 否则使用 localStorage 中保存的状态（支持刷新恢复）
    return saved || examState
  })

  // 如果 state 为 null 或没有题目，跳转到首页
  if (!state || !state.questions || state.questions.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>考试数据加载失败或不存在，请返回首页重新开始</p>
        <button onClick={() => setPage('home')} style={{ marginTop: 10, padding: '8px 16px' }}>返回首页</button>
      </div>
    )
  }
  const timerRef = useRef(null)
  const [viewMode, setViewMode] = useState('single') // single | overview
  const [showResultModal, setShowResultModal] = useState(false)
  const [examResult, setExamResult] = useState(null)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const sidebarRef = useRef(null)
  const [showParse, setShowParse] = useState(true)
  const [showWrongOnly, setShowWrongOnly] = useState(false)
  const [examHistory, setExamHistory] = useState([])

  useEffect(() => {
    if (examResult?.history) {
      setExamHistory(examResult.history)
    }
  }, [examResult])

  /**
   * 一键预答所有题目
   * 
   * 自动填充所有题目的默认答案：
   * - 单选题：选A
   * - 判断题：选第一个选项（通常是"对"）
   * - 多选题：全选所有选项
   */
  const preselectAll = () => {
    const newAnswers = {}
    state.questions.forEach((qq, idx) => {
      if (qq.type === 'single') {
        newAnswers[idx] = ['A']
      } else if (qq.type === 'judge') {
        newAnswers[idx] = [qq.options[0]]
      } else if (qq.type === 'multiple') {
        const keys = qq.options.map(opt => opt.charAt(0))
        newAnswers[idx] = keys.sort()
      }
    })
    setState(prev => ({ ...prev, answers: newAnswers }))
  }

  /**
   * 一键预选通知
   * 
   * 考试开始1秒后显示通知，提示用户可以一键预答所有题目。
   * 使用 preselectModalShown 状态标记，确保刷新页面后不再显示。
   */
  useEffect(() => {
    if (state.preselectModalShown) return

    const timer = setTimeout(() => {
      const key = `preselect-${Date.now()}`
      const btn = (
        <Button type="primary" size="small" onClick={() => {
          preselectAll()
          notification.destroy(key)
        }}>
          确认预选
        </Button>
      )
      notification.open({
        message: '⚡ 一键预选',
        description: '自动填充所有题目答案：单选选A、多选全选、判断选对',
        btn,
        key,
        duration: 0, // 不自动关闭
      })
      setState(prev => ({ ...prev, preselectModalShown: true }))
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  /**
   * 考试计时器
   * 
   * 每秒减少1秒时间，当时间耗尽时自动结束考试。
   * 使用 timerRef 保存定时器引用，确保组件卸载时能正确清除。
   */
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

  /**
   * 考试状态持久化
   * 
   * 将考试状态保存到 localStorage，支持刷新页面后恢复考试进度。
   * 考试结束后不再保存（避免重复提交）。
   */
  useEffect(() => {
    if (state && !state.finished) {
      saveExamState(state)
    }
  }, [state])

  /**
   * 考试结束处理
   * 
   * 当考试结束时（finished=true），计算考试结果并清除 localStorage 中的状态。
   * 使用 examResult 状态防止重复计算。
   */
  useEffect(() => {
    if (state.finished) {
      clearInterval(timerRef.current)
      clearExamState()
    }
  }, [state.finished, clearExamState])

  /**
   * 计算考试结果
   * 
   * 遍历所有题目，统计正确、错误、未答数量，计算百分制分数。
   * 每题0.5分，满分=题目数×0.5。
   * 计算完成后更新状态为回顾模式，并显示结果弹窗。
   */
  const calculateResult = () => {
    const { questions, answers } = state
    let rawScore = 0
    let correct = 0, wrong = 0, unanswered = 0

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
      paperName: state.paperName,
      questionsWithStatus
    }

    const newHistory = [
      ...examHistory,
      {
        round: examHistory.length + 1,
        total: questions.length,
        correct,
        wrong
      }
    ]

    setExamHistory(newHistory)
    setExamResult({ ...result, history: newHistory })
    setState(prev => ({ 
      ...prev, 
      mode: 'review',
      questions: questionsWithStatus 
    }))
    setShowResultModal(true)
  }

  /**
   * 交卷
   * 
   * 将考试状态标记为已完成，触发结果计算。
   */
  const submitExam = () => {
    setState(prev => ({ ...prev, finished: true }))
    setTimeout(() => {
      calculateResult()
    }, 0)
  }

  /**
   * 错题重考
   * 
   * 收集所有答错的题目，重置为新的考试状态，重新开始答题。
   * 保留原有的自动切题设置，但不显示一键预选通知。
   */
  const reExamWrong = () => {
    const wrongQuestions = state.questions.filter(qq => qq.status === 'wrong')
    
    if (wrongQuestions.length === 0) {
      message.info('没有错题需要重考')
      return
    }
    
    const resetQuestions = wrongQuestions.map(qq => ({
      ...qq,
      status: null,
      userAns: null
    }))
    
    setState({
      questions: resetQuestions,
      answers: {},
      current: 0,
      mode: 'exam',
      finished: false,
      startTime: Date.now(),
      timeLeft: 90 * 60,
      paperName: `${state.paperName} - 错题重考`,
      autoNext: state.autoNext,
      showPreselectNotification: false
    })
    
    setExamResult(null)
    setShowParse(false)
    setShowWrongOnly(false)
    setShowResultModal(false)
    
    message.success(`错题重考已开始，共 ${wrongQuestions.length} 道错题需要重考`)
  }

  const q = state.questions[state.current]
  const total = state.questions.length
  const answered = Object.keys(state.answers).length
  const isLast = state.current === total - 1
  const isReviewMode = state.mode === 'review'

  /**
   * 错题索引列表
   * 
   * 收集所有状态为 wrong 的题目索引，用于只看错题模式的导航。
   */
  const wrongQuestionIndices = state.questions
    .map((qq, idx) => ({ qq, idx }))
    .filter(({ qq }) => qq.status === 'wrong')
    .map(({ idx }) => idx)

  /**
   * 当前在错题列表中的位置
   */
  const currentWrongIndex = wrongQuestionIndices.indexOf(state.current)

  /**
   * 获取当前题目
   * 
   * 在只看错题模式下，从错题列表中获取当前题目；
   * 如果当前题目不在错题列表中，则返回第一个错题。
   */
  const getCurrentQuestion = () => {
    if (isReviewMode && showWrongOnly && wrongQuestionIndices.length > 0) {
      if (currentWrongIndex === -1) {
        return state.questions[wrongQuestionIndices[0]]
      }
      return state.questions[wrongQuestionIndices[currentWrongIndex]]
    }
    return state.questions[state.current]
  }

  const currentQ = getCurrentQuestion() || state.questions[state.current] || state.questions[0]

  /**
   * 选择选项
   * 
   * 处理用户点击选项的逻辑：
   * - 单选题/判断题：替换当前答案
   * - 多选题：切换选中状态（选中的取消，未选中的添加）
   * - 支持自动切题功能（单选/判断题答对后自动跳转到下一题）
   * 
   * @param {string} key - 选项键（A、B、C、D等）
   */
  const selectOption = (key) => {
    if (state.finished || isReviewMode) return
    const currentAns = state.answers[state.current] || []
    let nextAns
    if (currentQ.type === 'multiple') {
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
    // 自动切题（单选/判断题）
    if (state.autoNext && !isLast && currentQ.type !== 'multiple') {
      setTimeout(() => goQuestion(state.current + 1), 200)
    }
  }

  /**
   * 跳转题目
   * 
   * 切换到指定索引的题目，并在全览模式下自动滚动到该题目位置。
   * 使用 IntersectionObserver 监听题目元素进入视口后再触发突出动画，
   * 确保动画在题目真正可见时才开始显示。
   * 
   * @param {number} idx - 目标题目索引
   * @param {boolean} fromSidebar - 是否从侧边栏点击（默认false，从题目卡片点击）
   */
  const goQuestion = (idx, fromSidebar = false) => {
    setState(prev => ({ ...prev, current: idx }))
    if (viewMode === 'overview' && fromSidebar) {
      setTimeout(() => {
        const overviewItem = document.querySelector(`.overview-item[data-original-index="${idx}"]`)
        if (overviewItem) {
          overviewItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                overviewItem.classList.add('highlight')
                setTimeout(() => {
                  overviewItem.classList.remove('highlight')
                }, 1800)
                observer.disconnect()
              }
            })
          }, { threshold: 0.3 })
          
          observer.observe(overviewItem)
        }
      }, 50)
    }
  }

  /**
   * 跳转到下一道错题
   * 
   * 在只看错题模式下，跳转到当前错题的下一道错题。
   */
  const goNextWrong = () => {
    if (currentWrongIndex < wrongQuestionIndices.length - 1) {
      setState(prev => ({ ...prev, current: wrongQuestionIndices[currentWrongIndex + 1] }))
    }
  }

  /**
   * 跳转到上一道错题
   * 
   * 在只看错题模式下，跳转到当前错题的上一道错题。
   */
  const goPrevWrong = () => {
    if (currentWrongIndex > 0) {
      setState(prev => ({ ...prev, current: wrongQuestionIndices[currentWrongIndex - 1] }))
    }
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = state.answers[state.current] || []

  // 全览模式渲染
  const renderOverview = () => {
    const filteredQuestions = showWrongOnly
      ? state.questions.filter((qq, idx) => qq.status === 'wrong')
      : state.questions

    return (
      <div className="exam-overview">
        {/* 全览模式工具栏 */}
        <div className="exam-toolbar">
          {isReviewMode && (
            <Space.Compact>
              <Button className="toolbar-btn result-btn" onClick={() => setShowResultModal(true)} style={{ minWidth: '100px' }}>
                考试结果
              </Button>
              <Dropdown 
                menu={{
                  items: [
                    {
                      key: 'showParse',
                      label: showParse ? '不看解析' : '查看解析',
                      onClick: () => setShowParse(!showParse)
                    },
                    {
                      key: 'showWrongOnly',
                      label: showWrongOnly ? '全部题目' : '只看错题',
                      onClick: () => setShowWrongOnly(!showWrongOnly)
                    },
                    {
                      key: 'reExamWrong',
                      label: (
                        <Popconfirm
                          title="确认重考错题？"
                          description="将重新开始答题，当前答案将被清空。"
                          onConfirm={reExamWrong}
                          okText="确认"
                          cancelText="取消"
                          disabled={wrongQuestionIndices.length === 0}
                        >
                          <span>{wrongQuestionIndices.length === 0 ? '无错题可重考' : '重考错题'}</span>
                        </Popconfirm>
                      )
                    }
                  ]
                }}
                placement="bottomRight"
              >
                <Button className="toolbar-btn" icon={<EllipsisOutlined />} />
              </Dropdown>
            </Space.Compact>
          )}
          <Tooltip title="返回单题模式">
            <Button className="toolbar-btn" onClick={() => setViewMode('single')}>
              <RollbackOutlined />
            </Button>
          </Tooltip>
          <Tooltip title={sidebarHidden ? '显示侧边栏' : '隐藏侧边栏'}>
            <Button className="toolbar-btn sidebar-toggle-btn" onClick={() => setSidebarHidden(!sidebarHidden)}>
              {sidebarHidden ? <VerticalRightOutlined /> : <VerticalLeftOutlined />}
            </Button>
          </Tooltip>
        </div>
        {filteredQuestions.map((qq, idx) => {
          const originalIdx = state.questions.indexOf(qq)
          const ans = state.answers[originalIdx] || []
          const statusClass = isReviewMode && qq.status ? `status-${qq.status}` : ''
          // 在只看错题模式下显示重新排列的编号，否则显示原始编号
          const displayIndex = showWrongOnly ? idx + 1 : originalIdx + 1
          return (
            <div 
              key={originalIdx} 
              className={`overview-item ${originalIdx === state.current ? 'current' : ''} ${statusClass}`}
              data-original-index={originalIdx}
              onClick={() => goQuestion(originalIdx)}
            >
              <div className="overview-header">
                <span className="overview-index">{displayIndex}</span>
                <span className={`overview-type type-${qq.type}`}>{typeMap[qq.type]}</span>
              </div>
              <div className="overview-question">{qq.question}</div>
              <div className="options-list">
                {qq.options.map((opt, optIdx) => {
                  // 判断题使用完整选项文字作为key，其他题型使用第一个字符
                  const key = qq.type === 'judge' ? opt : opt.charAt(0)
                  const selected = isReviewMode ? qq.userAns?.includes(key) : ans.includes(key)
                  const isCorrect = qq.answer.includes(key)
                  // 判断这道题是否答错了
                  const isWrong = isReviewMode && qq.status === 'wrong'
                  let optionClass = selected ? 'selected' : ''

                  // 回顾模式下的图标显示
                  let Icon = null
                  let iconStyle = {}
                  if (isReviewMode) {
                    // 用户选择的答案始终是蓝色加粗
                    if (selected) {
                      optionClass = 'selected'
                    }
                    // 如果这道题答错了，正确答案显示绿色加粗
                    if (isWrong && isCorrect) {
                      optionClass += ' correct-answer'
                    }

                    if (selected && isCorrect) {
                      // 用户选对了
                      Icon = CheckOutlined
                      iconStyle = { color: '#52c41a' }
                    } else if (selected && !isCorrect) {
                      // 用户选错了
                      Icon = CloseOutlined
                      iconStyle = { color: '#ff4d4f' }
                    } else if (!selected && isCorrect && isWrong) {
                      // 正确答案但用户没选（题目答错时显示）
                      Icon = CheckOutlined
                      iconStyle = { color: '#52c41a' }
                    }
                  }

                  const handleOptionClick = (e) => {
                    e.stopPropagation()
                    if (isReviewMode) return
                    let newAns = [...ans]
                    if (qq.type === 'multiple') {
                      if (newAns.includes(key)) {
                        newAns = newAns.filter(k => k !== key)
                      } else {
                        newAns.push(key)
                      }
                    } else {
                      newAns = [key]
                    }
                    setState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, [idx]: newAns }
                    }))
                  }

                  return (
                    <div 
                      key={optIdx} 
                      className={`option-row ${optionClass} ${isReviewMode ? 'readonly' : ''}`}
                      onClick={handleOptionClick}
                    >
                      <span className="option-text">{opt}</span>
                      {Icon && <Icon style={{ marginLeft: 8, fontSize: 16, ...iconStyle }} />}
                    </div>
                  )
                })}
              </div>
              {isReviewMode && showParse && qq.parse && (
                <div className="parse-box show">
                  <div className="parse-title"><QuestionCircleOutlined /> 解析</div>
                  <div className="parse-text">{qq.parse}</div>
                  <div className="parse-answer">
                    正确答案：{qq.answer.join(', ')} · 你的答案：{qq.userAns?.length ? qq.userAns.join(', ') : '未选'}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="exam-page">
      {/* 左侧边栏 - 考试信息 */}
      <div 
        ref={sidebarRef}
        className={`exam-sidebar ${sidebarHidden ? 'hidden' : ''}`}
      >
        {!isReviewMode && (
          <div className="sidebar-header">
            <ExamTimer timeLeft={state.timeLeft} />
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
        <QuestionSidebar
          questions={state.questions}
          current={state.current}
          answers={state.answers}
          isReviewMode={isReviewMode}
          onGoQuestion={(idx) => goQuestion(idx, true)}
          showSubmit={!isReviewMode && total - answered === 0}
          onSubmit={submitExam}
          filter={showWrongOnly ? 'wrong' : 'all'}
        />
      </div>

      {/* 右侧主内容 - 试题 */}
      <div className={`exam-main ${sidebarHidden ? 'full-width' : ''}`}>
        {viewMode === 'single' ? (
          <>
            <QuestionCard
              question={currentQ}
              currentAns={currentAns}
              currentIndex={state.current}
              total={total}
              isReviewMode={isReviewMode}
              onSelectOption={selectOption}
              showNav={!state.autoNext}
              onPrev={isReviewMode && showWrongOnly ? goPrevWrong : () => goQuestion(state.current - 1)}
              onNext={isReviewMode && showWrongOnly ? goNextWrong : () => goQuestion(state.current + 1)}
              onSubmit={submitExam}
              showSubmit={false}
              autoNext={state.autoNext}
              onToggleAutoNext={() => setState(prev => ({ ...prev, autoNext: !prev.autoNext }))}
              viewMode={viewMode}
              onToggleViewMode={() => setViewMode(viewMode === 'single' ? 'overview' : 'single')}
              sidebarHidden={sidebarHidden}
              onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
              showConfirmNext={state.autoNext && !isReviewMode && currentQ.type === 'multiple' && !isLast}
              showResultModal={showResultModal}
              onShowResult={() => setShowResultModal(true)}
              showParse={showParse}
              onToggleShowParse={() => setShowParse(!showParse)}
              showWrongOnly={showWrongOnly}
              onToggleShowWrongOnly={() => setShowWrongOnly(!showWrongOnly)}
              isWrongOnlyMode={isReviewMode && showWrongOnly}
              wrongQuestionIndices={wrongQuestionIndices}
              onReExamWrong={reExamWrong}
            />
          </>
        ) : (
          renderOverview()
        )}
        {viewMode === 'overview' && (
          <div className="back-to-top-fixed">
            <FloatButton
              icon={<VerticalAlignTopOutlined />}
              onClick={() => {
                const overviewEl = document.querySelector('.exam-overview')
                if (overviewEl) {
                  overviewEl.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
            />
          </div>
        )}
      </div>

      {/* 考试结果模态框 */}
      <ExamResultModal
        visible={showResultModal}
        result={examResult}
        onClose={() => setShowResultModal(false)}
      />
    </div>
  )
}