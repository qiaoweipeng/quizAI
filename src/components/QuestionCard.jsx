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
import { LeftOutlined, RightOutlined, RetweetOutlined, OrderedListOutlined, VerticalLeftOutlined, VerticalRightOutlined, CheckOutlined, CloseOutlined, BarChartOutlined, DownOutlined, QuestionCircleOutlined, EllipsisOutlined } from '@ant-design/icons'
import { Tooltip, Popconfirm, Button, Dropdown, Space } from 'antd'

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
  showConfirmNext,
  showResultModal,
  onShowResult,
  showParse,
  onToggleShowParse,
  showWrongOnly,
  onToggleShowWrongOnly,
  isWrongOnlyMode = false,
  wrongQuestionIndices = []
}) {
  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  
  // 在只看错题模式下，计算在错题列表中的位置
  const wrongIdx = isWrongOnlyMode ? wrongQuestionIndices.indexOf(currentIndex) : -1
  const isFirstWrong = wrongIdx === 0
  const isLastWrong = wrongIdx === wrongQuestionIndices.length - 1
  
  // 判断导航按钮是否禁用
  const isPrevDisabled = isWrongOnlyMode ? isFirstWrong : currentIndex === 0
  const isNextDisabled = isWrongOnlyMode ? isLastWrong : currentIndex === total - 1

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

    // 回顾模式下的图标显示
    let Icon = null
    let iconStyle = {}
    if (isReviewMode) {
      if (selected && isCorrect) {
        // 用户选对了
        Icon = CheckOutlined
        iconStyle = { color: '#52c41a' }
      } else if (selected && !isCorrect) {
        // 用户选错了
        Icon = CloseOutlined
        iconStyle = { color: '#ff4d4f' }
      } else if (!selected && isCorrect && isWrong) {
        // 正确答案但用户没选（题目答错时显示）
        Icon = CheckOutlined
        iconStyle = { color: '#52c41a' }
      }
    }

    return (
      <div
        key={idx}
        className={`option-row ${optionClass} ${isReviewMode ? 'readonly' : ''}`}
        onClick={() => !isReviewMode && onSelectOption(key)}
      >
        <span className="option-text">{opt}</span>
        {Icon && <Icon style={{ marginLeft: 8, fontSize: 16, ...iconStyle }} />}
      </div>
    )
  }

  return (
    <div className="exam-card">
      <div className="exam-toolbar">
        {isReviewMode && (
          <Space.Compact>
            <Button className="toolbar-btn result-btn" onClick={onShowResult} style={{ minWidth: '100px' }}>
              考试结果
            </Button>
            <Dropdown 
              menu={{
                items: [
                  {
                    key: 'showParse',
                    label: showParse ? '不看解析' : '查看解析',
                    onClick: onToggleShowParse
                  },
                  {
                    key: 'showWrongOnly',
                    label: showWrongOnly ? '全部题目' : '只看错题',
                    onClick: onToggleShowWrongOnly
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Button className="toolbar-btn" icon={<EllipsisOutlined />} />
            </Dropdown>
          </Space.Compact>
        )}
        {!isReviewMode && (
          <Tooltip title={autoNext ? '切换为手动切题' : '切换为自动切题'}>
            <Button className={`toolbar-btn auto-next-btn ${autoNext ? 'active' : ''}`} onClick={onToggleAutoNext}>
              <RetweetOutlined />
            </Button>
          </Tooltip>
        )}
        <Tooltip title={viewMode === 'overview' ? '切换为单题模式' : '切换为全览模式'}>
          <Button className={`toolbar-btn view-mode-btn ${viewMode === 'overview' ? 'active' : ''}`} onClick={onToggleViewMode}>
            <OrderedListOutlined />
          </Button>
        </Tooltip>
        <Tooltip title={sidebarHidden ? '显示侧边栏' : '隐藏侧边栏'}>
          <Button className={`toolbar-btn sidebar-toggle-btn ${sidebarHidden ? 'active' : ''}`} onClick={onToggleSidebar}>
            {sidebarHidden ? <VerticalRightOutlined /> : <VerticalLeftOutlined />}
          </Button>
        </Tooltip>
      </div>
      <div className="card-content">
        <div className="exam-header">
          <span className="q-index">
            {isWrongOnlyMode 
              ? `第 ${wrongIdx + 1} / ${wrongQuestionIndices.length} 题`
              : `第 ${currentIndex + 1} / ${total} 题`
            }
          </span>
          <span className={`q-type-badge type-${question.type}`}>{typeMap[question.type]}</span>
        </div>

        <div className="question-content">
          <div className="question-text">{question.question}</div>
          <div className="options-list">
            {question.options.map(renderOption)}
          </div>
          {isReviewMode && showParse && question.parse && (
            <div className="parse-box show">
              <div className="parse-title"><QuestionCircleOutlined /> 解析</div>
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
          <Button disabled={isPrevDisabled} onClick={onPrev} icon={<LeftOutlined />} />
          <Button disabled={isNextDisabled} onClick={onNext} icon={<RightOutlined />} />
          {!isReviewMode && showSubmit && (
            <Popconfirm
              title="确定交卷？"
              okText="确定"
              cancelText="取消"
              onConfirm={onSubmit}
            >
              <Button className="btn-primary">交卷</Button>
            </Popconfirm>
          )}
        </div>
      )}
      
      {/* 自动切题模式下多选题的确认按钮 */}
      {showConfirmNext && (
        <div className="exam-nav">
          <Button className="btn-primary confirm-next-btn" onClick={onNext}>确认并下一题</Button>
        </div>
      )}
    </div>
  )
}