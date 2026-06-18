/**
 * 考试状态管理 Store
 * 
 * 使用 Zustand 创建的全局状态管理，用于管理考试相关的所有状态。
 * 
 * 主要功能：
 * - 视图模式切换（单题模式/全览模式）
 * - 侧边栏显示/隐藏控制
 * - 解析显示/隐藏切换
 * - 只看错题模式切换
 * - 考试结果弹窗控制
 * - 考试历史记录管理
 * - 考试状态（examState）管理
 * - 练习状态（practiceState）管理
 * - 当前页面管理
 * 
 * 使用方式：
 * ```tsx
 * import useExamStore from '../store/examStore'
 * 
 * // 获取状态
 * const { examState, showParse, showWrongOnly } = useExamStore()
 * 
 * // 使用 action
 * const { setExamState, toggleShowParse, setShowResultModal } = useExamStore()
 * ```
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  ExamState, 
  PracticeState, 
  ExamResult, 
  ExamHistoryRecord, 
  ViewMode,
  PageType,
  ExamData
} from '../types'

/**
 * 考试状态管理接口
 * 
 * 定义了所有状态字段和操作方法。
 */
interface ExamStore {
  // ===== 页面状态 =====

  /** 当前页面 */
  currentPage: PageType

  /** 设置当前页面 */
  setCurrentPage: (page: PageType) => void

  /** 是否正在加载 */
  loading: boolean

  /** 设置加载状态 */
  setLoading: (loading: boolean) => void

  /** 是否全屏 */
  isFullscreen: boolean

  /** 设置全屏状态 */
  setIsFullscreen: (fullscreen: boolean) => void

  // ===== 题库数据 =====

  /** 题库数据 */
  examData: ExamData

  /** 设置题库数据 */
  setExamData: (data: ExamData) => void

  // ===== 考试状态 =====

  /** 考试状态（题目、答案、时间等） */
  examState: ExamState | null

  /** 设置考试状态 */
  setExamState: (state: ExamState | null) => void

  /** 更新考试状态（局部更新） */
  updateExamState: (updates: Partial<ExamState> | ((prev: ExamState) => ExamState)) => void

  // ===== 练习状态 =====

  /** 练习模式状态 */
  practiceState: PracticeState | null

  /** 设置练习状态 */
  setPracticeState: (state: PracticeState | null) => void

  // ===== 视图状态 =====

  /**
   * 视图模式
   * - 'single': 单题模式，一次只显示一道题
   * - 'overview': 全览模式，显示所有题目列表
   */
  viewMode: ViewMode

  /** 是否显示考试结果弹窗 */
  showResultModal: boolean

  /** 考试结果数据，考试结束后填充 */
  examResult: ExamResult | null

  /** 侧边栏是否隐藏 */
  sidebarHidden: boolean

  /** 是否显示解析 */
  showParse: boolean

  /** 是否只看错题 */
  showWrongOnly: boolean

  /** 考试历史记录列表 */
  examHistory: ExamHistoryRecord[]

  // ===== 错题本 =====

  /** 错题本（存储错题ID） */
  wrongBook: string[]

  /** 添加错题到错题本 */
  addToWrongBook: (questionId: string) => void

  /** 从错题本移除错题 */
  removeFromWrongBook: (questionId: string) => void

  /** 清空错题本 */
  clearWrongBook: () => void

  // ===== 操作方法 =====

  /**
   * 设置视图模式
   * @param mode - 目标视图模式
   */
  setViewMode: (mode: ViewMode) => void

  /** 切换解析显示状态（显示↔隐藏） */
  toggleShowParse: () => void

  /**
   * 设置解析显示状态
   * @param value - 是否显示解析
   */
  setShowParse: (value: boolean) => void

  /** 切换只看错题模式（全部题目↔只看错题） */
  toggleShowWrongOnly: () => void

  /**
   * 设置只看错题模式
   * @param value - 是否只看错题
   */
  setShowWrongOnly: (value: boolean) => void

  /**
   * 设置侧边栏显示状态
   * @param hidden - 是否隐藏侧边栏
   */
  setSidebarHidden: (hidden: boolean) => void

