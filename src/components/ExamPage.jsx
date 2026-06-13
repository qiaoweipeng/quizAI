/**
 * 考试页面组件
 * 
 * 功能：核心考试界面，整合以下子组件：
 * - ExamTimer: 倒计时显示
 * - QuestionSidebar: 题目导航侧边栏
 * - QuestionCard: 题目卡片
 * - PreselectModal: 一键预答弹窗
 * - ExamResultModal: 考试结果弹窗
 * 
 * 主要功能：
 * - 90分钟倒计时
 * - 题目导航侧边栏（按题型分组）
 * - 单题模式和全览模式切换
 * - 自动切题功能
 * - 一键预答功能
 * - 考试结果计算与展示
 * - 错题回顾模式
 * - 考试状态持久化（刷新页面不丢失）
 * 
 * Props:
 * - examState: object - 考试状态（题目、答案、时间等）
 * - setPage: function - 页面切换函数
 */
import { useState, useEffect, useRef } from 'react'
import { calcScore, clearExamState } from '../utils/examUtils'
import { Modal, Tooltip, FloatButton } from 'antd'
import { LeftOutlined, RightOutlined, RollbackOutlined, VerticalLeftOutlined, VerticalRightOutlined, CheckOutlined, CloseOutlined, VerticalAlignTopOutlined } from '@ant-design/icons'
import ExamTimer from './ExamTimer'
import QuestionSidebar from './QuestionSidebar'
import QuestionCard from './QuestionCard'
import ExamResultModal from './ExamResultModal'

const STORAGE_KEY = 'exam_state'

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
  const [preselectModalVisible, setPreselectModalVisible] = useState(false)

  // 如果 state 为 null，显示加载状态
  if (!state) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>正在加载考试数据...</p>
      </div>
    )
  }
  const timerRef = useRef(null)
  const [viewMode, setViewMode] = useState('single') // single | overview
  const [showResultModal, setShowResultModal] = useState(false)
  const [examResult, setExamResult] = useState(null)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const sidebarRef = useRef(null)

  // 一键预选题
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
    setPreselectModalVisible(false)
  }

  // 一键预选 Modal - 只有首次开始考试时显示（刷新页面不显示）
  useEffect(() => {
    // 如果已经显示过一键预选对话框，则不再显示
    if (state.preselectModalShown) return

    const timer = setTimeout(() => {
      setPreselectModalVisible(true)
      // 标记已显示过
      setState(prev => ({ ...prev, preselectModalShown: true }))
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 一键预选 Modal
  const handlePreselectModal = () => {
    setPreselectModalVisible(false)
    preselectAll()
  }

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

  // 保存考试状态到 localStorage
  useEffect(() => {
    if (state && !state.finished) {
      saveExamState(state)
    }
  }, [state])

  // 考试结束时计算结果并清除存储
  useEffect(() => {
    if (state.finished && !examResult) {
      clearInterval(timerRef.current)
      clearExamState() // 考试结束后清除存储
      calculateResult()
    }
  }, [state.finished])

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

    setExamResult(result)
    setState(prev => ({ 
      ...prev, 
      mode: 'review',
      questions: questionsWithStatus 
    }))
    setShowResultModal(true)
  }

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
    // 自动切题
    if (state.autoNext && !isLast && q.type !== 'multiple') {
      setTimeout(() => goQuestion(state.current + 1), 200)
    }
  }

  const submitExam = () => {
    setState(prev => ({ ...prev, finished: true }))
  }

  const goQuestion = (idx) => {
    setState(prev => ({ ...prev, current: idx }))
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = state.answers[state.current] || []

  // 全览模式渲染
  const renderOverview = () => {
    return (
      <div className="exam-overview">
        {/* 全览模式工具栏 */}
        <div className="exam-toolbar">
          <Tooltip title="返回单题模式">
            <button 
              className="toolbar-btn"
              onClick={() => setViewMode('single')}
            >
              <RollbackOutlined />
            </button>
          </Tooltip>
          <Tooltip title={sidebarHidden ? '显示侧边栏' : '隐藏侧边栏'}>
            <button 
              className="toolbar-btn sidebar-toggle-btn"
              onClick={() => setSidebarHidden(!sidebarHidden)}
            >
              {sidebarHidden ? <VerticalRightOutlined /> : <VerticalLeftOutlined />}
            </button>
          </Tooltip>
        </div>
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

                  if (isReviewMode) {
                    // 用户选择的答案始终是蓝色加粗
                    if (selected) {
                      optionClass = 'selected'
                    }
                    // 如果这道题答错了，正确答案显示绿色加粗
                    if (isWrong && isCorrect) {
                      optionClass += ' correct-answer'
                    }
                  }

                  return (
                    <div key={optIdx} className={`option-row ${optionClass} readonly`}>
                      <span className="option-text">{opt}</span>
                    </div>
                  )
                })}
              </div>
              {isReviewMode && qq.parse && (
                <div className="parse-box show">
                  <div className="parse-title">📖 解析</div>
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
      {/* 一键预选 Modal */}
      <Modal
        title="⚡ 一键预选"
        open={preselectModalVisible}
        onCancel={() => setPreselectModalVisible(false)}
        maskClosable={true}
        footer={[
          <button key="cancel" onClick={() => setPreselectModalVisible(false)} style={{ padding: '6px 16px', marginRight: 8, border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>
            取消
          </button>,
          <button key="confirm" onClick={handlePreselectModal} style={{ padding: '6px 16px', border: 'none', borderRadius: 4, background: '#1890ff', color: '#fff', cursor: 'pointer' }}>
            确认预选
          </button>
        ]}
      >
        <p>自动填充所有题目答案：单选选A、多选全选、判断选对</p>
      </Modal>

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
          onGoQuestion={goQuestion}
          showSubmit={!isReviewMode && total - answered === 0}
          onSubmit={submitExam}
        />
      </div>

      {/* 右侧主内容 - 试题 */}
      <div className={`exam-main ${sidebarHidden ? 'full-width' : ''}`}>
        {viewMode === 'single' ? (
          <>
            <QuestionCard
              question={q}
              currentAns={currentAns}
              currentIndex={state.current}
              total={total}
              isReviewMode={isReviewMode}
              onSelectOption={selectOption}
              showNav={!state.autoNext || (isLast && total - answered === 0)}
              onPrev={() => goQuestion(state.current - 1)}
              onNext={() => goQuestion(state.current + 1)}
              onSubmit={submitExam}
              showSubmit={!isReviewMode && isLast && total - answered === 0}
              autoNext={state.autoNext}
              onToggleAutoNext={() => setState(prev => ({ ...prev, autoNext: !prev.autoNext }))}
              viewMode={viewMode}
              onToggleViewMode={() => setViewMode(viewMode === 'single' ? 'overview' : 'single')}
              sidebarHidden={sidebarHidden}
              onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
              // 自动切题模式下多选题需要确认按钮
              showConfirmNext={state.autoNext && !isReviewMode && q.type === 'multiple' && !isLast}
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