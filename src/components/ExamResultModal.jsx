/**
 * 考试结果模态框组件
 * 
 * 展示考试最终成绩和统计信息的弹窗组件。
 * 
 * Props:
 * @param {boolean} visible - 弹窗是否可见
 * @param {object} result - 考试结果对象
 * @param {function} onClose - 关闭弹窗回调函数
 */
import { Modal } from 'antd'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import ResultDisplay from './ResultDisplay'

export default function ExamResultModal({ visible, result, onClose }) {
  if (!result) return null

  const isPassed = result.passed
  const TitleIcon = isPassed ? CheckCircleFilled : CloseCircleFilled
  const title = isPassed ? '恭喜你成绩合格' : '成绩不合格，请继续努力'

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      bodyStyle={{ 
        height: 500, 
        padding: 0 
      }}
      maskStyle={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TitleIcon style={{ fontSize: 24, color: isPassed ? '#52c41a' : '#ff4d4f' }} />
          <span>{title}</span>
        </div>
      }
    >
      <div className="result-modal" onClick={e => e.stopPropagation()}>
        <div className="result-modal-body">
          <ResultDisplay result={result} />
        </div>
      </div>
    </Modal>
  )
}