  /** 切换侧边栏显示状态（显示↔隐藏） */
  toggleSidebar: () => void

  /**
   * 设置考试结果弹窗显示状态
   * @param visible - 是否显示弹窗
   */
  setShowResultModal: (visible: boolean) => void

  /**
   * 设置考试结果
   * @param result - 考试结果数据
   */
  setExamResult: (result: ExamResult | null) => void

  /**
   * 设置考试历史记录
   * @param history - 历史记录列表
   */
  setExamHistory: (history: ExamHistoryRecord[]) => void

  /**
   * 添加一条考试历史记录
   * @param record - 历史记录
   */
  addExamHistory: (record: ExamHistoryRecord) => void

  /** 重置所有考试状态（用于重新开始考试） */
  resetExamState: () => void

  /** 重置所有状态（返回首页时使用） */
  resetAllState: () => void
}

/**
 * 创建考试状态管理 Store
 * 
 * 使用 Zustand 的 create 方法创建，提供完整的状态管理能力。
 * 使用 persist 中间件自动持久化到 localStorage。
 */
const useExamStore = create<ExamStore>()(
  persist(
    (set) => ({
      // ===== 页面状态 =====
      currentPage: 'home',
      setCurrentPage: (page) => set({ currentPage: page }),
      loading: true,
      setLoading: (loading) => set({ loading }),
      isFullscreen: false,
      setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

      // ===== 题库数据 =====
      examData: { papers: [], questions: [] },
      setExamData: (data) => set({ examData: data }),

      // ===== 考试状态 =====
      examState: null,
      setExamState: (state) => {
        if (state) {
          set({ examState: state })
        } else {
          set({ examState: null })
        }
      },
      updateExamState: (updates) => set((prev) => ({
        examState: prev.examState 
          ? typeof updates === 'function' 
            ? updates(prev.examState) 
            : { ...prev.examState, ...updates }
          : null
      })),

      // ===== 练习状态 =====
      practiceState: null,
      setPracticeState: (state) => set({ practiceState: state }),

      // ===== 视图状态 =====
      viewMode: 'single',
      showResultModal: false,
      examResult: null,
      sidebarHidden: false,
      showParse: true,
      showWrongOnly: false,
      examHistory: [],
      wrongBook: [],

      // ===== 操作方法 =====
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleShowParse: () => set((state) => ({ showParse: !state.showParse })),
      setShowParse: (value) => set({ showParse: value }),
      toggleShowWrongOnly: () => set((state) => ({ showWrongOnly: !state.showWrongOnly })),
      setShowWrongOnly: (value) => set({ showWrongOnly: value }),
      setSidebarHidden: (hidden) => set({ sidebarHidden: hidden }),
      toggleSidebar: () => set((state) => ({ sidebarHidden: !state.sidebarHidden })),
      setShowResultModal: (visible) => set({ showResultModal: visible }),
      setExamResult: (result) => set({ examResult: result }),
      setExamHistory: (history) => set({ examHistory: history }),
      addExamHistory: (record) => set((state) => ({
        examHistory: [...state.examHistory, record]
      })),
      addToWrongBook: (questionId) => set((state) => ({
        wrongBook: state.wrongBook.includes(questionId) 
          ? state.wrongBook 
          : [...state.wrongBook, questionId]
      })),
      removeFromWrongBook: (questionId) => set((state) => ({
        wrongBook: state.wrongBook.filter(id => id !== questionId)
      })),
      clearWrongBook: () => set({ wrongBook: [] }),
      resetExamState: () => set({
        viewMode: 'single',
        showResultModal: false,
        examResult: null,
        sidebarHidden: false,
        showParse: true,
        showWrongOnly: false,
        examHistory: []
      }),
      resetAllState: () => set({
        currentPage: 'home',
        examState: null,
        practiceState: null,
        viewMode: 'single',
        showResultModal: false,
        examResult: null,
        sidebarHidden: false,
        showParse: true,
        showWrongOnly: false,
        examHistory: []
      })
    }),
    {
      name: 'exam-store',
      partialize: (state) => ({
        examState: state.examState,
        examHistory: state.examHistory,
        wrongBook: state.wrongBook
      })
    }
  )
)

export default useExamStore