/**
 * 考试结果页面组件
 * 
 * 功能：展示考试成绩和统计信息
 * - 分数显示（及格/不及格）
 * - 正确/错误/未答数量统计
 * - 用时统计
 * - 错题预览（可查看错题详情和解析）
 * 
 * Props:
 * - examState: object - 考试状态（题目、答案等）
 * - setPage: function - 页面切换函数
 */
import { useState } from 'react'
import { Button } from 'antd'
import { calcScore } from '../../utils/examUtils'
import ResultDisplay from './ResultDisplay'
import WrongAnswerModal from './WrongAnswerModal'

export default function ResultPage({ examState, setPage }) {
  if (!examState) return null
  const { questions, answers, paperName, timeLeft } = examState
  const EXAM_TIME = 90 * 60
  const total = questions.length
  const usedTime = EXAM_TIME - timeLeft

  let rawScore = 0
  let correct = 0, wrong = 0, unanswered = 0
  const details = []

  questions.forEach((q, idx) => {
    const ans = answers[idx]
    const s = calcScore(q, ans)
    rawScore += s
    if (!ans || ans.length === 0) {
      unanswered++
      details.push({ idx, q, ans, score: 0, status: 'unanswered' })
    } else if (s > 0) {
      correct++
      details.push({ idx, q, ans, score: s, status: 'correct' })
    } else {
      wrong++
      details.push({ idx, q, ans, score: s, status: 'wrong' })
    }
  })

  const maxScore = questions.length * 0.5
  const rawPercent = maxScore > 0 ? (rawScore / maxScore) * 100 : 0
  const clampedPercent = Math.max(0, rawPercent)
  const score = clampedPercent % 1 === 0 ? Math.round(clampedPercent) : clampedPercent
  const passed = score >= 60
  const wrongList = details.filter(d => d.status === 'wrong' || d.status === 'unanswered')

  const result = {
    score,
    passed,
    paperName,
    total,
    correct,
    wrong,
    unanswered,
    usedTime
  }

  const [showReviewModal, setShowReviewModal] = useState(false)

  return (
    <div className="result-page">
      <div className="result-card">
        <h2>📊 考试结果</h2>
        <ResultDisplay result={result} showTotal={true} />

        <div className="result-actions">
          <Button className="btn-secondary" onClick={() => setPage('home')}>返回首页</Button>
          {wrongList.length > 0 && (
            <Button className="btn-primary" onClick={() => setShowReviewModal(true)}>错题预览 ({wrongList.length})</Button>
          )}
        </div>
      </div>

      <WrongAnswerModal
        visible={showReviewModal}
        wrongList={wrongList}
        onClose={() => setShowReviewModal(false)}
      />
    </div>
  )
}