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
import { Modal, Table, Tag } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, LineChartOutlined } from '@ant-design/icons'
import ResultDisplay from '../result/ResultDisplay'
import useExamStore from '../../store/examStore'

export default function ExamResultModal({ visible, result, onClose }) {
  const { examHistory } = useExamStore()

  const displayResult = result || (examHistory.length > 0 ? { history: examHistory } : null)

  if (!displayResult) return null

  const isPassed = displayResult.passed
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
      title: '错误数量',
      dataIndex: 'wrong',
      key: 'wrong',
      width: 100,
      align: 'center',
      render: (text, record, index) => {
        const prevRecord = displayResult.history && displayResult.history[index - 1]
        const diff = prevRecord ? prevRecord.wrong - text : 0
        return (
          <span>
            <span>{text}</span>
            {diff > 0 && (
              <span style={{ color: '#52c41a', marginLeft: 4, fontSize: 12 }}>-{diff}</span>
            )}
          </span>
        )
      }
    },
    {
      title: '错误类型',
      key: 'wrongByType',
      width: 200,
      align: 'center',
      render: (_, record) => {
        const { wrongByType } = record
        if (!wrongByType) {
          return <span style={{ color: '#999', fontSize: 12 }}>-</span>
        }
        const items = []
        if (wrongByType.single > 0) {
          items.push(<Tag key="single" color="#1890ff">单选 {wrongByType.single}</Tag>)
        }
        if (wrongByType.multiple > 0) {
          items.push(<Tag key="multiple" color="#fa8c16">多选 {wrongByType.multiple}</Tag>)
        }
        if (wrongByType.judge > 0) {
          items.push(<Tag key="judge" color="#52c41a">判断 {wrongByType.judge}</Tag>)
        }
        if (items.length === 0) {
          return <span style={{ color: '#52c41a', fontSize: 12 }}>无错误</span>
        }
        return (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {items}
          </div>
        )
      }
    }
  ]

  const isReExam = displayResult.history && displayResult.history.length > 1
  const firstExamResult = displayResult.history && displayResult.history.length > 0 ? displayResult.history[0] : null

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isReExam ? 700 : 700}
      centered={!isReExam}
      styles={{ 
        mask: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        body: { padding: 0, height: 400 }
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isReExam ? (
            <>
              <LineChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <span>考试结果分析</span>
            </>
          ) : (
            <>
              <TitleIcon style={{ fontSize: 24, color: isPassed ? '#52c41a' : '#ff4d4f' }} />
              <span>{title}</span>
            </>
          )}
        </div>
      }
    >
      <div className="result-modal" onClick={e => e.stopPropagation()}>
        <div className={`result-modal-body ${isReExam ? 'result-modal-body-left' : ''}`}>
          {isReExam ? (
            <>
              {firstExamResult && (
                <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, width: '100%', boxSizing: 'border-box' }}>
                  <span>首次考试分数{Math.round((firstExamResult.correct / firstExamResult.total) * 100)}，
                    成绩{firstExamResult.correct >= (firstExamResult.total * 0.6) ? '合格' : '不合格'}，
                    错题数量{firstExamResult.wrong}</span>
                </div>
              )}
              <div style={{ margin: '0 auto', width: 530 }}>
                <Table
                  columns={columns}
                  dataSource={displayResult.history}
                  rowKey="round"
                  pagination={false}
                  bordered
                  size="middle"
                  sticky
                  scroll={{ y: 200 }}
                />
              </div>
            </>
          ) : (
            <ResultDisplay result={displayResult} />
          )}
        </div>
      </div>
    </Modal>
  )
}