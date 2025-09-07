'use client'

import { useState, useEffect } from 'react'
import styles from './AsyncGenerationNotifications.module.css'

export default function AsyncGenerationNotifications({ notifications, onRemove }) {
  const [visibleNotifications, setVisibleNotifications] = useState([])

  useEffect(() => {
    setVisibleNotifications(notifications)
  }, [notifications])

  const handleClose = (id) => {
    // Fade out animation
    setVisibleNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, closing: true } : n)
    )
    
    // Remove after animation
    setTimeout(() => {
      onRemove(id)
    }, 300)
  }

  const handleAction = (notification) => {
    if (notification.action?.onClick) {
      notification.action.onClick()
      handleClose(notification.id)
    }
  }

  if (visibleNotifications.length === 0) return null

  return (
    <div className={styles.container}>
      {visibleNotifications.map(notification => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]} ${notification.closing ? styles.closing : ''}`}
        >
          {/* Icon based on type */}
          <div className={styles.icon}>
            {notification.type === 'info' && '⏳'}
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'generating' && '🔄'}
          </div>

          {/* Content */}
          <div className={styles.content}>
            <div className={styles.message}>{notification.message}</div>
            
            {notification.action && (
              <button
                className={styles.actionButton}
                onClick={() => handleAction(notification)}
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            className={styles.closeButton}
            onClick={() => handleClose(notification.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}