/**
 * 练习模式页面组件
 * 
 * 复用考试模式的 UI 组件，提供专项练习界面，无时间限制，支持即时查看解析。
 * 
 * 功能特性：
 * - 单题模式和全览模式切换
 * - 题目导航侧边栏（无题型分组）
 * - 单选/判断题：选择答案后立即显示解析和对错
 * - 多选题：选择答案后显示确认按钮，点击后显示解析和对错
 * - 支持错题本练习
 * - 无时间限制，学习压力小
 * 
 * Props:
 * @param {object} state - 练习状态对象
 * @param {array} state.questions - 题目数组
 * @param {object} state.answers - 用户答案对象
 * @param {number} state.current - 当前题目索引
 * @param {function} setPage - 页面切换函数
 */
import { useState, useEffect, useCallback } from 'react'
import { FloatButton } from 'antd'
import { VerticalAlignTopOutlined } from '@ant-design/icons'
import QuestionCard from '../exam/QuestionCard'
import QuestionSidebar from '../exam/QuestionSidebar'
import ExamOverview from '../exam/ExamOverview'
import { getOptionKey, calcScore } from '../../utils/examUtils'

export default function PracticePage({ state, setPage }) {
  const [practiceState, setPracticeState] = useState(state)
  const [viewMode, setViewMode] = useState('single')
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [questionStatus, setQuestionStatus] = useState({})

  const total = practiceState.questions.length
  const answered = Object.keys(practiceState.answers).length

  useEffect(() => {
    if (viewMode !== 'overview') return

    const handleScroll = () => {
      const overviewEl = document.querySelector('.exam-overview')
      if (overviewEl) {
        setShowBackToTop(overviewEl.scrollTop > 100)
      }
    }

    const overviewEl = document.querySelector('.exam-overview')
    if (overviewEl) {
      overviewEl.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (overviewEl) {
        overviewEl.removeEventListener('scroll', handleScroll)
      }
    }
  }, [viewMode])

  const checkAnswer = useCallback((question, answer) => {
    const score = calcScore(question, answer)
    if (!answer || answer.length === 0) {
      return 'unanswered'
    } else if (score > 0) {
      return 'correct'
    } else {
      return 'wrong'
    }
  }, [])

  const selectOption = useCallback((key) => {
    const currentQ = practiceState.questions[practiceState.current]
    const currentAns = practiceState.answers[practiceState.current] || []
    let nextAns
    if (currentQ.type === 'multiple') {
      nextAns = currentAns.includes(key)
        ? currentAns.filter(k => k !== key)
        : [...currentAns, key].sort()
    } else {
      nextAns = [key]
    }
    setPracticeState(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.current]: nextAns }
    }))
    if (currentQ.type !== 'multiple') {
      const status = checkAnswer(currentQ, nextAns)
      setQuestionStatus(prev => ({ ...prev, [practiceState.current]: status }))
    }
  }, [practiceState, checkAnswer])

  const goQuestion = useCallback((idx) => {
    setPracticeState(prev => ({ ...prev, current: idx }))
  }, [])

  const next = () => {
    const currentQ = practiceState.questions[practiceState.current]
    if (currentQ.type === 'multiple') {
      const currentAns = practiceState.answers[practiceState.current] || []
      const status = checkAnswer(currentQ, currentAns)
      setQuestionStatus(prev => ({ ...prev, [practiceState.current]: status }))
    }
    if (practiceState.current < total - 1) {
      goQuestion(practiceState.current + 1)
    }
  }

  const prev = () => {
    if (practiceState.current > 0) {
      goQuestion(practiceState.current - 1)
    }
  }

  const goQuestionWithScroll = (idx, fromSidebar = false) => {
    goQuestion(idx)
    if (viewMode === 'overview' && fromSidebar) {
      setTimeout(() => {
        const overviewItem = document.querySelector(`.overview-item[data-original-index="${idx}"]`)
        if (overviewItem) {
          overviewItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
    }
  }

  if (!practiceState || !practiceState.questions || practiceState.questions.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>练习数据加载失败或不存在，请返回首页重新开始</p>
        <button onClick={() => setPage('home')} style={{ marginTop: 10, padding: '8px 16px' }}>返回首页</button>
      </div>
    )
  }

  const currentQ = practiceState.questions[practiceState.current]
  const currentAns = practiceState.answers[practiceState.current] || []
  const currentStatus = questionStatus[practiceState.current]
  const isMultipleAnswered = currentQ.type === 'multiple' && currentAns.length > 0

  const questionsWithStatus = practiceState.questions.map((q, idx) => ({
    ...q,
    status: questionStatus[idx] || null,
    userAns: practiceState.answers[idx] || null
  }))

  return (
    <div className="exam-page">
      <div className={`exam-sidebar ${sidebarHidden ? 'hidden' : ''}`}>
        <div className="sidebar-header">
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
        <QuestionSidebar
          questions={questionsWithStatus}
          current={practiceState.current}
          answers={practiceState.answers}
          isReviewMode={false}
          onGoQuestion={(idx) => goQuestionWithScroll(idx, true)}
          showSubmit={false}
          onSubmit={() => {}}
          filter="all"
          practiceMode
        />
      </div>

      <div className={`exam-main ${sidebarHidden ? 'full-width' : ''}`}>
        {viewMode === 'single' ? (
          <QuestionCard
            question={{ ...currentQ, status: currentStatus, userAns: currentAns }}
            currentAns={currentAns}
            currentIndex={practiceState.current}
            total={total}
            isReviewMode={!!currentStatus}
            onSelectOption={selectOption}
            showNav={true}
            onPrev={prev}
            onNext={next}
            onSubmit={() => {}}
            showSubmit={false}
            autoNext={false}
            onToggleAutoNext={() => {}}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode('overview')}
            onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
            showConfirmNext={isMultipleAnswered && !currentStatus}
            isWrongOnlyMode={false}
            practiceMode
          />
        ) : (
          <ExamOverview
            questions={questionsWithStatus}
            answers={practiceState.answers}
            current={practiceState.current}
            isReviewMode={false}
            showWrongOnly={false}
            showParse={true}
            sidebarHidden={sidebarHidden}
            onGoQuestion={goQuestionWithScroll}
            onToggleViewMode={setViewMode}
            onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
            onReExamWrong={() => {}}
            wrongQuestionIndices={[]}
            updateExamState={(updates) => {
              setPracticeState(prev => ({ ...prev, ...updates }))
              if (updates.questions) {
                updates.questions.forEach((q, idx) => {
                  if (q.status) {
                    setQuestionStatus(ps => ({ ...ps, [idx]: q.status }))
                  }
                })
              }
            }}
            practiceMode
          />
        )}
        {viewMode === 'overview' && showBackToTop && (
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
    </div>
  )
}
