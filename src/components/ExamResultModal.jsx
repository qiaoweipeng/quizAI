/**
 * 考试结果模态框组件
 * 
 * 展示考试最终成绩和统计信息的弹窗组件。
 * 支持普通考试结果和错题重考历史记录展示。
 * 
 * Props:
 * @param {boolean} visible - 弹窗是否可见
 * @param {object} result - 考试结果对象
 * @param {function} onClose - 关闭弹窗回调函数
 */
import { Modal, Table } from 'antd'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import ResultDisplay from './ResultDisplay'

export default function ExamResultModal({ visible, result, onClose }) {
  if (!result) return null

  const isPassed = result.passed
  const TitleIcon = isPassed ? CheckCircleFilled : CloseCircleFilled
  const title = isPassed ? '恭喜你成绩合格' : '成绩不合格，请继续努力'

  const columns = [
    {
      title: '次数',
      dataIndex: 'round',
      key: 'round',
      width: 80,
      align: 'center'
    },
    {
      title: '总题数',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center'
    },
    {
      title: '正确数量',
      dataIndex: 'correct',
      key: 'correct',
      width: 100,
      align: 'center',
      render: (text) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{text}</span>
    },
    {
      title: '错误数量',
      dataIndex: 'wrong',
      key: 'wrong',
      width: 100,
      align: 'center',
      render: (text) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{text}</span>
    }
  ]

  const isReExam = result.history && result.history.length > 1

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isReExam ? 600 : 700}
      centered
      bodyStyle={{ 
        height: isReExam ? 350 : 500, 
        padding: 0 
      }}
      styles={{ 
        mask: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' } 
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TitleIcon style={{ fontSize: 24, color: isPassed ? '#52c41a' : '#ff4d4f' }} />
          <span>{title}</span>
        </div>
      }
    >
      <div className="result-modal" onClick={e => e.stopPropagation()}>
        <div className="result-modal-body">
          {isReExam ? (
            <div style={{ padding: 20 }}>
              <Table
                columns={columns}
                dataSource={result.history}
                rowKey="round"
                pagination={false}
                bordered
                size="middle"
              />
            </div>
          ) : (
            <ResultDisplay result={result} />
          )}
        </div>
      </div>
    </Modal>
  )
}