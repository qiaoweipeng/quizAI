/**
 * 题目卡片组件
 * 
 * 单题展示卡片，支持答题和回顾两种模式。
 * 
 * 功能特性：
 * - 支持单选、多选、判断题型显示
 * - 答题模式：点击选项选择答案
 * - 回顾模式：显示正确答案、用户答案及对错状态
 * - 提供自动切题、视图切换、侧边栏控制等工具栏
 * - 支持解析展示
 * 
 * Props:
 * @param {object} question - 题目对象
 * @param {array} currentAns - 当前用户答案数组
 * @param {number} currentIndex - 当前题目索引
 * @param {number} total - 总题数
 * @param {boolean} isReviewMode - 是否为回顾模式
 * @param {function} onSelectOption - 选择选项回调
 * @param {boolean} showNav - 是否显示导航按钮
 * @param {function} onPrev - 上一题回调
 * @param {function} onNext - 下一题回调
 * @param {function} onSubmit - 交卷回调
 * @param {boolean} showSubmit - 是否显示交卷按钮
 * @param {boolean} autoNext - 是否自动切题
 * @param {function} onToggleAutoNext - 切换自动切题回调
 * @param {string} viewMode - 视图模式（'single' | 'overview'）
 * @param {function} onToggleViewMode - 切换视图模式回调
 * @param {boolean} sidebarHidden - 侧边栏是否隐藏
 * @param {function} onToggleSidebar - 切换侧边栏显示回调
 * @param {boolean} showConfirmNext - 是否显示确认下一题按钮
 * @param {boolean} showResultModal - 是否显示结果弹窗
 * @param {function} onShowResult - 显示结果回调
 * @param {boolean} showParse - 是否显示解析
 * @param {function} onToggleShowParse - 切换解析显示回调
 * @param {boolean} showWrongOnly - 是否只看错题
 * @param {function} onToggleShowWrongOnly - 切换只看错题回调
 * @param {boolean} isWrongOnlyMode - 是否处于只看错题模式
 * @param {array} wrongQuestionIndices - 错题索引列表
 * @param {function} onReExamWrong - 重考错题回调
 */
import { LeftOutlined, RightOutlined, CheckOutlined, CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Tooltip, Popconfirm, message } from 'antd'
import useExamStore from '../../store/examStore.ts'
import QuestionOption from './QuestionOption'
import ExamToolbar from './ExamToolbar'
import { getOptionKey } from '../../utils/examUtils'

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
  onToggleSidebar,
  showConfirmNext,
  isWrongOnlyMode = false,
  wrongQuestionIndices = [],
  onReExamWrong
}) {
  const { sidebarHidden, showParse } = useExamStore()

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  
  // 在只看错题模式下，计算在错题列表中的位置
  const wrongIdx = isWrongOnlyMode ? wrongQuestionIndices.indexOf(currentIndex) : -1
  const isFirstWrong = wrongIdx === 0
  const isLastWrong = wrongIdx === wrongQuestionIndices.length - 1
  
  // 判断导航按钮是否禁用
  const isPrevDisabled = isWrongOnlyMode ? isFirstWrong : currentIndex === 0
  const isNextDisabled = isWrongOnlyMode ? isLastWrong : currentIndex === total - 1

  const renderOption = (opt, idx) => {
    const key = question.type === 'judge' ? opt : getOptionKey(opt)
    const selected = isReviewMode ? question.userAns?.includes(key) : currentAns.includes(key)
    const isCorrect = question.answer.includes(key)
    const isWrong = isReviewMode && question.status === 'wrong'

    return (
      <QuestionOption
        key={key}
        opt={opt}
        questionType={question.type}
        isReviewMode={isReviewMode}
        selected={selected}
        isCorrect={isCorrect}
        isWrong={isWrong}
        onClick={() => !isReviewMode && onSelectOption(key)}
      />
    )
  }

  const handleDoubleClickQuestion = () => {
    if (question.id) {
      navigator.clipboard.writeText(question.id)
      message.success(`题目ID ${question.id} 已复制`)
    }
  }

  return (
    <div className="exam-card">
      <ExamToolbar
        isReviewMode={isReviewMode}
        viewMode={viewMode}
        sidebarHidden={sidebarHidden}
        autoNext={autoNext}
        onToggleAutoNext={onToggleAutoNext}
        onToggleViewMode={onToggleViewMode}
        onToggleSidebar={onToggleSidebar}
        onReExamWrong={onReExamWrong}
        wrongQuestionIndices={wrongQuestionIndices}
      />
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
          <div className="question-text" onDoubleClick={handleDoubleClickQuestion}>{question.question}</div>
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
          <Tooltip title={isNextDisabled ? (sidebarHidden ? '没有下一道题了！请打开侧边栏，查看答题情况。' : '没有下一道题了') : ''}>
            <Button disabled={isNextDisabled} onClick={onNext} icon={<RightOutlined />} />
          </Tooltip>
          {!isReviewMode && showSubmit && (
            <Popconfirm
              title="确定交卷？"
              okText="确定"
              cancelText="取消"
              onConfirm={onSubmit}
            >
              <Button type="primary" size="large">交卷</Button>
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