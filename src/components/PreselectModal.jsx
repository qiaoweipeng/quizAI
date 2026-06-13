/**
 * 一键预选题通知组件
 * 使用 Ant Design Notification 渲染
 */
import { notification } from 'antd'
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
            <button
              onClick={() => {
                notification.destroy('preselect-notification')
                onClose()
              }}
              style={{
                padding: '6px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              onClick={() => {
                notification.destroy('preselect-notification')
                onConfirmRef.current()
              }}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: 4,
                background: '#1890ff',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              确认预选
            </button>
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