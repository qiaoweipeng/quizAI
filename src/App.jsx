import { useEffect } from 'react'
import { ConfigProvider, Button } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import './App.css'
import ExamPage from './components/exam/ExamPage'
import HomePage from './components/home/HomePage'
import ResultPage from './components/result/ResultPage'
import PracticePage from './components/practice/PracticePage'
import { loadJsonFiles, loadExamState } from './utils/examUtils'
import useExamStore from './store/examStore'

export default function App() {
  const {
    currentPage,
    setCurrentPage,
    examData,
    setExamData,
    examState,
    setExamState,
    practiceState,
    setPracticeState,
    resetAllState,
    loading,
    setLoading,
    isFullscreen,
    setIsFullscreen
  } = useExamStore()

  useEffect(() => {
    const saved = loadExamState()
    if (saved) {
      setExamState(saved)
      setCurrentPage('exam')
    }
  }, [])

  const setPage = (newPage) => {
    if (newPage !== currentPage) {
      setCurrentPage(newPage)
      if (newPage === 'home') {
        resetAllState()
      }
      window.history.pushState({ page: newPage }, '', `#${newPage}`)
    }
  }

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.page) {
        setCurrentPage(e.state.page)
      } else {
        setCurrentPage('home')
      }
    }

    window.addEventListener('popstate', handlePopState)

    const hash = window.location.hash.slice(1)
    if (['exam', 'result', 'practice-exam'].includes(hash)) {
      setCurrentPage(hash)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    const initData = async () => {
      const jsonData = await loadJsonFiles()
      setExamData(jsonData)
      setLoading(false)
    }
    initData()
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('全屏失败:', err))
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('退出全屏失败:', err))
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <ConfigProvider>
      <div className="app">
        <header className="app-header">
          {currentPage !== 'exam' && <h1>🧯 {currentPage === 'home' && '消防理论考试系统'}</h1>}
          <div className="header-right">
            <div className="header-stats">
              <span>试卷: {examData.papers.length} 份</span>
              <span>总题: {examData.questions.length} 道</span>
            </div>
            <div className="header-actions">
              {currentPage !== 'home' && (
                <Button className="btn-link" onClick={() => setPage('home')}>返回首页</Button>
              )}
              <Button 
                className="btn-link"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </div>
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
              {currentPage === 'home' && <HomePage data={examData} setPage={setPage} setExamState={setExamState} setPracticeState={setPracticeState} />}
              {currentPage === 'exam' && <ExamPage key={examState?.paperName || Date.now()} />}
              {currentPage === 'result' && <ResultPage examState={examState} setPage={setPage} />}
              {currentPage === 'practice-exam' && <PracticePage state={practiceState} setPage={setPage} />}
            </>
          )}
        </main>
      </div>
    </ConfigProvider>
  )
}