/**
 * 考试计时器组件
 * 
 * 功能：显示考试剩余时间，当剩余时间少于10分钟时显示警告
 * 
 * Props:
 * - timeLeft: number - 剩余秒数
 * - visible: boolean - 是否显示
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