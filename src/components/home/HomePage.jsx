/**
 * 首页组件
 * 
 * 系统入口页面，提供三种学习模式的选择入口。
 * 
 * 功能特性：
 * - 固定考卷模式：选择预设试卷进行模拟考试
 * - 随机考卷模式：从题库随机抽取200道题生成试卷
 * - 练习模式：自由选择题型和题目数量进行专项练习
 * - 空状态提示：题库为空时显示提示信息
 * 
 * Props:
 * @param {object} data - 题库数据对象
 * @param {array} data.papers - 固定试卷列表
 * @param {array} data.questions - 题目总题库
 * @param {function} setPage - 页面切换函数
 * @param {function} setExamState - 设置考试状态函数
 * @param {function} setPracticeState - 设置练习状态函数
 */
import ExamModeSelector from './ExamModeSelector'
import PracticeModeSelector from './PracticeModeSelector'

export default function HomePage({ data, setPage, setExamState, setPracticeState }) {
  return (
    <div className="home-page">
      <div className="mode-sections">
        <ExamModeSelector
          papers={data.papers}
          questions={data.questions}
          setExamState={setExamState}
          setPage={setPage}
        />
        <PracticeModeSelector
          questions={data.questions}
          setPracticeState={setPracticeState}
          setPage={setPage}
        />
      </div>

      {data.papers.length === 0 && data.questions.length === 0 && (
        <div className="empty-tip">
          ⚠️ 暂无题库数据，请检查json文件夹中的题目文件
        </div>
      )}
    </div>
  )
}