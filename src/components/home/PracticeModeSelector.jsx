/**
 * 练习模式选择组件
 * 
 * 提供专项练习的入口，支持自由选题和全部题目两种模式。
 * 
 * Props:
 * @param {array} questions - 题目总题库
 * @param {function} setPracticeState - 设置练习状态函数
 * @param {function} setPage - 页面切换函数
 */
import { useState } from 'react'
import { Button, Radio, Select, InputNumber, ConfigProvider, Modal, App } from 'antd'
import { FileSearchOutlined } from '@ant-design/icons'
import { createStyles } from 'antd-style'
import { shuffleArray } from '../../utils/examUtils'
import useExamStore from '../../store/examStore'

const useStyle = createStyles(({ prefixCls, css }) => ({
  linearGradientButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
      }

      &::before {
        content: '';
        background: var(--practice-gradient);
        position: absolute;
        inset: -1px;
        opacity: 1;
        transition: all 0.3s;
        border-radius: inherit;
      }

      &:hover::before {
        opacity: 0;
      }
    }
  `,
}))

export default function PracticeModeSelector({ questions, setPracticeState, setPage }) {
  const { styles } = useStyle()
  const { modal } = App.useApp()
  const { wrongBook } = useExamStore()
  const [practiceModalOpen, setPracticeModalOpen] = useState(false)
  const [practiceType, setPracticeType] = useState('single')
  const [practiceCount, setPracticeCount] = useState(10)
  const [practiceMode, setPracticeMode] = useState('free')

  const availableCount = questions.filter(q => q.type === practiceType && !wrongBook.includes(q.id)).length
  const hasWrongQuestions = wrongBook.length > 0

  const handleStartPractice = () => {
    if (practiceMode === 'free') {
      const pool = questions.filter(q => q.type === practiceType && !wrongBook.includes(q.id))
      if (pool.length === 0) {
        modal.warning({
          title: '暂无题目',
          content: '该题型暂无题目（已排除错题本中的题目）',
        })
        return
      }
      const n = Math.min(practiceCount, pool.length)
      const practiceQuestions = shuffleArray(pool).slice(0, n)
      setPracticeState({ questions: practiceQuestions, current: 0, answers: {}, showParse: {} })
      setPage('practice-exam')
      setPracticeModalOpen(false)
    } else if (practiceMode === 'all') {
      const practiceQuestions = questions.filter(q => !wrongBook.includes(q.id))
      if (practiceQuestions.length === 0) {
        modal.warning({
          title: '暂无题目',
          content: '题库暂无题目（已排除错题本中的题目）',
        })
        return
      }
      setPracticeState({ questions: practiceQuestions, current: 0, answers: {}, showParse: {} })
      setPage('practice-exam')
      setPracticeModalOpen(false)
    } else if (practiceMode === 'wrong') {
      const wrongQuestions = questions.filter(q => wrongBook.includes(q.id))
      if (wrongQuestions.length === 0) {
        modal.warning({
          title: '暂无错题',
          content: '错题本暂无错题',
        })
        return
      }
      setPracticeState({ questions: wrongQuestions, current: 0, answers: {}, showParse: {} })
      setPage('practice-exam')
      setPracticeModalOpen(false)
    }
  }

  return (
    <>
      <div className="mode-section practice-mode" onClick={() => setPracticeModalOpen(true)}>
        <div className="section-header">
          <div className="section-icon">✏️</div>
          <div className="section-info">
            <h2>练习模式</h2>
            <p>自由练习，巩固知识</p>
          </div>
        </div>
        <div className="practice-content">
          <p className="practice-item">自选题型<span className="practice-hint">（单选/多选/判断）</span>和数量</p>
          <p className="practice-item">不计时</p>
          <p className="practice-item">即时查看解析</p>

          <ConfigProvider
            button={{
              className: styles.linearGradientButton,
            }}
          >
            <Button type="primary" size="large" style={{ width: '100%' }}>进入练习</Button>
          </ConfigProvider>
        </div>
      </div>

      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center' }}><FileSearchOutlined style={{ marginRight: 8, color: '#1890ff', fontSize: 20 }} /><span>专项练习</span></div>}
        open={practiceModalOpen}
        onOk={handleStartPractice}
        onCancel={() => setPracticeModalOpen(false)}
        okText="开始练习"
        cancelText="取消"
      >
        <div style={{ padding: '16px 30px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
              选择题目
            </label>
            <Radio.Group
              block
              value={practiceMode}
              onChange={(e) => setPracticeMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '自由选题', value: 'free' },
                { label: '全部题目', value: 'all' },
                { label: `全部错题 (${wrongBook.length})`, value: 'wrong', disabled: !hasWrongQuestions },
              ]}
            />
          </div>
          {practiceMode === 'free' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>选择题型</label>
                <Select
                  value={practiceType}
                  onChange={setPracticeType}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'single', label: '单选题' },
                    { value: 'multiple', label: '多选题' },
                    { value: 'judge', label: '判断题' },
                  ]}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>题目数量</label>
                <InputNumber
                  min={1}
                  max={availableCount}
                  value={practiceCount}
                  onChange={(val) => setPracticeCount(Math.max(1, Math.min(availableCount, val || 1)))}
                  style={{ width: '100%' }}
                />
                <div style={{ marginTop: 8, color: '#999' }}>该题型共 {availableCount} 道可用</div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}