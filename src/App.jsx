import { useEffect, useState } from 'react'
import { ConfigProvider, Button, Layout, Modal, Drawer, Table, Space, Badge, Popconfirm, App, Tooltip, Tag } from 'antd'
import { theme } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined, RobotOutlined, FileExcelOutlined, DeleteOutlined, QuestionCircleOutlined, MoonOutlined, SunOutlined, DownloadOutlined } from '@ant-design/icons'
import './App.css'

const { Header, Content, Footer } = Layout
import ExamPage from './components/exam/ExamPage'
import HomePage from './components/home/HomePage'
import QuestionOption from './components/exam/QuestionOption'
import ResultPage from './components/result/ResultPage'
import PracticePage from './components/practice/PracticePage'
import { loadJsonFiles, loadExamState } from './utils/examUtils'
import useExamStore from './store/examStore'
import { pwaUpdate } from './main.jsx'

function WrongBookDrawer({ 
  showWrongBookModal, 
  setShowWrongBookModal, 
  wrongBook, 
  removeFromWrongBook, 
  clearWrongBook, 
  examData, 
  setSelectedQuestion, 
  setShowQuestionDetail 
}) {
  const { message } = App.useApp()

  return (
    <Drawer
      title={<><FileExcelOutlined style={{ marginRight: 8, color: '#1890ff', fontSize: 20 }} /><span>我的错题本</span></>}
      open={showWrongBookModal}
      onClose={() => setShowWrongBookModal(false)}
      footer={
        <Space>
          <Popconfirm
            title="确认清空错题本？"
            description="清空后所有错题将被移除，此操作不可恢复。"
            onConfirm={() => {
              clearWrongBook()
              message.success('错题本已清空')
            }}
            okText="确认"
            cancelText="取消"
          >
            <Button danger>一键清空错题本</Button>
          </Popconfirm>
        </Space>
      }
      width={800}
      placement="right"
    >
      <Table
        dataSource={wrongBook.map((id, index) => {
          const question = examData.questions.find(q => q.id === id)
          return {
            key: id,
            id,
            index: index + 1,
            content: question?.question || '未知题目',
            type: question?.type
          }
        })}
        columns={[
          { title: '编号', dataIndex: 'index', key: 'index', width: 60 },
          { 
            title: '题目类型', 
            dataIndex: 'type', 
            key: 'type', 
            width: 100,
            render: (type) => {
              const typeMap = {
                single: { label: '单选题', className: 'type-single' },
                multiple: { label: '多选题', className: 'type-multiple' },
                judge: { label: '判断题', className: 'type-judge' }
              }
              const { label, className } = typeMap[type] || { label: '未知', className: '' }
              return <Tag className={className}>{label}</Tag>
            }
          },
          { title: '题目内容', dataIndex: 'content', key: 'content', ellipsis: true },
          { 
            title: '操作', 
            key: 'action', 
            width: 100,
            render: (_, record) => (
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={(e) => {
                  e.stopPropagation()
                  removeFromWrongBook(record.id)
                  message.success('已从错题本移除')
                }}
              >移除</Button>
            )
          }
        ]}
        pagination={false}
        locale={{ emptyText: '错题本为空' }}
        onRow={(record) => ({
          onClick: () => {
            const question = examData.questions.find(q => q.id === record.id)
            if (question) {
              setSelectedQuestion(question)
              setShowQuestionDetail(true)
            }
          }
        })}
      />
    </Drawer>
  )
}

