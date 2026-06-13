/**
 * 考试结果模态框组件
 * 
 * 功能：展示考试结果
 * - 分数显示
 * - 及格/不及格状态
 * - 正确/错误/未答统计
 * - 用时统计
 * 
 * Props:
 * - visible: boolean - 是否显示
 * - result: object - 考试结果对象
 * - onClose: function - 关闭弹窗函数
 */
import { Modal } from 'antd'

function formatUsedTime(seconds) {
  if (seconds < 60) {
    return '不足一分钟'
  }
  const minutes = Math.round(seconds / 60)
  return `${minutes} 分钟`
}

export default function ExamResultModal({ visible, result, onClose }) {
  if (!result) return null

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      bodyStyle={{ height: 500, padding: 0 }}
      maskStyle={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="result-modal" onClick={e => e.stopPropagation()}>
        <div className="result-modal-body">
          <div className="result-title">{result.paperName}</div>
          <div className={`score-circle ${result.passed ? 'pass' : 'fail'}`}>
            <div className="score-num">
              {Number.isInteger(result.score) ? result.score : result.score.toFixed(1)}
            </div>
          </div>
          <div className={`pass-badge ${result.passed ? 'pass' : 'fail'}`}>
            {result.passed ? '合格' : '不合格'}
          </div>

          <div className="result-stats">
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
        </div>
      </div>
    </Modal>
  )
}