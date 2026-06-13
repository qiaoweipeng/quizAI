/**
 * 随机卷设置页面组件
 * 
 * 功能：从总题库随机抽取题目生成试卷
 * - 单选题：100道
 * - 多选题：40道
 * - 判断题：60道
 * 合计200道题，与真实考试一致
 * 
 * Props:
 * - data: { papers, questions } - 试卷和题目数据
 * - setPage: function - 页面切换函数
 * - setExamState: function - 设置考试状态函数
 */
import { EXAM_TIME, shuffleArray } from '../utils/examUtils'

export default function RandomSetupPage({ data, setPage, setExamState }) {
  if (data.questions.length < 200) {
    return (
      <div className="empty-page">
        <p>总题库不足200题（当前 {data.questions.length} 道），无法生成随机卷</p>
        <button className="btn-primary" onClick={() => setPage('home')}>返回首页</button>
      </div>
    )
  }

  const start = () => {
    const all = data.questions
    const single = shuffleArray(all.filter(q => q.type === 'single')).slice(0, 100)
    const multiple = shuffleArray(all.filter(q => q.type === 'multiple')).slice(0, 40)
    const judge = shuffleArray(all.filter(q => q.type === 'judge')).slice(0, 60)
    // 顺序固定：前100道单选，101-140道多选，141-200道判断
    const questions = [...single, ...multiple, ...judge]

    setExamState({
      mode: 'random',
      paperName: '随机卷',
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
      <button className="btn-primary btn-large" onClick={start}>生成试卷并开考</button>
    </div>
  )
}