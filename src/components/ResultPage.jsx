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
import { formatTime, calcScore } from '../utils/examUtils'

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

  // 转换为百分制：每道题 0.5 分，满分 = 题目数 × 0.5
  const maxScore = questions.length * 0.5
  const rawPercent = maxScore > 0 ? (rawScore / maxScore) * 100 : 0
  // 最低分不低于0分
  const clampedPercent = Math.max(0, rawPercent)
  // 分数显示：整数显示整数，小数显示小数
  const score = clampedPercent % 1 === 0 ? Math.round(clampedPercent) : clampedPercent
  const passed = score >= 60
  const wrongList = details.filter(d => d.status === 'wrong' || d.status === 'unanswered')

  // 错题预览模态框状态
  const [showReviewModal, setShowReviewModal] = useState(false)

  return (
    <div className="result-page">
      <div className="result-card">
        <h2>📊 考试结果</h2>
        <div className="paper-name">{paperName}</div>
        <div className={`score-circle ${passed ? 'pass' : 'fail'}`}>
          <div className="score-num">{Number.isInteger(score) ? score : score.toFixed(1)}</div>
        </div>
        <div className={`pass-badge ${passed ? 'pass' : 'fail'}`}>
          {passed ? '✅ 合格' : '❌ 不合格'}
        </div>

        <div className="result-stats">
          <div className="stat-item">
            <div className="stat-num">{total}</div>
            <div className="stat-label">总题数</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{color:'#00b894'}}>{correct}</div>
            <div className="stat-label">正确</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{color:'#d63031'}}>{wrong}</div>
            <div className="stat-label">错误</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{unanswered}</div>
            <div className="stat-label">未答</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{formatTime(usedTime)}</div>
            <div className="stat-label">用时</div>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn-secondary" onClick={() => setPage('home')}>返回首页</button>
          {wrongList.length > 0 && (
            <button className="btn-primary" onClick={() => setShowReviewModal(true)}>错题预览 ({wrongList.length})</button>
          )}
        </div>
      </div>

      {/* 错题预览模态框 */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 错题预览（共 {wrongList.length} 道）</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {wrongList.map(({ idx, q, ans, status }) => (
                <div className={`review-item ${status}`} key={idx}>
                  <div className="review-header">
                    <span className="review-index">第 {idx + 1} 题</span>
                    <span className={`review-tag ${status}`}>
                      {status === 'wrong' ? '❌ 答错' : '⏳ 未答'}
                    </span>
                  </div>
                  <div className="review-question">{q.question}</div>
                  <div className="review-options">
                    {q.options.map((opt, optIdx) => {
                      const key = opt.charAt(0)
                      const selected = ans?.includes(key)
                      const isCorrect = q.answer.includes(key)
                      let optionClass = ''
                      if (selected && isCorrect) {
                        optionClass = 'selected correct'
                      } else if (selected && !isCorrect) {
                        optionClass = 'selected wrong'
                      } else if (!selected && isCorrect) {
                        optionClass = 'correct'
                      }
                      return (
                        <div key={optIdx} className={`review-option ${optionClass}`}>
                          <span className="option-key">{key}</span>
                          <span className="option-text">{opt}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="review-answer">
                    <span>你的答案：{ans && ans.length ? ans.join(', ') : '未答'}</span>
                    <span>正确答案：{q.answer.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowReviewModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}