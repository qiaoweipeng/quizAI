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
import { Divider, Popconfirm } from 'antd'

export default function QuestionSidebar({ 
  questions, 
  current, 
  answers, 
  isReviewMode, 
  onGoQuestion, 
  showSubmit, 
  onSubmit 
}) {
  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }

  // 生成所有题目按钮和标签
  const renderAllQuestions = () => {
    const elements = []
    
    // 单选题 1-100
    if (questions.length > 0) {
      elements.push(
        <Divider key="single-label" orientation="left" style={{ margin: '8px 0' }}>单选题 <span className="qnum-group-range">1-100</span></Divider>
      )
      for (let i = 0; i < Math.min(100, questions.length); i++) {
        const qq = questions[i]
        const hasAns = !!answers[i]
        const isCurrent = i === current
        const statusClass = isReviewMode && qq.status ? qq.status : ''
        elements.push(
          <button
            key={i}
            className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${statusClass}`}
            onClick={() => onGoQuestion(i)}
            title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
          >
            {i + 1}
          </button>
        )
      }
    }
    
    // 多选题 101-140
    if (questions.length > 100) {
      elements.push(
        <Divider key="multiple-label" orientation="left" style={{ margin: '8px 0' }}>多选题 <span className="qnum-group-range">101-140</span></Divider>
      )
      for (let i = 100; i < Math.min(140, questions.length); i++) {
        const qq = questions[i]
        const hasAns = !!answers[i]
        const isCurrent = i === current
        const statusClass = isReviewMode && qq.status ? qq.status : ''
        elements.push(
          <button
            key={i}
            className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${statusClass}`}
            onClick={() => onGoQuestion(i)}
            title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
          >
            {i + 1}
          </button>
        )
      }
    }
    
    // 判断题 141-200
    if (questions.length > 140) {
      elements.push(
        <Divider key="judge-label" orientation="left" style={{ margin: '8px 0' }}>判断题 <span className="qnum-group-range">141-200</span></Divider>
      )
      for (let i = 140; i < Math.min(200, questions.length); i++) {
        const qq = questions[i]
        const hasAns = !!answers[i]
        const isCurrent = i === current
        const statusClass = isReviewMode && qq.status ? qq.status : ''
        elements.push(
          <button
            key={i}
            className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${statusClass}`}
            onClick={() => onGoQuestion(i)}
            title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
          >
            {i + 1}
          </button>
        )
      }
    }
    
    return elements
  }

  return (
    <div className="sidebar-scroll">
      <div className="qnum-grid">
        {renderAllQuestions()}
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
            <button className="btn-submit-exam">交卷</button>
          </Popconfirm>
        </div>
      )}
    </div>
  )
}