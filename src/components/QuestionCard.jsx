/**
 * 题目卡片组件
 * 
 * 功能：显示单个题目及选项
 * - 支持单选、多选、判断题型
 * - 显示答题状态
 * - 回顾模式下显示正确答案和错误答案
 * 
 * Props:
 * - question: object - 题目对象
 * - currentAns: array - 当前答案
 * - currentIndex: number - 当前题目索引
 * - total: number - 总题数
 * - isReviewMode: boolean - 是否为回顾模式
 * - onSelectOption: function - 选择选项函数
 * - showNav: boolean - 是否显示导航按钮
 * - onPrev: function - 上一题函数
 * - onNext: function - 下一题函数
 * - onSubmit: function - 交卷函数
 * - showSubmit: boolean - 是否显示交卷按钮
 */
import { LeftOutlined, RightOutlined, RetweetOutlined, OrderedListOutlined, VerticalLeftOutlined, VerticalRightOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Tooltip, Popconfirm } from 'antd'

export default function QuestionCard({
  question,
  currentAns,
  currentIndex,
  total,
  isReviewMode,
  onSelectOption,
  showNav,
  onPrev,
  onNext,
  onSubmit,
  showSubmit,
  autoNext,
  onToggleAutoNext,
  viewMode,
  onToggleViewMode,
  sidebarHidden,
  onToggleSidebar,
  showConfirmNext
}) {
  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const isLast = currentIndex === total - 1

  const renderOption = (opt, idx) => {
    // 判断题使用完整选项文字作为key，其他题型使用第一个字符
    const key = question.type === 'judge' ? opt : opt.charAt(0)
    const selected = isReviewMode ? question.userAns?.includes(key) : currentAns.includes(key)
    const isCorrect = question.answer.includes(key)
    // 判断这道题是否答错了
    const isWrong = isReviewMode && question.status === 'wrong'
    let optionClass = ''

    if (isReviewMode) {
      // 用户选择的答案始终是蓝色加粗
      if (selected) {
        optionClass = 'selected'
      }
      // 如果这道题答错了，正确答案显示绿色加粗
      if (isWrong && isCorrect) {
        optionClass += ' correct-answer'
      }
    } else {
      optionClass = selected ? 'selected' : ''
    }

    return (
      <div
        key={idx}
        className={`option-row ${optionClass} ${isReviewMode ? 'readonly' : ''}`}
        onClick={() => !isReviewMode && onSelectOption(key)}
      >
        <span className="option-text">{opt}</span>
      </div>
    )
  }

  return (
    <div className="exam-card">
      <div className="exam-toolbar">
        {!isReviewMode && (
          <Tooltip title={autoNext ? '切换为手动切题' : '切换为自动切题'}>
            <button 
              className={`toolbar-btn auto-next-btn ${autoNext ? 'active' : ''}`}
              onClick={onToggleAutoNext}
            >
              <RetweetOutlined />
            </button>
          </Tooltip>
        )}
        <Tooltip title={viewMode === 'overview' ? '切换为单题模式' : '切换为全览模式'}>
          <button 
            className={`toolbar-btn view-mode-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={onToggleViewMode}
          >
            <OrderedListOutlined />
          </button>
        </Tooltip>
        <Tooltip title={sidebarHidden ? '显示侧边栏' : '隐藏侧边栏'}>
          <button 
            className={`toolbar-btn sidebar-toggle-btn ${sidebarHidden ? 'active' : ''}`}
            onClick={onToggleSidebar}
          >
            {sidebarHidden ? <VerticalRightOutlined /> : <VerticalLeftOutlined />}
          </button>
        </Tooltip>
      </div>
      <div className="card-content">
        <div className="exam-header">
          <span className="q-index">第 {currentIndex + 1} / {total} 题</span>
          <span className={`q-type-badge type-${question.type}`}>{typeMap[question.type]}</span>
          {isReviewMode && question.status && (
            <span className={`overview-status ${question.status}`}>
              {question.status === 'correct' ? <CheckOutlined /> : question.status === 'wrong' ? <CloseOutlined /> : null}
            </span>
          )}
        </div>

        <div className="question-content">
          <div className="question-text">{question.question}</div>
          <div className="options-list">
            {question.options.map(renderOption)}
          </div>
          {isReviewMode && question.parse && (
            <div className="parse-box show">
              <div className="parse-title">📖 解析</div>
              <div className="parse-text">{question.parse}</div>
              <div className="parse-answer">
                正确答案：{question.answer.join(', ')} · 你的答案：{question.userAns?.length ? question.userAns.join(', ') : '未选'}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNav && (
        <div className="exam-nav">
          <button disabled={currentIndex === 0} onClick={onPrev}><LeftOutlined /></button>
          <button disabled={isLast} onClick={onNext}><RightOutlined /></button>
          {!isReviewMode && showSubmit && (
            <Popconfirm
              title="确定交卷？"
              okText="确定"
              cancelText="取消"
              onConfirm={onSubmit}
              overlayStyle={{ width: 280, padding: '16px 20px' }}
            >
              <button className="btn-primary">交卷</button>
            </Popconfirm>
          )}
        </div>
      )}
      
      {/* 自动切题模式下多选题的确认按钮 */}
      {showConfirmNext && (
        <div className="exam-nav">
          <button className="btn-primary confirm-next-btn" onClick={onNext}>确认并下一题</button>
        </div>
      )}
    </div>
  )
}