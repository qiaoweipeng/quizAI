/**
 * 题目导航侧边栏组件
 * 
 * 功能：显示所有题目编号，支持快速跳转
 * - 按题型分组显示（单选1-100，多选101-140，判断141-200）
 * - 显示答题状态（已答/未答）
 * - 回顾模式下显示对错状态
 * 
 * Props:
 * - questions: array - 题目数组
 * - current: number - 当前题目索引
 * - answers: object - 答案对象
 * - isReviewMode: boolean - 是否为回顾模式
 * - onGoQuestion: function - 跳转题目函数
 * - showSubmit: boolean - 是否显示交卷按钮
 * - onSubmit: function - 交卷函数
 */
import { Divider, Popconfirm, BorderBeam, Button } from 'antd'

export default function QuestionSidebar({ 
  questions, 
  current, 
  answers, 
  isReviewMode, 
  onGoQuestion, 
  showSubmit, 
  onSubmit,
  filter = 'all' // 'all' | 'wrong'
}) {
  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }

  // 根据过滤条件获取题目索引列表
  const getFilteredIndices = () => {
    if (filter === 'wrong') {
      return questions
        .map((qq, idx) => ({ qq, idx }))
        .filter(({ qq }) => qq.status === 'wrong')
        .map(({ idx }) => idx)
    }
    return questions.map((_, idx) => idx)
  }

  const filteredIndices = getFilteredIndices()

  // 渲染单个题目按钮
  const renderButton = (originalIdx, displayNum) => {
    const qq = questions[originalIdx]
    const hasAns = !!answers[originalIdx]
    const isCurrent = originalIdx === current
    const statusClass = isReviewMode && qq.status ? qq.status : ''
    return (
      <div key={originalIdx} style={{ display: 'inline-block' }}>
        {isCurrent ? (
          <BorderBeam duration={1} color={[{ color: '#7c3aed ', percent: 0 }, { color: '#06b6d4', percent: 49 }, { color: '#67e8f9', percent: 100 }]}>
            
            <Button
              style={{ border: '1px solid #d9d9d9' }}
              className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${statusClass}`}
              onClick={() => onGoQuestion(originalIdx)}
              title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
            >
              {displayNum}
            </Button>
          </BorderBeam>
        ) : (
          <Button
            className={`qnum-btn ${hasAns ? 'answered' : ''} ${statusClass}`}
            onClick={() => onGoQuestion(originalIdx)}
            title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
          >
            {displayNum}
          </Button>
        )}
      </div>
    )
  }

  // 按题型分组渲染题目
  const renderGroupedQuestions = () => {
    const elements = []
    
    // 按题型分组
    const grouped = {
      single: [],
      multiple: [],
      judge: []
    }
    
    filteredIndices.forEach((originalIdx, displayIdx) => {
      const qq = questions[originalIdx]
      grouped[qq.type].push({ originalIdx, displayNum: displayIdx + 1 })
    })

    // 渲染单选题
    if (grouped.single.length > 0) {
      const singleStart = 1
      const singleEnd = grouped.single.length
      elements.push(
        <Divider key="single-label" orientation="left" style={{ margin: '8px 0' }}>
          单选题 <span className="qnum-group-range">{singleStart}-{singleEnd}（共{grouped.single.length}道）</span>
        </Divider>
      )
      grouped.single.forEach(({ originalIdx, displayNum }) => {
        elements.push(renderButton(originalIdx, displayNum))
      })
    }
    
    // 渲染多选题
    if (grouped.multiple.length > 0) {
      const multipleStart = grouped.single.length + 1
      const multipleEnd = grouped.single.length + grouped.multiple.length
      elements.push(
        <Divider key="multiple-label" orientation="left" style={{ margin: '8px 0' }}>
          多选题 <span className="qnum-group-range">{multipleStart}-{multipleEnd}（共{grouped.multiple.length}道）</span>
        </Divider>
      )
      grouped.multiple.forEach(({ originalIdx, displayNum }) => {
        elements.push(renderButton(originalIdx, displayNum))
      })
    }
    
    // 渲染判断题
    if (grouped.judge.length > 0) {
      const judgeStart = grouped.single.length + grouped.multiple.length + 1
      const judgeEnd = judgeStart + grouped.judge.length - 1
      elements.push(
        <Divider key="judge-label" orientation="left" style={{ margin: '8px 0' }}>
          判断题 <span className="qnum-group-range">{judgeStart}-{judgeEnd}（共{grouped.judge.length}道）</span>
        </Divider>
      )
      grouped.judge.forEach(({ originalIdx, displayNum }) => {
        elements.push(renderButton(originalIdx, displayNum))
      })
    }
    
    return elements
  }

  return (
    <div className="sidebar-scroll">
      <div className="qnum-grid">
        {renderGroupedQuestions()}
      </div>
      {!isReviewMode && showSubmit && (
        <div className="sidebar-footer">
          <Popconfirm
            title="确定交卷？"
            okText="确定"
            cancelText="取消"
            onConfirm={onSubmit}
            overlayStyle={{ width: 280, padding: '16px 20px' }}
          >
            <Button className="btn-submit-exam">交卷</Button>
          </Popconfirm>
        </div>
      )}
    </div>
  )
}