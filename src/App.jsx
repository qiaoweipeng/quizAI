import { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import './App.css'
import ExamPage from './components/ExamPage'
import HomePage from './components/HomePage'
import ResultPage from './components/ResultPage'
import PracticePage from './components/PracticePage'
import { loadJsonFiles } from './utils/examUtils'

export default function App() {
  const [page, setPageState] = useState('home') // home | exam | result | practice-exam
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
    if (['exam', 'result', 'practice-exam'].includes(hash)) {
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
    <ConfigProvider>
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
              {page === 'home' && <HomePage data={data} setPage={setPage} setExamState={setExamState} setPracticeState={setPracticeState} />}
              {page === 'exam' && <ExamPage examState={examState} setPage={setPage} />}
              {page === 'result' && <ResultPage examState={examState} setPage={setPage} />}
              {page === 'practice-exam' && <PracticePage state={practiceState} setPage={setPage} />}
            </>
          )}
        </main>
      </div>
    </ConfigProvider>
  )
}