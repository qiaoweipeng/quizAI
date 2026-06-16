/**
 * 考试结果展示共享组件
 * 
 * 用于展示考试成绩和统计信息，可被 ExamResultModal 和 ResultPage 复用。
 * 
 * 功能特性：
 * - 圆形分数展示（及格绿色，不及格红色）
 * - 及格状态标识（合格/不合格）
 * - 正确/错误/未答数量统计
 * - 考试用时统计
 * 
 * Props:
 * @param {object} result - 考试结果对象
 * @param {number} result.score - 分数（百分制）
 * @param {boolean} result.passed - 是否及格
 * @param {string} result.paperName - 试卷名称
 * @param {number} result.total - 总题数
 * @param {number} result.correct - 正确数
 * @param {number} result.wrong - 错误数
 * @param {number} result.unanswered - 未答数
 * @param {number} result.usedTime - 用时（秒）
 * @param {boolean} showTotal - 是否显示总题数（默认 false）
 */
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { formatTime } from '../utils/examUtils'

function formatUsedTime(seconds) {
  if (seconds < 60) {
    return '不足一分钟'
  }
  return formatTime(seconds)
}

export default function ResultDisplay({ result, showTotal = false }) {
  if (!result) return null

  const isPassed = result.passed
  const score = Number.isInteger(result.score) ? result.score : result.score.toFixed(1)

  return (
    <>
      {result.paperName && (
        <div className="result-title">{result.paperName}</div>
      )}
      <div className={`score-circle ${isPassed ? 'pass' : 'fail'}`}>
        <div className="score-num">{score}</div>
      </div>
      <div className={`pass-badge ${isPassed ? 'pass' : 'fail'}`}>
        {isPassed ? '合格' : '不合格'}
      </div>

      <div className="result-stats">
        {showTotal && (
          <div className="stat-item">
            <div className="stat-num">{result.total}</div>
            <div className="stat-label">总题数</div>
          </div>
        )}
        <div className="stat-item">
          <div className="stat-num stat-correct">{result.correct}</div>
          <div className="stat-label">正确</div>
        </div>
        <div className="stat-item">
          <div className="stat-num stat-wrong">{result.wrong}</div>
          <div className="stat-label">错误</div>
        </div>
        <div className="stat-item">
          <div className="stat-num stat-unanswered">{result.unanswered}</div>
          <div className="stat-label">未答</div>
        </div>
        <div className="stat-item">
          <div className={`stat-num stat-time ${result.usedTime < 60 ? 'short-time' : ''}`}>
            {formatUsedTime(result.usedTime)}
          </div>
          <div className="stat-label">用时</div>
        </div>
      </div>
    </>
  )
}

export { formatUsedTime }