import { Space, Dropdown, Tooltip, Popconfirm, Button } from 'antd'
import { RetweetOutlined, OrderedListOutlined, RollbackOutlined, VerticalLeftOutlined, VerticalRightOutlined, EllipsisOutlined } from '@ant-design/icons'
import useExamStore from '../../store/examStore.ts'

export default function ExamToolbar({
  isReviewMode,
  viewMode,
  sidebarHidden,
  autoNext,
  onToggleAutoNext,
  onToggleViewMode,
  onToggleSidebar,
  onReExamWrong,
  wrongQuestionIndices = []
}) {
  const {
    showParse,
    toggleShowParse,
    showWrongOnly,
    toggleShowWrongOnly,
    setShowResultModal
  } = useExamStore()

  return (
    <div className="exam-toolbar">
      {isReviewMode && (
        <Space.Compact>
          <Button onClick={() => setShowResultModal(true)}>考试结果</Button>
          <Dropdown 
            menu={{
              items: [
                {
                  key: 'showParse',
                  label: showParse ? '不看解析' : '查看解析',
                  onClick: toggleShowParse
                },
                {
                  key: 'showWrongOnly',
                  label: showWrongOnly ? '全部题目' : '只看错题',
                  onClick: toggleShowWrongOnly
                },
                {
                  key: 'reExamWrong',
                  label: (
                    <Popconfirm
                      title="确认重考错题？"
                      description="将重新开始答题，当前答案将被清空。"
                      onConfirm={onReExamWrong}
                      okText="确认"
                      cancelText="取消"
                      disabled={wrongQuestionIndices.length === 0}
                    >
                      <span>{wrongQuestionIndices.length === 0 ? '无错题可重考' : '重考错题'}</span>
                    </Popconfirm>
                  )
                }
              ]
            }}
            placement="bottomRight"
          >
            <Button icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space.Compact>
      )}
      {!isReviewMode && (
        <Tooltip title={viewMode === 'overview' ? '' : (autoNext ? '切换为手动切题' : '切换为自动切题')}>
          <div 
            className={`toolbar-btn auto-next-btn ${!isReviewMode && viewMode === 'single' && autoNext ? 'active' : ''} ${viewMode === 'overview' ? 'toolbar-btn-hidden' : ''}`} 
            onClick={onToggleAutoNext}
          >
            <RetweetOutlined />
          </div>
        </Tooltip>
      )}
      <Tooltip title={viewMode === 'overview' ? '切换为单题模式' : '切换为全览模式'}>
        <div className={`toolbar-btn view-mode-btn ${viewMode === 'overview' ? 'active' : ''}`} onClick={onToggleViewMode}>
          {viewMode === 'overview' ? <RollbackOutlined /> : <OrderedListOutlined />}
        </div>
      </Tooltip>
      <Tooltip title={sidebarHidden ? '显示侧边栏' : '隐藏侧边栏'}>
        <div className={`toolbar-btn sidebar-toggle-btn ${sidebarHidden ? 'active' : ''}`} onClick={onToggleSidebar}>
          {sidebarHidden ? <VerticalRightOutlined /> : <VerticalLeftOutlined />}
        </div>
      </Tooltip>
    </div>
  )
}