export default function RootApp() {
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
    setIsFullscreen,
    darkMode,
    toggleDarkMode,
    wrongBook,
    removeFromWrongBook,
    clearWrongBook
  } = useExamStore()

  const [showWrongBookModal, setShowWrongBookModal] = useState(false)
  const [showQuestionDetail, setShowQuestionDetail] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [promptInstall, setPromptInstall] = useState(null)
  const [isPwaInstalled, setIsPwaInstalled] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

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
    if (['exam', 'result', 'practice-exam', 'home'].includes(hash)) {
      setCurrentPage(hash)
    } else {
      setCurrentPage('home')
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    const initData = async () => {
      try {
        const jsonData = await loadJsonFiles()
        console.log('Loaded data:', jsonData)
        setExamData(jsonData)
        setDataLoading(false)
        console.log('Data loading set to false')
      } catch (error) {
        console.error('Data load error:', error)
        setDataLoading(false)
      }
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

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setPromptInstall(e)
    }

    const handleAppInstalled = () => {
      setPromptInstall(null)
      setIsPwaInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      pwaUpdate?.()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleInstallPWA = async () => {
    if (promptInstall) {
      promptInstall.prompt()
      const { outcome } = await promptInstall.userChoice
      if (outcome === 'accepted') {
        setIsPwaInstalled(true)
        setPromptInstall(null)
      }
    }
  }

  const handleRefreshAndUpdate = () => {
    pwaUpdate?.refresh(true)
    setShowUpdateModal(false)
    window.location.reload()
  }

  return (
    <ConfigProvider
        theme={{
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
      <App>
      <Layout className="app">
        <Header className="app-header">
          <div className="header-logo" onClick={() => setPage('home')}>
            <RobotOutlined className="logo-icon" />
            {currentPage === 'home' && <span className="logo-text">智能刷题系统</span>}
          </div>
          <div className="header-right">
            <div className="header-actions">
              <Button 
                className="btn-icon"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
              <Button 
                className="btn-icon"
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleDarkMode}
              />
              <Button 
                className="btn-icon"
                icon={
                  <Badge count={wrongBook.length > 0 ? wrongBook.length : 0} showZero={false} size="small">
                    <FileExcelOutlined />
                  </Badge>
                }
                onClick={() => setShowWrongBookModal(true)}
              />
              {promptInstall && !isPwaInstalled && (
                <Tooltip title="安装应用">
                  <Button 
                    className="btn-icon"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleInstallPWA}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        </Header>

        <Content className={`app-main ${currentPage === 'exam' ? 'exam-content' : ''}`}>
          {dataLoading ? (
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
        </Content>

        <WrongBookDrawer
          showWrongBookModal={showWrongBookModal}
          setShowWrongBookModal={setShowWrongBookModal}
          wrongBook={wrongBook}
          removeFromWrongBook={removeFromWrongBook}
          clearWrongBook={clearWrongBook}
          examData={examData}
          setSelectedQuestion={setSelectedQuestion}
          setShowQuestionDetail={setShowQuestionDetail}
        />

        <Drawer
          title="题目详情"
          open={showQuestionDetail}
          onClose={() => setShowQuestionDetail(false)}
          width={800}
          size={600}
          placement="right"
        >
          <div className="exam-card">
            <div className="card-content">
              <div className="question-content">
                <div className="question-text">{selectedQuestion?.question}</div>
                <div className="options-list">
                  {selectedQuestion?.options?.map((opt) => {
                    const key = selectedQuestion?.type === 'judge' ? opt : ['A', 'B', 'C', 'D'][selectedQuestion.options.indexOf(opt)]
                    const answer = Array.isArray(selectedQuestion?.answer) ? selectedQuestion.answer : [selectedQuestion?.answer]
                    const isCorrect = selectedQuestion?.type === 'multiple'
                      ? answer.includes(key)
                      : answer[0] === key
                    return (
                      <QuestionOption
                        key={key}
                        opt={opt}
                        questionType={selectedQuestion?.type}
                        isReviewMode={true}
                        selected={false}
                        isCorrect={isCorrect}
                        isWrong={true}
                      />
                    )
                  })}
                </div>
                {selectedQuestion?.parse && (
                  <div className="parse-box show">
                    <div className="parse-title"><QuestionCircleOutlined /> 解析</div>
                    <div className="parse-text">{selectedQuestion.parse}</div>
                    <div className="parse-answer">
                      正确答案：{selectedQuestion.answer}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Drawer>

        {currentPage === 'home' && (
          <Footer className="app-footer">
            <div className="footer-content">
              <p>你只管学，其余的交给我！</p>
              <p className="footer-version">Design by 乔伟鹏—V1.4</p>
            </div>
          </Footer>
        )}

        <Modal
          title="应用更新"
          open={showUpdateModal}
          onCancel={() => setShowUpdateModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowUpdateModal(false)}>
              稍后更新
            </Button>,
            <Button key="confirm" type="primary" onClick={handleRefreshAndUpdate}>
              立即更新
            </Button>,
          ]}
        >
          <p>检测到新版本可用，是否立即更新？</p>
          <p>更新后应用将重新加载，当前进度不会丢失。</p>
        </Modal>
      </Layout>
      </App>
    </ConfigProvider>
  )
}
