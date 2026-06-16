/**
 * 随机卷设置页面组件
 * 
 * 从总题库随机抽取题目生成试卷的设置页面。
 * 
 * 功能特性：
 * - 验证题库是否足够（至少200道题）
 * - 随机抽取：单选题100道、多选题40道、判断题60道
 * - 题目顺序固定：单选→多选→判断
 * - 生成唯一试卷名称（含时间戳）
 * 
 * Props:
 * @param {object} data - 题库数据对象
 * @param {array} data.questions - 题目总题库
 * @param {function} setPage - 页面切换函数
 * @param {function} setExamState - 设置考试状态函数
 */
import { Button } from 'antd'
import { EXAM_TIME, shuffleArray, clearExamState } from '../utils/examUtils'

export default function RandomSetupPage({ data, setPage, setExamState }) {
  if (data.questions.length < 200) {
    return (
      <div className="empty-page">
        <p>总题库不足200题（当前 {data.questions.length} 道），无法生成随机卷</p>
        <Button className="btn-primary" onClick={() => setPage('home')}>返回首页</Button>
      </div>
    )
  }

  const start = () => {
    // 清除旧的考试状态，确保每次生成新卷都是全新的
    clearExamState()
    
    const all = data.questions
    const single = shuffleArray(all.filter(q => q.type === 'single')).slice(0, 100)
    const multiple = shuffleArray(all.filter(q => q.type === 'multiple')).slice(0, 40)
    const judge = shuffleArray(all.filter(q => q.type === 'judge')).slice(0, 60)
    // 顺序固定：前100道单选，101-140道多选，141-200道判断
    const questions = [...single, ...multiple, ...judge]

    // 生成唯一的试卷名称（包含时间戳），确保每次生成的试卷都不同
    const timestamp = Date.now().toString(36)
    setExamState({
      mode: 'random',
      paperName: `随机卷-${timestamp}`,
      questions,
      answers: {},
      marked: {},
      current: 0,
      timeLeft: EXAM_TIME,
      finished: false,
      startTime: Date.now(),
      autoNext: false
    })
    setPage('exam')
  }

  return (
    <div className="random-setup-page">
      <h2>🎲 随机卷考试</h2>
      <div className="random-info">
        <p>将从总题库 <b>{data.questions.length}</b> 道题中随机抽取：</p>
        <ul>
          <li>单选题：100 道</li>
          <li>多选题：40 道</li>
          <li>判断题：60 道</li>
          <li>合计：200 道 · 满分 100 分 · 及格 60 分</li>
          <li>考试时间：90 分钟</li>
        </ul>
      </div>
      <Button className="btn-primary btn-large" onClick={start}>生成试卷并开考</Button>
    </div>
  )
}