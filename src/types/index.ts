/**
 * 题目类型定义
 */

/**
 * 题目接口
 * 
 * 定义单个题目的完整结构
 */
export interface Question {
  /** 题目唯一标识 */
  id?: string
  /** 题目类型：单选/多选/判断 */
  type: 'single' | 'multiple' | 'judge'
  /** 题目内容 */
  question: string
  /** 选项列表 */
  options: string[]
  /** 正确答案（支持多个，多选题） */
  answer: string[]
  /** 解析内容 */
  parse?: string
  /** 答题状态（回顾模式下使用） */
  status?: 'correct' | 'wrong' | 'unanswered'
  /** 用户答案（回顾模式下使用） */
  userAns?: string[]
}

/**
 * 试卷接口
 * 
 * 定义一份试卷的结构
 */
export interface Paper {
  /** 试卷唯一标识 */
  id: string
  /** 试卷名称 */
  name: string
  /** 题目列表 */
  questions: Question[]
  /** 试卷文件路径（用于加载） */
  file?: string
}

/**
 * 考试状态接口
 * 
 * 定义考试进行中的状态
 */
export interface ExamState {
  /** 考试模式：exam-正式考试, review-回顾模式 */
  mode: 'exam' | 'review'
  /** 试卷名称 */
  paperName: string
  /** 题目列表 */
  questions: Question[]
  /** 用户答案（索引 -> 答案数组） */
  answers: Record<number, string[]>
  /** 标记的题目 */
  marked?: Record<number, boolean>
  /** 当前题目索引 */
  current: number
  /** 剩余时间（秒） */
  timeLeft: number
  /** 是否已完成 */
  finished: boolean
  /** 开始时间戳 */
  startTime: number
  /** 是否自动切题 */
  autoNext: boolean
  /** 是否显示一键预选通知 */
  showPreselectNotification?: boolean
  /** 一键预选是否已显示 */
  preselectModalShown?: boolean
}

/**
 * 练习状态接口
 * 
 * 定义练习模式下的状态
 */
export interface PracticeState {
  /** 题目列表 */
  questions: Question[]
  /** 当前题目索引 */
  current: number
  /** 用户答案 */
  answers: Record<number, string[]>
  /** 是否显示解析（索引 -> 布尔值） */
  showParse: Record<number, boolean>
}

/**
 * 考试历史记录接口
 * 
 * 记录每次考试的统计数据
 */
export interface ExamHistoryRecord {
  /** 考试轮次 */
  round: number
  /** 总题数 */
  total: number
  /** 正确数量 */
  correct: number
  /** 错误数量 */
  wrong: number
  /** 按题型统计的错误数量 */
  wrongByType?: {
    single?: number
    multiple?: number
    judge?: number
  }
}

/**
 * 考试结果接口
 * 
 * 包含考试成绩、答题统计等完整结果信息
 */
export interface ExamResult {
  /** 考试分数（百分制） */
  score: number
  /** 是否及格 */
  passed: boolean
  /** 总题数 */
  total: number
  /** 正确数量 */
  correct: number
  /** 错误数量 */
  wrong: number
  /** 未答数量 */
  unanswered: number
  /** 用时（秒） */
  usedTime: number
  /** 试卷名称 */
  paperName: string
  /** 带状态的题目列表 */
  questionsWithStatus: Question[]
  /** 考试历史记录 */
  history?: ExamHistoryRecord[]
}

/**
 * 视图模式类型
 */
export type ViewMode = 'single' | 'overview'

/**
 * 页面类型
 */
export type PageType = 'home' | 'exam' | 'result' | 'practice-exam'

/**
 * 题库数据接口
 */
export interface ExamData {
  /** 试卷列表 */
  papers: Paper[]
  /** 所有题目 */
  questions: Question[]
}