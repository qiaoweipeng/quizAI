/**
 * 首页组件
 * 
 * 功能：系统首页，展示三种模式入口
 * - 固定考卷：选择固定试卷进行考试（弹框选择）
 * - 随机考卷：从题库随机抽取题目生成试卷（弹框选择）
 * - 练习模式：自由选择题型和数量进行练习（弹框选择）
 * 
 * Props:
 * - data: { papers, questions } - 试卷和题目数据
 * - setPage: function - 页面切换函数
 * - setExamState: function - 设置考试状态函数
 * - setPracticeState: function - 设置练习状态函数
 */
import { useState } from 'react'
import { Modal, Select, InputNumber, Table, Button, Radio } from 'antd'
import { EXAM_TIME, shuffleArray } from '../utils/examUtils'

export default function HomePage({ data, setPage, setExamState, setPracticeState }) {
  const [randomModalOpen, setRandomModalOpen] = useState(false)
  const [practiceModalOpen, setPracticeModalOpen] = useState(false)
  const [fixedModalOpen, setFixedModalOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [practiceType, setPracticeType] = useState('single')
  const [practiceCount, setPracticeCount] = useState(10)
  const [practiceMode, setPracticeMode] = useState('free')

  const handleRandomExam = () => {
    if (data.questions.length < 200) {
      Modal.warning({
        title: '题库不足',
        content: `总题库不足200题（当前 ${data.questions.length} 道），无法生成随机卷`,
      })
      return
    }

    const all = data.questions
    const single = shuffleArray(all.filter(q => q.type === 'single')).slice(0, 100)
    const multiple = shuffleArray(all.filter(q => q.type === 'multiple')).slice(0, 40)
    const judge = shuffleArray(all.filter(q => q.type === 'judge')).slice(0, 60)
    // 顺序固定：前100道单选，101-140道多选，141-200道判断（不再打乱整个数组）
    const questions = [...single, ...multiple, ...judge]

    // 生成唯一的试卷名称，确保每次生成的试卷都不同，用于区分刷新恢复
    const timestamp = Date.now().toString(36)

    setExamState({
      mode: 'random',
      paperName: `随机卷-${timestamp}`,
      questions,
      answers: {},
      marked: {},
      current: 0,
      timeLeft: EXAM_TIME,
      finished: false,
      startTime: Date.now(),
      autoNext: false
    })
    setPage('exam')
    setRandomModalOpen(false)
  }

  const handleStartPractice = () => {
    if (practiceMode === 'free') {
      const pool = data.questions.filter(q => q.type === practiceType)
      if (pool.length === 0) {
        Modal.warning({
          title: '暂无题目',
          content: '该题型暂无题目',
        })
        return
      }
      const n = Math.min(practiceCount, pool.length)
      const questions = shuffleArray(pool).slice(0, n)
      setPracticeState({ questions, current: 0, answers: {}, showParse: {} })
      setPage('practice-exam')
      setPracticeModalOpen(false)
    } else if (practiceMode === 'all') {
      const questions = data.questions
      if (questions.length === 0) {
        Modal.warning({
          title: '暂无题目',
          content: '题库暂无题目',
        })
        return
      }
      setPracticeState({ questions, current: 0, answers: {}, showParse: {} })
      setPage('practice-exam')
      setPracticeModalOpen(false)
    }
  }

  const handleStartFixed = (paper) => {
    const questions = paper.questions || []
    if (questions.length === 0) {
      Modal.warning({
        title: '试卷无题目',
        content: '该试卷没有题目',
      })
      return
    }
    // 清除 localStorage 中的旧考试状态，确保新考试不会加载上一次的结果
    localStorage.removeItem('exam_state')
    setExamState({
      mode: 'fixed',
      paperName: paper.name,
      questions,
      answers: {},
      marked: {},
      current: 0,
      timeLeft: EXAM_TIME,
      finished: false,
      startTime: Date.now(),
      autoNext: false
    })
    setPage('exam')
    setFixedModalOpen(false)
  }

  const availableCount = data.questions.filter(q => q.type === practiceType).length

  return (
    <div className="home-page">
      <div className="mode-sections">
        {/* 考试模式 - 占2/3 */}
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

        {/* 练习模式 - 占1/3 */}
        <div className="mode-section practice-mode" onClick={() => setPracticeModalOpen(true)}>
          <div className="section-header">
            <div className="section-icon">✏️</div>
            <div className="section-info">
              <h2>练习模式</h2>
              <p>自由练习，巩固知识</p>
            </div>
          </div>
          <div className="practice-content">
            <p style={{ textAlign: 'left' }}>自选题型<span style={{ color: '#999', fontSize: '0.85em' }}>（单选/多选/判断）</span>和数量</p>
            <p style={{ textAlign: 'left' }}>不计时</p>
            <p style={{ textAlign: 'left' }}>即时查看解析</p>

            <Button className="btn-primary" style={{ width: '100%', fontSize: '1em' }}>进入练习</Button>
          </div>
        </div>
      </div>

      {data.papers.length === 0 && data.questions.length === 0 && (
        <div className="empty-tip">
          ⚠️ 暂无题库数据，请检查json文件夹中的题目文件
        </div>
      )}

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
            dataSource={data.papers}
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
            style={{ minWidth: 200, height: 48, fontSize: 16 }}
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
          <p style={{ marginBottom: 16 }}>将从总题库 <b>{data.questions.length}</b> 道题中随机抽取：</p>
          <ul style={{ paddingLeft: 24, lineHeight: 2 }}>
            <li>单选题：100 道</li>
            <li>多选题：40 道</li>
            <li>判断题：60 道</li>
            <li>合计：200 道 · 满分 100 分 · 及格 60 分</li>
            <li>考试时间：90 分钟</li>
          </ul>
        </div>
      </Modal>

      <Modal
        title="✏️ 专项练习"
        open={practiceModalOpen}
        onOk={handleStartPractice}
        onCancel={() => setPracticeModalOpen(false)}
        okText="开始练习"
        cancelText="取消"
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
              练习模式
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
                { label: '全部错题', value: 'wrong', disabled: true },
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
    </div>
  )
}