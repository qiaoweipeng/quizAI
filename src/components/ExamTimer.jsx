/**
 * 考试计时器组件
 * 
 * 显示考试剩余时间，提供视觉警告提示。
 * 
 * 功能特性：
 * - 格式化显示剩余时间（时:分:秒）
 * - 剩余时间少于10分钟时显示红色警告样式
 * 
 * Props:
 * @param {number} timeLeft - 剩余时间（秒）
 * @param {boolean} [visible=true] - 是否显示计时器
 */
import { formatFullTime } from '../utils/examUtils'

export default function ExamTimer({ timeLeft, visible = true }) {
  if (!visible) return null

  return (
    <div className="timer-box">
      <div className={timeLeft < 600 ? 'timer-danger' : 'timer-normal'}>
        ⏱️ {formatFullTime(timeLeft)}
      </div>
    </div>
  )
}