/**
 * 一键预选题通知组件
 * 使用 Ant Design Notification 渲染
 */
import { notification, Button } from 'antd'
import { useEffect, useRef } from 'react'

export default function PreselectModal({ visible, onClose, onConfirm }) {
  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm

  useEffect(() => {
    if (visible) {
      notification.info({
        key: 'preselect-notification',
        message: '⚡ 一键预选',
        description: '自动填充所有题目答案：单选选A、多选全选、判断选对',
        btn: (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button
              onClick={() => {
                notification.destroy('preselect-notification')
                onClose()
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => {
                notification.destroy('preselect-notification')
                onConfirmRef.current()
              }}
            >
              确认预选
            </Button>
          </div>
        ),
        closeIcon: <span onClick={() => { notification.destroy('preselect-notification'); onClose() }} style={{ cursor: 'pointer' }}>×</span>,
        placement: 'top',
        duration: 0
      })
    }
  }, [visible, onClose])

  return null
}