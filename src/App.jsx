import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// ===================== 工具函数 =====================
const STORAGE_KEY = 'fire_exam_data'
const EXAM_TIME = 90 * 60 // 90分钟秒数

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { papers: [], questions: [] }
  } catch { return { papers: [], questions: [] } }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
  // 全对
  if (userSet.size === correctSet.size && [...userSet].every(x => correctSet.has(x))) return 0.5
  // 错选：只要有一个选项选错了
  for (const u of userSet) {
    if (!correctSet.has(u)) return -0.5
  }
  // 漏选：选的都是对的，但没选全
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
  const [page, setPage] = useState('home') // home | import | fixed | random | practice | exam | result
  const [data, setData] = useState(loadData())
  const [examState, setExamState] = useState(null)
  const [practiceState, setPracticeState] = useState(null)

  // 刷新数据
  const refreshData = () => setData(loadData())

  // 清空数据
  const clearData = () => {
    if (confirm('确定清空所有导入的题库数据？')) {
      localStorage.removeItem(STORAGE_KEY)
      setData({ papers: [], questions: [] })
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧯 消防理论考试系统</h1>
        <div className="header-stats">
          <span>试卷: {data.papers.length} 份</span>
          <span>总题: {data.questions.length} 道</span>
          {page !== 'home' && (
            <button className="btn-text" onClick={() => setPage('home')}>返回首页</button>
          )}
        </div>
      </header>

      <main className="app-main">
        {page === 'home' && <HomePage data={data} setPage={setPage} clearData={clearData} />}
        {page === 'import' && <ImportPage setPage={setPage} refreshData={refreshData} />}
        {page === 'fixed' && <FixedListPage data={data} setPage={setPage} setExamState={setExamState} />}
        {page === 'random' && <RandomSetupPage data={data} setPage={setPage} setExamState={setExamState} />}
        {page === 'practice' && <PracticeSetupPage data={data} setPage={setPage} setPracticeState={setPracticeState} />}
        {page === 'exam' && <ExamPage examState={examState} setPage={setPage} setExamState={setExamState} />}
        {page === 'result' && <ResultPage examState={examState} setPage={setPage} data={data} />}
        {page === 'practice-exam' && <PracticePage state={practiceState} setPage={setPage} />}
      </main>
    </div>
  )
}

// ===================== 首页 =====================
function HomePage({ data, setPage, clearData }) {
  return (
    <div className="home-page">
      <div className="mode-cards">
        <div className="mode-card" onClick={() => setPage('fixed')}>
          <div className="mode-icon">📋</div>
          <h3>固定卷考试</h3>
          <p>选择已导入的试卷（卷1~卷N），题目固定，90分钟计时，60分及格</p>
          <button className="btn-primary">进入</button>
        </div>
        <div className="mode-card" onClick={() => setPage('random')}>
          <div className="mode-icon">🎲</div>
          <h3>随机卷考试</h3>
          <p>从总题库随机抽取：100单选+40多选+60判断，90分钟计时</p>
          <button className="btn-primary">进入</button>
        </div>
        <div className="mode-card" onClick={() => setPage('practice')}>
          <div className="mode-icon">✏️</div>
          <h3>专项练习</h3>
          <p>自选题型（单选/多选/判断）和数量，不计时，不评分，即时看解析</p>
          <button className="btn-primary">进入</button>
        </div>
      </div>

      <div className="home-actions">
        <button className="btn-secondary" onClick={() => setPage('import')}>📥 导入题库</button>
        <button className="btn-danger" onClick={clearData}>🗑️ 清空数据</button>
      </div>

      {data.papers.length === 0 && data.questions.length === 0 && (
        <div className="empty-tip">
          ⚠️ 暂无题库数据，请先点击「导入题库」添加试卷
        </div>
      )}
    </div>
  )
}

