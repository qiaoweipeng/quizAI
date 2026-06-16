/**
 * 考试核心逻辑 Hook
 * 
 * 封装了考试相关的核心逻辑：
 * - 答题逻辑（选择选项）
 * - 题目导航（跳转题目）
 * - 结果计算（统计正确/错误/未答）
 * - 错题重考（收集错题重新考试）
 * - 一键预选（自动填充答案）
 */
import { useCallback } from 'react'
import { calcScore } from '../utils/examUtils'
import useExamStore from '../store/examStore'

export function useExamLogic() {
  const { 
    examState, 
    setExamState, 
    examHistory, 
    setExamHistory, 
    setExamResult, 
    setShowResultModal, 
    setShowParse, 
    setShowWrongOnly,
    updateExamState
  } = useExamStore()

  /**
   * 一键预答所有题目
   * 
   * 自动填充所有题目的默认答案：
   * - 单选题：选A
   * - 判断题：选第一个选项（通常是"对"）
   * - 多选题：全选所有选项
   */
  const preselectAll = useCallback(() => {
    if (!examState) return
    
    const newAnswers = {}
    examState.questions.forEach((qq, idx) => {
      if (qq.type === 'single') {
        newAnswers[idx] = ['A']
      } else if (qq.type === 'judge') {
        newAnswers[idx] = [qq.options[0]]
      } else if (qq.type === 'multiple') {
        const keys = qq.options.map(opt => opt.charAt(0))
        newAnswers[idx] = keys.sort()
      }
    })
    updateExamState({ answers: newAnswers })
  }, [examState, updateExamState])

  /**
   * 计算考试结果
   * 
   * 遍历所有题目，统计正确、错误、未答数量，计算百分制分数。
   * 每题0.5分，满分=题目数×0.5。
   * 计算完成后更新状态为回顾模式，并显示结果弹窗。
   */
  const calculateResult = useCallback(() => {
    if (!examState) return
    
    const { questions, answers } = examState
    let rawScore = 0
    let correct = 0, wrong = 0, unanswered = 0
    const wrongByType = { single: 0, multiple: 0, judge: 0 }
    
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
        if (wrongByType[q.type] !== undefined) {
          wrongByType[q.type]++
        }
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
      usedTime: 90 * 60 - examState.timeLeft,
      paperName: examState.paperName,
      questionsWithStatus
    }
    
    const newHistory = [
      ...examHistory,
      {
        round: examHistory.length + 1,
        total: questions.length,
        correct,
        wrong,
        wrongByType
      }
    ]
    
    setExamHistory(newHistory)
    setExamResult({ ...result, history: newHistory })
    
    updateExamState({
      mode: 'review',
      questions: questionsWithStatus
    })
    
    setShowResultModal(true)
  }, [examState, examHistory, setExamHistory, setExamResult, updateExamState, setShowResultModal])

  /**
   * 交卷
   * 
   * 将考试状态标记为已完成，触发结果计算。
   */
  const submitExam = useCallback(() => {
    updateExamState({ finished: true })
    setTimeout(() => {
      calculateResult()
    }, 0)
  }, [updateExamState, calculateResult])

  /**
   * 错题重考
   * 
   * 收集所有答错的题目，重置为新的考试状态，重新开始答题。
   * 保留原有的自动切题设置，但不显示一键预选通知。
   */
  const reExamWrong = useCallback(() => {
    if (!examState) return 0
    
    const wrongQuestions = examState.questions.filter(qq => qq.status === 'wrong')
    if (wrongQuestions.length === 0) {
      return 0
    }
    
    const resetQuestions = wrongQuestions.map(qq => ({
      ...qq,
      status: null,
      userAns: null
    }))
    
    setExamState({
      questions: resetQuestions,
      answers: {},
      current: 0,
      mode: 'exam',
      finished: false,
      startTime: Date.now(),
      timeLeft: 90 * 60,
      paperName: `${examState.paperName} - 错题重考`,
      autoNext: examState.autoNext,
      showPreselectNotification: false
    })
    
    setExamResult(null)
    setShowParse(false)
    setShowWrongOnly(false)
    setShowResultModal(false)
    
    return wrongQuestions.length
  }, [examState, setExamState, setExamResult, setShowParse, setShowWrongOnly, setShowResultModal])

  /**
   * 选择选项
   * 
   * 处理用户点击选项的逻辑：
   * - 单选题/判断题：替换当前答案
   * - 多选题：切换选中状态（选中的取消，未选中的添加）
   * - 支持自动切题功能（单选/判断题答对后自动跳转到下一题）
   * 
   * @param {string} key - 选项键（A、B、C、D等）
   * @param {object} currentQ - 当前题目对象
   */
  const selectOption = useCallback((key, currentQ) => {
    if (!examState || examState.finished || examState.mode === 'review') {
      return
    }
    
    const currentAns = examState.answers[examState.current] || []
    let nextAns
    
    if (currentQ.type === 'multiple') {
      nextAns = currentAns.includes(key)
        ? currentAns.filter(k => k !== key)
        : [...currentAns, key].sort()
    } else {
      nextAns = [key]
    }
    
    updateExamState({
      answers: { ...examState.answers, [examState.current]: nextAns }
    })
    
    return nextAns
  }, [examState, updateExamState])

  /**
   * 跳转题目
   * 
   * 切换到指定索引的题目。
   * 
   * @param {number} idx - 目标题目索引
   */
  const goQuestion = useCallback((idx) => {
    updateExamState({ current: idx })
  }, [updateExamState])

  return {
    preselectAll,
    calculateResult,
    submitExam,
    reExamWrong,
    selectOption,
    goQuestion
  }
}