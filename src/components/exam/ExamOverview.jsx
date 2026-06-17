/**
 * 考试全览模式组件
 * 
 * 显示所有题目的列表视图，支持快速浏览和跳转。
 * 
 * Props:
 * @param {array} questions - 题目列表
 * @param {object} answers - 用户答案对象
 * @param {number} current - 当前题目索引
 * @param {boolean} isReviewMode - 是否为回顾模式
 * @param {boolean} showWrongOnly - 是否只看错题
 * @param {boolean} showParse - 是否显示解析
 * @param {boolean} sidebarHidden - 侧边栏是否隐藏
 * @param {function} onGoQuestion - 跳转题目回调
 * @param {function} onToggleViewMode - 切换视图模式回调
 * @param {function} onToggleSidebar - 切换侧边栏回调
 * @param {function} onReExamWrong - 重考错题回调
 * @param {array} wrongQuestionIndices - 错题索引列表
 * @param {function} setState - 状态更新函数
 */
import { Button, Space, Dropdown, Tooltip, Popconfirm } from 'antd'
import { RollbackOutlined, VerticalLeftOutlined, VerticalRightOutlined, CheckOutlined, CloseOutlined, QuestionCircleOutlined, EllipsisOutlined } from '@ant-design/icons'
import useExamStore from '../../store/examStore.ts'
import QuestionOption from './QuestionOption'
import { getOptionKey } from '../../utils/examUtils'

export default function ExamOverview({
  questions,
  answers,
  current,
  isReviewMode,
  showWrongOnly,
  showParse,
  sidebarHidden,
  onGoQuestion,
  onToggleViewMode,
  onToggleSidebar,
  onReExamWrong,
  wrongQuestionIndices,
  updateExamState
}) {
  const { toggleShowParse, toggleShowWrongOnly, setShowResultModal } = useExamStore()
  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }

  const filteredQuestions = showWrongOnly
    ? questions.filter((qq, idx) => qq.status === 'wrong')
    : questions

  const handleOptionClick = (e, qq, ans, idx) => {
    e.stopPropagation()
    if (isReviewMode) return
    
    const key = qq.type === 'judge' ? qq.options[idx] : getOptionKey(qq.options[idx])
    let newAns = [...ans]
    if (qq.type === 'multiple') {
      if (newAns.includes(key)) {
        newAns = newAns.filter(k => k !== key)
      } else {
        newAns.push(key)
      }
    } else {
      newAns = [key]
    }
    
    const originalIdx = questions.indexOf(qq)
    updateExamState({
      answers: { ...answers, [originalIdx]: newAns }
    })
  }

  return (
    <div className="exam-overview">
      <div className="exam-toolbar">
        {isReviewMode && (
          <Space.Compact>
            <Button className="toolbar-btn result-btn" onClick={() => setShowResultModal(true)} style={{ minWidth: '100px' }}>
              考试结果
            </Button>
            <Dropdown 
              menu={{
                items: [
                  {
                    key: 'showParse',
                    label: showParse ? '不看解析' : '查看解析',
                    onClick: toggleShowParse
                  },
                  {
                    key: 'showWrongOnly',
                    label: showWrongOnly ? '全部题目' : '只看错题',
                    onClick: toggleShowWrongOnly
                  },
                  {
                    key: 'reExamWrong',
                    label: (
                      <Popconfirm
                        title="确认重考错题？"
                        description="将重新开始答题，当前答案将被清空。"
                        onConfirm={onReExamWrong}
                        okText="确认"
                        cancelText="取消"
                        disabled={wrongQuestionIndices.length === 0}
                      >
                        <span>{wrongQuestionIndices.length === 0 ? '无错题可重考' : '重考错题'}</span>
                      </Popconfirm>
                    )
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Button className="toolbar-btn" icon={<EllipsisOutlined />} />
            </Dropdown>
          </Space.Compact>
        )}
        <Tooltip title="返回单题模式">
          <Button className="toolbar-btn" onClick={() => onToggleViewMode('single')}>
            <RollbackOutlined />
          </Button>
        </Tooltip>
        <Tooltip title={sidebarHidden ? '显示侧边栏' : '隐藏侧边栏'}>
          <Button className="toolbar-btn sidebar-toggle-btn" onClick={onToggleSidebar}>
            {sidebarHidden ? <VerticalRightOutlined /> : <VerticalLeftOutlined />}
          </Button>
        </Tooltip>
      </div>
      {filteredQuestions.map((qq, idx) => {
        const originalIdx = questions.indexOf(qq)
        const ans = answers[originalIdx] || []
        const statusClass = isReviewMode && qq.status ? `status-${qq.status}` : ''
        const displayIndex = showWrongOnly ? idx + 1 : originalIdx + 1
        
        return (
          <div 
            key={originalIdx} 
            className={`overview-item ${originalIdx === current ? 'current' : ''} ${statusClass}`}
            data-original-index={originalIdx}
            onClick={() => onGoQuestion(originalIdx)}
          >
            <div className="overview-header">
              <span className="overview-index">{displayIndex}</span>
              <span className={`overview-type type-${qq.type}`}>{typeMap[qq.type]}</span>
              <span className="overview-id">{qq.id}</span>
            </div>
            <div className="overview-question">{qq.question}</div>
            <div className="options-list">
              {qq.options.map((opt, optIdx) => {
                const key = qq.type === 'judge' ? opt : getOptionKey(opt)
                const selected = isReviewMode ? qq.userAns?.includes(key) : ans.includes(key)
                const isCorrect = qq.answer.includes(key)
                const isWrong = isReviewMode && qq.status === 'wrong'
                
                return (
                  <QuestionOption
                    key={key}
                    opt={opt}
                    questionType={qq.type}
                    isReviewMode={isReviewMode}
                    selected={selected}
                    isCorrect={isCorrect}
                    isWrong={isWrong}
                    onClick={(e) => handleOptionClick(e, qq, ans, optIdx)}
                  />
                )
              })}
            </div>
            {isReviewMode && showParse && qq.parse && (
              <div className="parse-box show">
                <div className="parse-title"><QuestionCircleOutlined /> 解析</div>
                <div className="parse-text">{qq.parse}</div>
                <div className="parse-answer">
                  正确答案：{qq.answer.join(', ')} · 你的答案：{qq.userAns?.length ? qq.userAns.join(', ') : '未选'}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}