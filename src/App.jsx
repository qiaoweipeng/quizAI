import { useState, useEffect } from 'react'
import './App.css'
import ExamPage from './components/ExamPage'

// ===================== 工具函数 =====================
const EXAM_TIME = 90 * 60 // 90分钟秒数

// 从json文件夹读取所有题目文件
async function loadJsonFiles() {
  try {
    // 在开发环境中，直接从public/json文件夹读取
    const response = await fetch('/json/exam-papers.json')
    if (!response.ok) {
      throw new Error('Failed to load exam data')
    }
    const data = await response.json()
    
    // 如果questions字段为空，从papers中提取题目
    if (!data.questions || data.questions.length === 0) {
      const allQuestions = []
      const questionIds = new Set()
      
      if (data.papers && Array.isArray(data.papers)) {
        for (const paper of data.papers) {
          if (paper.questions && Array.isArray(paper.questions)) {
            for (const question of paper.questions) {
              if (question.id && !questionIds.has(question.id)) {
                allQuestions.push(question)
                questionIds.add(question.id)
              }
            }
          }
        }
      }
      
      data.questions = allQuestions
    }
    
    return data
  } catch (error) {
    console.error('Error loading JSON files:', error)
    return { papers: [], questions: [] }
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function scoreMultiple(userAns, correctAns) {
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

function scoreSingle(userAns, correctAns) {
  if (!userAns || userAns.length === 0) return 0
  return userAns[0] === correctAns[0] ? 0.5 : 0
}

function scoreJudge(userAns, correctAns) {
  if (!userAns || userAns.length === 0) return 0
  return userAns[0] === correctAns[0] ? 0.5 : 0
}

function calcScore(q, userAns) {
  if (q.type === 'multiple') return scoreMultiple(userAns, q.answer)
  if (q.type === 'judge') return scoreJudge(userAns, q.answer)
  return scoreSingle(userAns, q.answer)
}

// ===================== 组件 =====================
export default function App() {
  const [page, setPageState] = useState('home') // home | fixed | random | practice | exam | result
  const [data, setData] = useState({ papers: [], questions: [] })
  const [examState, setExamState] = useState(null)
  const [practiceState, setPracticeState] = useState(null)
  const [loading, setLoading] = useState(true)

  // 自定义setPage，同步更新浏览器历史记录
  const setPage = (newPage) => {
    if (newPage !== page) {
      setPageState(newPage)
      // 添加到浏览器历史记录
      window.history.pushState({ page: newPage }, '', `#${newPage}`)
    }
  }

  // 处理浏览器前进/后退
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.page) {
        setPageState(e.state.page)
      } else {
        // 如果没有state，返回首页
        setPageState('home')
      }
    }

    // 监听popstate事件
    window.addEventListener('popstate', handlePopState)

    // 初始化时检查URL hash
    const hash = window.location.hash.slice(1)
    if (['fixed', 'random', 'practice', 'exam', 'result', 'practice-exam'].includes(hash)) {
      setPageState(hash)
    }

    // 清理函数
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // 组件加载时从json文件夹读取数据
  useEffect(() => {
    const initData = async () => {
      const jsonData = await loadJsonFiles()
      setData(jsonData)
      setLoading(false)
    }
    initData()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        {page !== 'exam' && <h1>🧯 {page === 'home' && '消防理论考试系统'}</h1>}
        <div className="header-stats">
          <span>试卷: {data.papers.length} 份</span>
          <span>总题: {data.questions.length} 道</span>
          {page !== 'home' && (
            <button className="btn-text" onClick={() => setPage('home')}>返回首页</button>
          )}
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading-page">
            <div className="loading-spinner"></div>
            <p>正在加载题库数据...</p>
          </div>
        ) : (
          <>
            {page === 'home' && <HomePage data={data} setPage={setPage} />}
            {page === 'fixed' && <FixedListPage data={data} setPage={setPage} setExamState={setExamState} />}
            {page === 'random' && <RandomSetupPage data={data} setPage={setPage} setExamState={setExamState} />}
            {page === 'practice' && <PracticeSetupPage data={data} setPage={setPage} setPracticeState={setPracticeState} />}
            {page === 'exam' && <ExamPage examState={examState} setPage={setPage} />}
            {page === 'result' && <ResultPage examState={examState} setPage={setPage} />}
            {page === 'practice-exam' && <PracticePage state={practiceState} setPage={setPage} />}
          </>
        )}
      </main>
    </div>
  )
}

