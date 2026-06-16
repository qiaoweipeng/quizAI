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

export default function QuestionOption({
  opt,
  questionType,
  isReviewMode,
  selected,
  isCorrect,
  isWrong,
  onClick
}) {
  // 判断题使用完整选项文字作为key，其他题型使用第一个字符
  const key = questionType === 'judge' ? opt : opt.charAt(0)

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
  let iconStyle = {}
  if (isReviewMode) {
    if (selected && isCorrect) {
      Icon = CheckOutlined
      iconStyle = { color: '#52c41a' }
    } else if (selected && !isCorrect) {
      Icon = CloseOutlined
      iconStyle = { color: '#ff4d4f' }
    } else if (!selected && isCorrect && isWrong) {
      Icon = CheckOutlined
      iconStyle = { color: '#52c41a' }
    }
  }

  return (
    <div
      key={key}
      className={`option-row ${optionClass} ${isReviewMode ? 'readonly' : ''}`}
      onClick={onClick}
    >
      <span className="option-text">{opt}</span>
      {Icon && <Icon style={{ marginLeft: 8, fontSize: 16, ...iconStyle }} />}
    </div>
  )
}