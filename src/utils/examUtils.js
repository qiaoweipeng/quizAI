/**
 * 考试系统工具函数模块
 * 
 * 包含：
 * - 常量定义（如考试时间）
 * - JSON文件加载函数
 * - 时间格式化函数
 * - 数组操作函数
 * - 计分函数
 */

// ===================== 常量 =====================
export const EXAM_TIME = 90 * 60 // 90分钟秒数
export const STORAGE_KEY = 'exam_state'

// ===================== 工具函数 =====================

/**
 * 从json文件夹读取所有题目文件
 * 支持多试卷模式（通过paper-index.json索引）和单文件模式（向后兼容）
 * 
 * @returns {Object} { papers: 试卷数组, questions: 所有题目数组 }
 */
export async function loadJsonFiles() {
  try {
    // 首先读取试卷索引文件
    const indexResponse = await fetch('/json/paper-index.json')
    if (!indexResponse.ok) {
      throw new Error('Failed to load paper index')
    }
    const indexData = await indexResponse.json()
    
    const papers = []
    const allQuestions = []
    const questionIds = new Set()
    
    // 如果有试卷索引，逐个加载试卷文件
    if (indexData.papers && Array.isArray(indexData.papers)) {
      for (const paperMeta of indexData.papers) {
        if (paperMeta.file) {
          try {
            const paperResponse = await fetch(`/json/${paperMeta.file}`)
            if (paperResponse.ok) {
              const paperData = await paperResponse.json()
              // 合并元数据和题目数据
              const paper = {
                ...paperMeta,
                questions: paperData.questions || []
              }
              papers.push(paper)
              
              // 收集题目到总题库
              for (const question of paper.questions) {
                if (question.id && !questionIds.has(question.id)) {
                  allQuestions.push(question)
                  questionIds.add(question.id)
                }
              }
            } else {
              console.warn(`Failed to load paper file: ${paperMeta.file}`)
            }
          } catch (e) {
            console.warn(`Error loading paper file ${paperMeta.file}:`, e)
          }
        }
      }
    }
    
    return { papers, questions: allQuestions }
  } catch (error) {
    console.error('Error loading JSON files:', error)
    return { papers: [], questions: [] }
  }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatFullTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 清除 localStorage 中的考试状态
export function clearExamState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear exam state:', e)
  }
}

export function scoreMultiple(userAns, correctAns) {
  if (!userAns || userAns.length === 0) return 0
  const userSet = new Set(userAns)
  const correctSet = new Set(correctAns)
  // 全对：选的数量和正确答案一样，且都是对的
  if (userSet.size === correctSet.size && [...userSet].every(x => correctSet.has(x))) return 0.5
  // 错选：只要有一个选项选错了，得0分
  for (const u of userSet) {
    if (!correctSet.has(u)) return 0
  }
  // 漏选：选的都是对的，但没选全，得0分
  return 0
}

export function scoreSingle(userAns, correctAns) {
  if (!userAns || userAns.length === 0) return 0
  return userAns[0] === correctAns[0] ? 0.5 : 0
}

export function scoreJudge(userAns, correctAns) {
  if (!userAns || userAns.length === 0) return 0
  return userAns[0] === correctAns[0] ? 0.5 : 0
}

export function calcScore(q, userAns) {
  if (q.type === 'multiple') return scoreMultiple(userAns, q.answer)
  if (q.type === 'judge') return scoreJudge(userAns, q.answer)
  return scoreSingle(userAns, q.answer)
}