// ===================== 导入页 =====================
function ImportPage({ setPage, refreshData }) {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')

  const handleImport = () => {
    if (!text.trim()) { setMsg('请输入JSON内容'); return }
    try {
      const json = JSON.parse(text)
      const existing = loadData()
      let addedPapers = 0, addedQuestions = 0

      if (json.papers && Array.isArray(json.papers)) {
        for (const p of json.papers) {
          if (!existing.papers.find(ep => ep.id === p.id)) {
            existing.papers.push(p)
            addedPapers++
            if (p.questions) {
              for (const q of p.questions) {
                if (!existing.questions.find(eq => eq.id === q.id)) {
                  existing.questions.push(q)
                  addedQuestions++
                }
              }
            }
          }
        }
      }
      if (json.questions && Array.isArray(json.questions)) {
        for (const q of json.questions) {
          if (!existing.questions.find(eq => eq.id === q.id)) {
            existing.questions.push(q)
            addedQuestions++
          }
        }
      }

      saveData(existing)
      refreshData()
      setMsg(`✅ 导入成功！新增 ${addedPapers} 份试卷，${addedQuestions} 道题目`)
      setText('')
    } catch (e) {
      setMsg('❌ JSON解析失败: ' + e.message)
    }
  }

  const loadExample = () => {
    setText(JSON.stringify({
      papers: [
        {
          id: "1", name: "卷1",
          questions: [
            { id: "1-1", type: "single", question: "火灾报警控制器处于手动状态时，收到火警信号后会自动联动启动消防泵吗？", options: ["A. 会", "B. 不会", "C. 有时可以", "D. 取决于设置"], answer: ["B"], parse: "手动状态下，控制器不会自动联动启动消防泵，需要人工确认后手动启动。" },
            { id: "1-2", type: "multiple", question: "湿式报警阀组的组成部件包括哪些？", options: ["A. 湿式报警阀", "B. 水力警铃", "C. 压力开关", "D. 延迟器"], answer: ["A", "B", "C", "D"], parse: "湿式报警阀组由湿式报警阀、水力警铃、压力开关、延迟器、压力表、泄水阀等组成。" },
            { id: "1-3", type: "judge", question: "末端试水装置的压力表读数正常范围一般在0.4~0.6MPa之间。", options: ["正确", "错误"], answer: ["正确"], parse: "末端试水装置的压力表正常读数通常在0.4~0.6MPa范围内，反映系统侧管网压力。" },
            { id: "1-4", type: "single", question: "火灾报警控制器发出119报警声，对应的是哪种信号？", options: ["A. 故障", "B. 监管", "C. 火警", "D. 屏蔽"], answer: ["C"], parse: "火警信号发出119消防车声音，故障为120救护车声，监管为110警车声，屏蔽无声。" },
            { id: "1-5", type: "judge", question: "喷淋泵控制柜当前在手动状态属于正常工作状态。", options: ["正确", "错误"], answer: ["错误"], parse: "喷淋泵控制柜应处于自动状态，手动状态属于异常，需切回自动。" }
          ]
        }
      ]
    }, null, 2))
  }

  return (
    <div className="import-page">
      <h2>📥 导入题库</h2>
      <div className="import-grid">
        <div className="import-left">
          <textarea
            className="import-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="粘贴JSON内容..."
          />
          <div className="import-btns">
            <button className="btn-secondary" onClick={loadExample}>填入示例</button>
            <button className="btn-primary" onClick={handleImport}>导入</button>
          </div>
          {msg && <div className={msg.startsWith('✅') ? 'msg-success' : 'msg-error'}>{msg}</div>}
        </div>
        <div className="import-right">
          <h4>📋 JSON格式说明</h4>
          <pre>{`{
  "papers": [
    {
      "id": "1",
      "name": "卷1",
      "questions": [
        {
          "id": "1-1",
          "type": "single",
          "question": "题目内容",
          "options": ["A. 选项1", "B. 选项2"],
          "answer": ["A"],
          "parse": "解析"
        }
      ]
    }
  ],
  "questions": [
    // 也可以直接放题目，不区分试卷
  ]
}`}</pre>
          <p className="tip">
            <b>type</b>：single=单选, multiple=多选, judge=判断<br/>
            <b>answer</b>：必须是数组，如 ["A"] 或 ["A","B"]<br/>
            <b>options</b>：判断题建议用 ["正确","错误"]<br/>
            支持多次导入追加，重复id会自动跳过。
          </p>
        </div>
      </div>
    </div>
  )
}

