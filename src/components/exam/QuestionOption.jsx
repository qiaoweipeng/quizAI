/**
 * 题目选项组件
 * 
 * 复用的选项渲染组件，用于单题模式和全览模式的选项展示。
 * 
 * Props:
 * @param {string} opt - 选项文本
 * @param {string} questionType - 题型（'single' | 'multiple' | 'judge'）
 * @param {boolean} isReviewMode - 是否为回顾模式
 * @param {boolean} selected - 是否被选中
 * @param {boolean} isCorrect - 是否为正确答案
 * @param {boolean} isWrong - 题目是否答错
 * @param {function} [onClick] - 点击回调（答题模式下）
 */
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { getOptionKey } from '../../utils/examUtils'

export default function QuestionOption({
  opt,
  questionType,
  isReviewMode,
  selected,
  isCorrect,
  isWrong,
  onClick
}) {
  const key = questionType === 'judge' ? opt : getOptionKey(opt)

  let optionClass = ''

  if (isReviewMode) {
    if (selected) {
      optionClass = 'selected'
    }
    if (isWrong && isCorrect) {
      optionClass += ' correct-answer'
    }
  } else {
    optionClass = selected ? 'selected' : ''
  }

  let Icon = null
  let iconClassName = ''
  if (isReviewMode) {
    if (selected && isCorrect) {
      Icon = CheckOutlined
      iconClassName = 'icon-correct'
    } else if (selected && !isCorrect) {
      Icon = CloseOutlined
      iconClassName = 'icon-wrong'
    } else if (!selected && isCorrect && isWrong) {
      Icon = CheckOutlined
      iconClassName = 'icon-correct'
    }
  }

  return (
    <div
      key={key}
      className={`option-row ${optionClass} ${isReviewMode ? 'readonly' : ''}`}
      onClick={onClick}
    >
      <span className="option-text">{opt}</span>
      {Icon && <Icon className={`review-icon ${iconClassName}`} />}
    </div>
  )
}