// ===================== 首页 =====================
function HomePage({ data, setPage }) {
  return (
    <div className="home-page">
      <div className="mode-sections">
        {/* 考试模式 - 占2/3 */}
        <div className="mode-section exam-mode">
          <div className="section-header">
            <div className="section-icon">📝</div>
            <div className="section-info">
              <h2>考试模式</h2>
              <p>模拟真实考卷｜检验学习成果</p>
            </div>
          </div>
          <div className="exam-options">
            <div className="exam-option" onClick={() => setPage('fixed')}>
              <div className="option-icon">📋</div>
              <div className="option-content">
                <h3>固定考卷</h3>
                <p>固定试卷，90分钟，60分及格</p>
              </div>
            </div>
            <div className="exam-option" onClick={() => setPage('random')}>
              <div className="option-icon">🎲</div>
              <div className="option-content">
                <h3>随机考卷</h3>
                <p>随机抽取200道题，90分钟，60分及格</p>
              </div>
            </div>
          </div>
        </div>

        {/* 练习模式 - 占1/3 */}
        <div className="mode-section practice-mode" onClick={() => setPage('practice')}>
          <div className="section-header">
            <div className="section-icon">✏️</div>
            <div className="section-info">
              <h2>练习模式</h2>
              <p>自由练习，巩固知识</p>
            </div>
          </div>
          <div className="practice-content">
            <p style={{ textAlign: 'left' }}>自选题型<span style={{ color: '#999', fontSize: '0.85em' }}>（单选/多选/判断）</span>和数量</p>
            <p style={{ textAlign: 'left' }}>不计时</p>
            <p style={{ textAlign: 'left' }}>即时查看解析</p>

            <button className="btn-primary" style={{ width: '100%', fontSize: '1em' }}>进入练习</button>
          </div>
        </div>
      </div>

      {data.papers.length === 0 && data.questions.length === 0 && (
        <div className="empty-tip">
          ⚠️ 暂无题库数据，请检查json文件夹中的题目文件
        </div>
      )}
    </div>
  )
}

