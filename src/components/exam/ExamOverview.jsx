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
import { CheckOutlined, CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Dropdown, Menu, App } from 'antd'
import useExamStore from '../../store/examStore.ts'
import QuestionOption from './QuestionOption'
import ExamToolbar from './ExamToolbar'
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
  const { addToWrongBook, wrongBook } = useExamStore()
  const { message } = App.useApp()
  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }

  const filteredQuestions = showWrongOnly
    ? questions.filter((qq, idx) => qq.status === 'wrong')
    : questions

  const handleDoubleClickQuestion = (qq) => {
    if (qq.id) {
      navigator.clipboard.writeText(qq.id)
      message.success(`题目ID ${qq.id} 已复制`)
    }
  }

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
      <ExamToolbar
        isReviewMode={isReviewMode}
        viewMode="overview"
        sidebarHidden={sidebarHidden}
        onToggleViewMode={() => onToggleViewMode('single')}
        onToggleSidebar={onToggleSidebar}
        onReExamWrong={onReExamWrong}
        wrongQuestionIndices={wrongQuestionIndices}
      />
      {filteredQuestions.map((qq, idx) => {
        const originalIdx = questions.indexOf(qq)
        const ans = answers[originalIdx] || []
        const statusClass = isReviewMode && qq.status ? `status-${qq.status}` : ''
        const displayIndex = showWrongOnly ? idx + 1 : originalIdx + 1
        
        const isQuestionWrong = isReviewMode && qq.status === 'wrong'
        const isInWrongBook = wrongBook.includes(qq.id)

        const handleAddToWrongBook = () => {
          addToWrongBook(qq.id)
          message.success('已移入错题本')
        }

        return isQuestionWrong ? (
            <Dropdown 
              menu={{
                items: [
                  {
                    key: 'add',
                    label: isInWrongBook ? '已在错题本' : '移入错题本',
                    onClick: handleAddToWrongBook,
                    disabled: isInWrongBook
                  }
                ]
              }}
              trigger={['contextMenu']}
            >
              <div 
                key={originalIdx} 
                className={`overview-item ${originalIdx === current ? 'current' : ''} ${statusClass}`}
                data-original-index={originalIdx}
                onClick={() => onGoQuestion(originalIdx)}
              >
                <div className="overview-header">
                  <span className="overview-index" onDoubleClick={() => handleDoubleClickQuestion(qq)}>{displayIndex}</span>
                  <span className={`overview-type type-${qq.type}`}>{typeMap[qq.type]}</span>
                </div>
                <div className="overview-question" onDoubleClick={() => handleDoubleClickQuestion(qq)}>{qq.question}</div>
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
          </Dropdown>
        ) : (
          <div 
            key={originalIdx} 
            className={`overview-item ${originalIdx === current ? 'current' : ''} ${statusClass}`}
            data-original-index={originalIdx}
            onClick={() => onGoQuestion(originalIdx)}
          >
            <div className="overview-header">
              <span className="overview-index" onDoubleClick={() => handleDoubleClickQuestion(qq)}>{displayIndex}</span>
              <span className={`overview-type type-${qq.type}`}>{typeMap[qq.type]}</span>
            </div>
            <div className="overview-question" onDoubleClick={() => handleDoubleClickQuestion(qq)}>{qq.question}</div>
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
        )})}
    </div>
  )
}