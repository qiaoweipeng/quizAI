/**
 * 考试模式选择组件
 * 
 * 提供固定卷和随机卷两种考试模式的选择入口。
 * 
 * Props:
 * @param {array} papers - 固定试卷列表
 * @param {array} questions - 题目总题库
 * @param {function} setExamState - 设置考试状态函数
 * @param {function} setPage - 页面切换函数
 */
import { useState } from 'react'
import { Modal, Button, Table, Radio } from 'antd'
import { EXAM_TIME, shuffleArray } from '../../utils/examUtils'

export default function ExamModeSelector({ papers, questions, setExamState, setPage }) {
  const [randomModalOpen, setRandomModalOpen] = useState(false)
  const [fixedModalOpen, setFixedModalOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)

  const uniqueById = (arr) => {
    const seen = new Set()
    return arr.filter(q => {
      if (seen.has(q.id)) return false
      seen.add(q.id)
      return true
    })
  }

  const handleRandomExam = () => {
    const availableSingle = questions.filter(q => q.type === 'single')
    const availableMultiple = questions.filter(q => q.type === 'multiple')
    const availableJudge = questions.filter(q => q.type === 'judge')
    
    const neededSingle = 100
    const neededMultiple = 40
    const neededJudge = 60
    
    if (availableSingle.length < neededSingle || 
        availableMultiple.length < neededMultiple || 
        availableJudge.length < neededJudge) {
      Modal.warning({
        title: '题库不足',
        content: `当前题库数量不足以生成随机卷：\n单选题：${availableSingle.length}/${neededSingle} \n多选题：${availableMultiple.length}/${neededMultiple} \n判断题：${availableJudge.length}/${neededJudge}`,
      })
      return
    }

    const single = shuffleArray([...availableSingle]).slice(0, neededSingle)
    const multiple = shuffleArray([...availableMultiple]).slice(0, neededMultiple)
    const judge = shuffleArray([...availableJudge]).slice(0, neededJudge)
    
    const examQuestions = uniqueById([...single, ...multiple, ...judge])

    const timestamp = Date.now().toString(36)

    localStorage.removeItem('exam-store')
    localStorage.removeItem('exam_state')

    setExamState({
      mode: 'exam',
      paperName: `随机卷-${timestamp}`,
      questions: examQuestions,
      answers: {},
      marked: {},
      current: 0,
      timeLeft: EXAM_TIME,
      finished: false,
      startTime: Date.now(),
      autoNext: false,
      showPreselectNotification: true,
      preselectModalShown: false
    })
    setPage('exam')
    setRandomModalOpen(false)
  }

  const handleStartFixed = (paper) => {
    const examQuestions = paper.questions || []
    if (examQuestions.length === 0) {
      Modal.warning({
        title: '试卷无题目',
        content: '该试卷没有题目',
      })
      return
    }
    localStorage.removeItem('exam-store')
    localStorage.removeItem('exam_state')
    setExamState({
      mode: 'exam',
      paperName: paper.name,
      questions: examQuestions,
      answers: {},
      marked: {},
      current: 0,
      timeLeft: EXAM_TIME,
      finished: false,
      startTime: Date.now(),
      autoNext: false,
      showPreselectNotification: true,
      preselectModalShown: false
    })
    setPage('exam')
    setFixedModalOpen(false)
  }

  return (
    <>
      <div className="mode-section exam-mode">
        <div className="section-header">
          <div className="section-icon">📝</div>
          <div className="section-info">
            <h2>考试模式</h2>
            <p>模拟真实考卷｜检验学习成果</p>
          </div>
        </div>
        <div className="exam-options">
          <div className="exam-option" onClick={() => { setSelectedPaper(null); setFixedModalOpen(true) }}>
            <div className="option-icon">📋</div>
            <div className="option-content">
              <h3>固定考卷</h3>
              <p>题目固定不变，支持多套试卷选择，适合模拟真实考试环境</p>
            </div>
          </div>
          <div className="exam-option" onClick={() => setRandomModalOpen(true)}>
            <div className="option-icon">🎲</div>
            <div className="option-content">
              <h3>随机考卷</h3>
              <p>题目从总题库随机抽取，每次考试内容不同</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="📋 固定卷考试"
        open={fixedModalOpen}
        onCancel={() => setFixedModalOpen(false)}
        footer={null}
        width={800}
        styles={{ body: { height: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        <p style={{ marginBottom: 16, color: '#666', flexShrink: 0 }}>选择一份试卷开始测试一下吧！</p>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
          <Table
            dataSource={papers}
            rowKey="id"
            pagination={false}
            scroll={{ y: 300 }}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedPaper ? [selectedPaper.id] : [],
              onChange: (_, selectedRows) => setSelectedPaper(selectedRows[0] || null)
            }}
            onRow={(record) => ({
              onClick: () => setSelectedPaper(record)
            })}
            columns={[
              {
                title: '试卷名称',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '题目数量',
                key: 'count',
                width: 100,
                render: (_, record) => (record.questions || []).length + ' 题'
              }
            ]}
          />
        </div>
        <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            size="large"
            disabled={!selectedPaper}
            onClick={() => selectedPaper && handleStartFixed(selectedPaper)}
            style={{ width: 250 }}
          >
            开始考试
          </Button>
        </div>
      </Modal>

      <Modal
        title="🎲 随机卷考试"
        open={randomModalOpen}
        onOk={handleRandomExam}
        onCancel={() => setRandomModalOpen(false)}
        okText="生成试卷并开考"
        cancelText="取消"
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: 16 }}>将从总题库 <b>{questions.length}</b> 道题中随机抽取：</p>
          <ul style={{ paddingLeft: 24, lineHeight: 2, listStyle: 'none' }}>
            <li>单选题：100 道</li>
            <li>多选题：40 道</li>
            <li>判断题：60 道</li>
            <li>合计：200 道 ｜ 满分 100 分 ｜ 合格 60 分</li>
            <li>考试时间：90 分钟</li>
          </ul>
        </div>
      </Modal>
    </>
  )
}