// ===================== 固定卷列表 =====================
function FixedListPage({ data, setPage, setExamState }) {
  if (data.papers.length === 0) {
    return (
      <div className="empty-page">
        <p>暂无试卷，请检查json文件夹中的题目文件</p>
        <button className="btn-primary" onClick={() => setPage('home')}>返回首页</button>
      </div>
    )
  }

  const start = (paper) => {
    const questions = paper.questions || []
    if (questions.length === 0) { alert('该试卷没有题目'); return }
    setExamState({
      mode: 'fixed',
      paperName: paper.name,
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
    <div className="fixed-list-page">
      <h2>📋 固定卷考试</h2>
      <p className="sub">选择一份试卷开始测试一下你的水平吧！</p>
      <div className="paper-list">
        {data.papers.map(p => (
          <div 
            className="paper-item" 
            key={p.id}
            onClick={() => start(p)}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '2px solid transparent',
              padding: '16px',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '2px solid #1890ff'
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(24, 144, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px solid transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div className="paper-info">
              <h4>{p.name}</h4>
              <span>{(p.questions || []).length} 题</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================== 随机卷设置 =====================
function RandomSetupPage({ data, setPage, setExamState }) {
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
    const questions = shuffleArray([...single, ...multiple, ...judge])

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

// ===================== 专项练习设置 =====================
function PracticeSetupPage({ data, setPage, setPracticeState }) {
  const [type, setType] = useState('single')
  const [count, setCount] = useState(50)

  const start = () => {
    const pool = data.questions.filter(q => q.type === type)
    if (pool.length === 0) { alert('该题型暂无题目'); return }
    const n = Math.min(count, pool.length)
    const questions = shuffleArray(pool).slice(0, n)
    setPracticeState({ questions, current: 0, answers: {}, showParse: {} })
    setPage('practice-exam')
  }

  const available = data.questions.filter(q => q.type === type).length

  return (
    <div className="practice-setup-page">
      <h2>✏️ 专项练习</h2>
      <div className="practice-form">
        <div className="form-row">
          <label>选择题型</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="single">单选题</option>
            <option value="multiple">多选题</option>
            <option value="judge">判断题</option>
          </select>
        </div>
        <div className="form-row">
          <label>题目数量</label>
          <input
            type="number"
            min={1}
            max={available}
            value={count}
            onChange={e => setCount(Math.max(1, Math.min(available, parseInt(e.target.value) || 1)))}
          />
          <span className="form-hint">该题型共 {available} 道可用</span>
        </div>
        <button className="btn-primary btn-large" onClick={start}>开始练习</button>
      </div>
    </div>
  )
}

// ===================== 考试页（固定卷/随机卷共用）=====================
// ===================== 结果页 =====================
function ResultPage({ examState, setPage }) {
  if (!examState) return null
  const { questions, answers, paperName, timeLeft } = examState
  const total = questions.length
  const usedTime = EXAM_TIME - timeLeft

  let rawScore = 0
  let correct = 0, wrong = 0, unanswered = 0
  const details = []

  questions.forEach((q, idx) => {
    const ans = answers[idx]
    const s = calcScore(q, ans)
    rawScore += s
    if (!ans || ans.length === 0) {
      unanswered++
      details.push({ idx, q, ans, score: 0, status: 'unanswered' })
    } else if (s > 0) {
      correct++
      details.push({ idx, q, ans, score: s, status: 'correct' })
    } else {
      wrong++
      details.push({ idx, q, ans, score: s, status: 'wrong' })
    }
  })

  // 转换为百分制：每道题 0.5 分，满分 = 题目数 × 0.5
  const maxScore = questions.length * 0.5
  const rawPercent = maxScore > 0 ? (rawScore / maxScore) * 100 : 0
  // 最低分不低于0分
  const clampedPercent = Math.max(0, rawPercent)
  // 分数显示：整数显示整数，小数显示小数
  const score = clampedPercent % 1 === 0 ? Math.round(clampedPercent) : clampedPercent
  const passed = score >= 60
  const wrongList = details.filter(d => d.status === 'wrong' || d.status === 'unanswered')

  // 错题预览模态框状态
  const [showReviewModal, setShowReviewModal] = useState(false)

  return (
    <div className="result-page">
      <div className="result-card">
        <h2>📊 考试结果</h2>
        <div className="paper-name">{paperName}</div>
        <div className={`score-circle ${passed ? 'pass' : 'fail'}`}>
          <div className="score-num">{Number.isInteger(score) ? score : score.toFixed(1)}</div>
        </div>
        <div className={`pass-badge ${passed ? 'pass' : 'fail'}`}>
          {passed ? '✅ 合格' : '❌ 不合格'}
        </div>

        <div className="result-stats">
          <div className="stat-item">
            <div className="stat-num">{total}</div>
            <div className="stat-label">总题数</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{color:'#00b894'}}>{correct}</div>
            <div className="stat-label">正确</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" style={{color:'#d63031'}}>{wrong}</div>
            <div className="stat-label">错误</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{unanswered}</div>
            <div className="stat-label">未答</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{formatTime(usedTime)}</div>
            <div className="stat-label">用时</div>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn-secondary" onClick={() => setPage('home')}>返回首页</button>
          {wrongList.length > 0 && (
            <button className="btn-primary" onClick={() => setShowReviewModal(true)}>错题预览 ({wrongList.length})</button>
          )}
        </div>
      </div>

      {/* 错题预览模态框 */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 错题预览（共 {wrongList.length} 道）</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {wrongList.map(({ idx, q, ans, status }) => (
                <div className={`review-item ${status}`} key={idx}>
                  <div className="review-header">
                    <span className="review-index">第 {idx + 1} 题</span>
                    <span className={`review-tag ${status}`}>
                      {status === 'wrong' ? '❌ 答错' : '⏳ 未答'}
                    </span>
                  </div>
                  <div className="review-question">{q.question}</div>
                  <div className="review-options">
                    {q.options.map((opt, optIdx) => {
                      const key = opt.charAt(0)
                      const selected = ans?.includes(key)
                      const isCorrect = q.answer.includes(key)
                      let optionClass = ''
                      if (selected && isCorrect) {
                        optionClass = 'selected correct'
                      } else if (selected && !isCorrect) {
                        optionClass = 'selected wrong'
                      } else if (!selected && isCorrect) {
                        optionClass = 'correct'
                      }
                      return (
                        <div key={optIdx} className={`review-option ${optionClass}`}>
                          <span className="option-key">{key}</span>
                          <span className="option-text">{opt}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="review-answer">
                    <span>你的答案：{ans && ans.length ? ans.join(', ') : '未答'}</span>
                    <span>正确答案：{q.answer.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowReviewModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== 专项练习页 =====================
function PracticePage({ state, setPage }) {
  const [s, setS] = useState(state)
  const q = s.questions[s.current]
  const total = s.questions.length
  const isLast = s.current === total - 1

  const selectOption = (key) => {
    const currentAns = s.answers[s.current] || []
    let nextAns
    if (q.type === 'multiple') {
      nextAns = currentAns.includes(key)
        ? currentAns.filter(k => k !== key)
        : [...currentAns, key].sort()
    } else {
      nextAns = [key]
    }
    setS(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.current]: nextAns }
    }))
  }

  const showParse = () => {
    setS(prev => ({ ...prev, showParse: { ...prev.showParse, [prev.current]: true } }))
  }

  const next = () => {
    if (isLast) {
      if (confirm('已经是最后一题，是否结束练习？')) setPage('home')
    } else {
      setS(prev => ({ ...prev, current: prev.current + 1 }))
    }
  }

  const prev = () => {
    if (s.current > 0) setS(prev => ({ ...prev, current: prev.current - 1 }))
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = s.answers[s.current] || []
  const hasParse = s.showParse[s.current]

  return (
    <div className="practice-page">
      <div className="practice-header">
        <span>专项练习 · {typeMap[q.type]} · 第 {s.current + 1} / {total} 题</span>
        <button className="btn-text" onClick={() => { if (confirm('确定退出练习？')) setPage('home') }}>退出</button>
      </div>

      <div className="practice-card">
        <div className="question-text">{q.question}</div>
        <div className="options-list">
          {q.options.map((opt, idx) => {
            const key = opt.charAt(0)
            const selected = currentAns.includes(key)
            let cls = 'option-row'
            if (hasParse) {
              if (q.answer.includes(key)) cls += ' correct'
              else if (selected && !q.answer.includes(key)) cls += ' wrong'
            } else if (selected) {
              cls += ' selected'
            }
            return (
              <div key={idx} className={cls} onClick={() => !hasParse && selectOption(key)}>
                <span className="option-key">{key}</span>
                <span className="option-text">{opt}</span>
              </div>
            )
          })}
        </div>

        {!hasParse && (
          <div className="practice-actions">
            <button className="btn-secondary" onClick={showParse}>查看解析</button>
          </div>
        )}

        {hasParse && (
          <div className="parse-box show">
            <div className="parse-title">📖 解析</div>
            <div className="parse-text">{q.parse || '暂无解析'}</div>
            <div className="parse-answer">
              正确答案：{q.answer.join(', ')} · 你的答案：{currentAns.length ? currentAns.join(', ') : '未选'}
            </div>
          </div>
        )}

        <div className="exam-nav">
          <button disabled={s.current === 0} onClick={prev}>上一题</button>
          <button onClick={next}>{isLast ? '结束练习' : '下一题'}</button>
        </div>
      </div>
    </div>
  )
}
