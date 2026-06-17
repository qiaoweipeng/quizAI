/**
 * 错题预览模态框组件
 * 
 * 展示考试中的错题和未答题，支持查看题目详情、选项和答案对比。
 * 
 * Props:
 * @param {boolean} visible - 弹窗是否可见
 * @param {array} wrongList - 错题列表
 * @param {function} onClose - 关闭弹窗回调
 */
import { Button } from 'antd'
import QuestionOption from '../exam/QuestionOption'
import { getOptionKey } from '../../utils/examUtils'

export default function WrongAnswerModal({ visible, wrongList, onClose }) {
  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 错题预览（共 {wrongList.length} 道）</h3>
          <Button className="modal-close" onClick={onClose}>×</Button>
        </div>
        <div className="modal-body">
          {wrongList.map(({ idx, q, ans, status }) => {
            const renderOption = (opt, optIdx) => {
              const key = q.type === 'judge' ? opt : getOptionKey(opt)
              const selected = ans?.includes(key)
              const isCorrect = q.answer.includes(key)
              const isWrong = status === 'wrong'

              return (
                <QuestionOption
                  key={key}
                  opt={opt}
                  questionType={q.type}
                  isReviewMode={true}
                  selected={selected}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                  onClick={() => {}}
                />
              )
            }

            return (
              <div key={idx} className={`review-item ${status}`}>
                <div className="review-header">
                  <span className="review-index">第 {idx + 1} 题</span>
                  <span className={`review-tag ${status}`}>
                    {status === 'wrong' ? '❌ 答错' : '⏳ 未答'}
                  </span>
                </div>
                <div className="review-question">{q.question}</div>
                <div className="options-list">
                  {q.options.map(renderOption)}
                </div>
                <div className="review-answer">
                  <span>你的答案：{ans && ans.length ? ans.join(', ') : '未答'}</span>
                  <span>正确答案：{q.answer.join(', ')}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="modal-footer">
          <Button className="btn-secondary" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  )
}