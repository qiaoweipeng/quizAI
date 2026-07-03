/**
 * 考试页面组件
 * 
 * 功能：核心考试界面，整合以下子组件：
 * - ExamTimer: 倒计时显示
 * - QuestionSidebar: 题目导航侧边栏
 * - QuestionCard: 题目卡片
 * - ExamOverview: 全览模式组件
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
 */
import { useEffect, useRef, useState } from 'react'
import { clearExamState, saveExamState } from '../../utils/examUtils'
import { Button, Tooltip, FloatButton, App } from 'antd'
import { VerticalAlignTopOutlined, ThunderboltOutlined } from '@ant-design/icons'
import ExamTimer from './ExamTimer'
import QuestionSidebar from './QuestionSidebar'
import QuestionCard from './QuestionCard'
import ExamOverview from './ExamOverview'
import ExamResultModal from './ExamResultModal'
import useExamStore from '../../store/examStore'
import { useExamLogic } from '../../hooks/useExamLogic'

export default function ExamPage() {
  const {
    examState,
    setExamState,
    viewMode,
    setViewMode,
    showResultModal,
    setShowResultModal,
    sidebarHidden,
    setSidebarHidden,
    showParse,
    toggleShowParse,
    showWrongOnly,
    toggleShowWrongOnly,
    updateExamState,
    resetAllState,
    setCurrentPage
  } = useExamStore()

  const { message, notification } = App.useApp()

  const {
    preselectAll,
    submitExam,
    reExamWrong,
    selectOption,
    goQuestion
  } = useExamLogic()

  const timerRef = useRef(null)
  const examStateRef = useRef(examState)
  const preselectShownRef = useRef(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    if (examState?.preselectModalShown) {
      preselectShownRef.current = true
    } else {
      preselectShownRef.current = false
    }
  }, [])

  useEffect(() => {
    examStateRef.current = examState
  }, [examState])

  useEffect(() => {
    if (!examState || !examState.questions || examState.questions.length === 0) return
    if (preselectShownRef.current) return
    if (examState.mode !== 'exam') return
    if (examState.preselectModalShown) return
    return

    preselectShownRef.current = true
    const timer = setTimeout(() => {
      const key = `preselect-${Date.now()}`
      notification.open({
        icon: <ThunderboltOutlined style={{ color: '#faad14' }} />,
        message: '一键预选',
        description: '将会自动填充所有题目答案[单选选A、多选全选、判断选对]',
        btn: (
          <Button type="primary" size="small" onClick={() => {
            preselectAll()
            notification.destroy(key)
          }}>
            确认预选
          </Button>
        ),
        key,
        duration: 0,
      })
      updateExamState({ preselectModalShown: true })
    }, 1000)

    return () => clearTimeout(timer)
  }, [examState])

  useEffect(() => {
    if (!examState || examState.finished) return
    
    timerRef.current = setInterval(() => {
      const currentState = examStateRef.current
      if (!currentState || currentState.finished) {
        clearInterval(timerRef.current)
        return
      }
      updateExamState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current)
          setTimeout(() => {
            submitExam()
          }, 100)
          return { ...prev, timeLeft: 0, finished: true }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
    
    return () => clearInterval(timerRef.current)
  }, [submitExam])

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

  useEffect(() => {
    if (examState && !examState.finished) {
      saveExamState(examState)
    }
  }, [examState])

  useEffect(() => {
    if (examState?.finished) {
      clearInterval(timerRef.current)
    }
  }, [examState?.finished])

  if (!examState || !examState.questions || examState.questions.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>考试数据加载失败或不存在，请返回首页重新开始</p>
        <button onClick={() => useExamStore.getState().resetAllState()} style={{ marginTop: 10, padding: '8px 16px' }}>返回首页</button>
      </div>
    )
  }

  const q = examState.questions[examState.current]
  const total = examState.questions.length
  const answered = Object.keys(examState.answers).length
  const isLast = examState.current === total - 1
  const isReviewMode = examState.mode === 'review'

  const wrongQuestionIndices = examState.questions
    .map((qq, idx) => ({ qq, idx }))
    .filter(({ qq }) => qq.status === 'wrong')
    .map(({ idx }) => idx)

  const currentWrongIndex = wrongQuestionIndices.indexOf(examState.current)

  const getCurrentQuestion = () => {
    if (isReviewMode && showWrongOnly && wrongQuestionIndices.length > 0) {
      if (currentWrongIndex === -1) {
        return examState.questions[wrongQuestionIndices[0]]
      }
      return examState.questions[wrongQuestionIndices[currentWrongIndex]]
    }
    return examState.questions[examState.current]
  }

  const currentQ = getCurrentQuestion() || examState.questions[examState.current] || examState.questions[0]
  const currentAns = examState.answers[examState.current] || []

  const handleSelectOption = (key) => {
    selectOption(key, currentQ)
    if (examState.autoNext && !isLast && currentQ.type !== 'multiple') {
      setTimeout(() => goQuestion(examState.current + 1), 200)
    }
  }

  const goQuestionWithScroll = (idx, fromSidebar = false) => {
    goQuestion(idx)
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

  const goNextWrong = () => {
    if (currentWrongIndex < wrongQuestionIndices.length - 1) {
      goQuestion(wrongQuestionIndices[currentWrongIndex + 1])
    }
  }

  const goPrevWrong = () => {
    if (currentWrongIndex > 0) {
      goQuestion(wrongQuestionIndices[currentWrongIndex - 1])
    }
  }

  const handleReExamWrong = () => {
    const count = reExamWrong()
    if (count) {
      message.success(`错题重考已开始，共 ${count} 道错题需要重考`)
    } else {
      message.info('没有错题需要重考')
    }
  }

  return (
    <div className="exam-page">
      <div 
        className={`exam-sidebar ${sidebarHidden ? 'hidden' : ''}`}
      >
        {!isReviewMode && (
          <div className="sidebar-header">
            <ExamTimer timeLeft={examState.timeLeft} />
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
          questions={examState.questions}
          current={examState.current}
          answers={examState.answers}
          isReviewMode={isReviewMode}
          onGoQuestion={(idx) => goQuestionWithScroll(idx, true)}
          showSubmit={!isReviewMode && total - answered === 0}
          onSubmit={submitExam}
          filter={showWrongOnly ? 'wrong' : 'all'}
        />
      </div>

      <div className={`exam-main ${sidebarHidden ? 'full-width' : ''}`}>
        {viewMode === 'single' ? (
          <QuestionCard
            question={currentQ}
            currentAns={currentAns}
            currentIndex={examState.current}
            total={total}
            isReviewMode={isReviewMode}
            onSelectOption={handleSelectOption}
            showNav={!examState.autoNext}
            onPrev={isReviewMode && showWrongOnly ? goPrevWrong : () => goQuestion(examState.current - 1)}
            onNext={isReviewMode && showWrongOnly ? goNextWrong : () => goQuestion(examState.current + 1)}
            onSubmit={submitExam}
            showSubmit={false}
            autoNext={examState.autoNext}
            onToggleAutoNext={() => updateExamState({ autoNext: !examState.autoNext })}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode('overview')}
            onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
            showConfirmNext={examState.autoNext && !isReviewMode && currentQ.type === 'multiple' && !isLast}
            isWrongOnlyMode={isReviewMode && showWrongOnly}
            wrongQuestionIndices={wrongQuestionIndices}
            onReExamWrong={handleReExamWrong}
          />
        ) : (
          <ExamOverview
            questions={examState.questions}
            answers={examState.answers}
            current={examState.current}
            isReviewMode={isReviewMode}
            showWrongOnly={showWrongOnly}
            showParse={showParse}
            sidebarHidden={sidebarHidden}
            onGoQuestion={goQuestionWithScroll}
            onToggleViewMode={setViewMode}
            onToggleSidebar={() => setSidebarHidden(!sidebarHidden)}
            onReExamWrong={handleReExamWrong}
            wrongQuestionIndices={wrongQuestionIndices}
            updateExamState={updateExamState}
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

      <ExamResultModal
        visible={showResultModal}
        result={useExamStore.getState().examResult}
        onClose={() => {
          const lastResult = useExamStore.getState().examResult
          const lastWrongCount = lastResult?.history?.length > 0 
            ? lastResult.history[lastResult.history.length - 1].wrong 
            : lastResult?.wrong || 0
          if (lastWrongCount === 0) {
            resetAllState()
          } else {
            setShowResultModal(false)
          }
        }}
      />
    </div>
  )
}