// ===================== 固定卷列表 =====================
function FixedListPage({ data, setPage, setExamState }) {
  if (data.papers.length === 0) {
    return (
      <div className="empty-page">
        <p>暂无试卷，请先导入题库</p>
        <button className="btn-primary" onClick={() => setPage('import')}>去导入</button>
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
      startTime: Date.now()
    })
    setPage('exam')
  }

  return (
    <div className="fixed-list-page">
      <h2>📋 固定卷考试</h2>
      <p className="sub">选择一份试卷开始考试，题目固定，90分钟，60分及格</p>
      <div className="paper-list">
        {data.papers.map(p => (
          <div className="paper-item" key={p.id}>
            <div className="paper-info">
              <h4>{p.name}</h4>
              <span>{(p.questions || []).length} 题</span>
            </div>
            <button className="btn-primary" onClick={() => start(p)}>开始考试</button>
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
        <button className="btn-primary" onClick={() => setPage('import')}>去导入</button>
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
      startTime: Date.now()
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

  const typeLabel = { single: '单选题', multiple: '多选题', judge: '判断题' }
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
function ExamPage({ examState, setPage, setExamState }) {
  const [state, setState] = useState(examState)
  const timerRef = useRef(null)

  // 计时器
  useEffect(() => {
    if (state.finished) return
    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current)
          return { ...prev, timeLeft: 0, finished: true }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [state.finished])

  // 自动交卷
  useEffect(() => {
    if (state.finished) {
      clearInterval(timerRef.current)
      setExamState(state)
      setPage('result')
    }
  }, [state.finished])

  const q = state.questions[state.current]
  const total = state.questions.length
  const answered = Object.keys(state.answers).length
  const isLast = state.current === total - 1

  const selectOption = (key) => {
    if (state.finished) return
    const currentAns = state.answers[state.current] || []
    let nextAns
    if (q.type === 'multiple') {
      nextAns = currentAns.includes(key)
        ? currentAns.filter(k => k !== key)
        : [...currentAns, key].sort()
    } else {
      nextAns = [key]
    }
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.current]: nextAns }
    }))
  }

  const toggleMark = () => {
    setState(prev => ({
      ...prev,
      marked: { ...prev.marked, [prev.current]: !prev.marked[prev.current] }
    }))
  }

  const submitExam = () => {
    if (!confirm('确定交卷？')) return
    setState(prev => ({ ...prev, finished: true }))
  }

  const goQuestion = (idx) => {
    setState(prev => ({ ...prev, current: idx }))
  }

  const typeMap = { single: '单选', multiple: '多选', judge: '判断' }
  const currentAns = state.answers[state.current] || []

  return (
    <div className="exam-page">
      <div className="exam-sidebar">
        <div className="timer-box">
          <div className={state.timeLeft < 600 ? 'timer-danger' : 'timer-normal'}>
            ⏱️ {formatTime(state.timeLeft)}
          </div>
        </div>
        <div className="paper-name">{state.paperName}</div>
        <div className="answer-stats">
          <span>已答 {answered} / {total}</span>
          <span>未答 {total - answered}</span>
        </div>
        <div className="qnum-grid">
          {state.questions.map((qq, idx) => {
            const hasAns = !!state.answers[idx]
            const isMarked = !!state.marked[idx]
            const isCurrent = idx === state.current
            return (
              <button
                key={idx}
                className={`qnum-btn ${isCurrent ? 'current' : ''} ${hasAns ? 'answered' : ''} ${isMarked ? 'marked' : ''}`}
                onClick={() => goQuestion(idx)}
                title={`${typeMap[qq.type]} · ${qq.question.substring(0, 20)}...`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
        <button className="btn-submit-exam" onClick={submitExam}>交卷</button>
      </div>

      <div className="exam-main">
        <div className="exam-card">
          <div className="exam-header">
            <span className="q-index">第 {state.current + 1} / {total} 题</span>
            <span className={`q-type-badge type-${q.type}`}>{typeMap[q.type]}</span>
            <button className="mark-btn" onClick={toggleMark}>
              {state.marked[state.current] ? '⭐ 已标记' : '☆ 标记'}
            </button>
          </div>

          <div className="question-text">{q.question}</div>

          <div className="options-list">
            {q.options.map((opt, idx) => {
              const key = opt.charAt(0)
              const selected = currentAns.includes(key)
              return (
                <div
                  key={idx}
                  className={`option-row ${selected ? 'selected' : ''}`}
                  onClick={() => selectOption(key)}
                >
                  <span className="option-key">{key}</span>
                  <span className="option-text">{opt}</span>
                </div>
              )
            })}
          </div>

          <div className="exam-nav">
            <button disabled={state.current === 0} onClick={() => goQuestion(state.current - 1)}>上一题</button>
            <button disabled={isLast} onClick={() => goQuestion(state.current + 1)}>下一题</button>
            {isLast && <button className="btn-primary" onClick={submitExam}>交卷</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== 结果页 =====================
function ResultPage({ examState, setPage, data }) {
  if (!examState) return null
  const { questions, answers, paperName, timeLeft } = examState
  const total = questions.length
  const usedTime = EXAM_TIME - timeLeft

  let score = 0
  let correct = 0, wrong = 0, unanswered = 0
  const details = []

  questions.forEach((q, idx) => {
    const ans = answers[idx]
    const s = calcScore(q, ans)
    score += s
    if (!ans || ans.length === 0) {
      unanswered++
      details.push({ idx, q, ans, score: 0, status: 'unanswered' })
    } else if (s > 0) {
      correct++
      details.push({ idx, q, ans, score: s, status: 'correct' })
    } else if (s < 0) {
      wrong++
      details.push({ idx, q, ans, score: s, status: 'wrong' })
    } else {
      details.push({ idx, q, ans, score: 0, status: 'partial' })
    }
  })

  const passed = score >= 60
  const wrongList = details.filter(d => d.status === 'wrong' || d.status === 'partial' || d.status === 'unanswered')

  return (
    <div className="result-page">
      <div className="result-card">
        <h2>📊 考试结果</h2>
        <div className="paper-name">{paperName}</div>
        <div className={`score-circle ${passed ? 'pass' : 'fail'}`}>
          <div className="score-num">{score.toFixed(1)}</div>
          <div className="score-label">分 / 100分</div>
        </div>
        <div className={`pass-badge ${passed ? 'pass' : 'fail'}`}>
          {passed ? '✅ 及格' : '❌ 不及格'}
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
            <div className="stat-label">错误/扣分</div>
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
          <button className="btn-primary" onClick={() => {
            // 用错题重考
            const wrongQs = wrongList.map(d => d.q)
            if (wrongQs.length === 0) { alert('没有错题！'); return }
            setExamState({
              mode: 'fixed',
              paperName: paperName + '（错题重练）',
              questions: wrongQs,
              answers: {},
              marked: {},
              current: 0,
              timeLeft: EXAM_TIME,
              finished: false,
              startTime: Date.now()
            })
            setPage('exam')
          }}>错题重练</button>
        </div>
      </div>

      <div className="wrong-list-card">
        <h3>📝 错题回顾（共 {wrongList.length} 道）</h3>
        {wrongList.length === 0 ? (
          <p className="empty-wrong">🎉 全对！没有错题</p>
        ) : (
          <div className="wrong-list">
            {wrongList.map(({ idx, q, ans, score: s, status }) => (
              <div className={`wrong-item ${status}`} key={idx}>
                <div className="wrong-header">
                  <span>第 {idx + 1} 题</span>
                  <span className={`wrong-tag ${status}`}>
                    {status === 'wrong' ? '错选扣分' : status === 'partial' ? '漏选' : '未作答'}
                  </span>
                  <span className="wrong-score">{s > 0 ? '+' : ''}{s.toFixed(1)} 分</span>
                </div>
                <div className="wrong-question">{q.question}</div>
                <div className="wrong-answer">
                  <span>你的答案：{ans && ans.length ? ans.join(', ') : '未答'}</span>
                  <span>正确答案：{q.answer.join(', ')}</span>
                </div>
                {q.parse && <div className="wrong-parse">📖 {q.parse}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
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
