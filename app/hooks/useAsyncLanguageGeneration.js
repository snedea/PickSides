import { useState, useEffect, useRef } from 'react'

export function useAsyncLanguageGeneration() {
  const [generationStatus, setGenerationStatus] = useState({}) // debateId -> { status, language }
  const [notifications, setNotifications] = useState([]) // Array of notification objects
  const generationQueue = useRef(new Set()) // Track what's being generated
  const timeouts = useRef(new Map()) // Track timeouts for cleanup

  // Status constants
  const STATUS = {
    IDLE: 'idle',
    PENDING: 'pending', 
    GENERATING: 'generating',
    COMPLETE: 'complete',
    ERROR: 'error'
  }

  // Check if a debate needs language generation
  const needsLanguageGeneration = (debate, requestedLanguage) => {
    if (!debate?.rounds) return false
    
    // Get the first round - API returns rounds as an array
    const firstRound = Array.isArray(debate.rounds) ? debate.rounds[0] : debate.rounds['1']
    if (!firstRound) return false // No rounds available

    // For API response format (rounds as array with language-specific content)
    if (Array.isArray(debate.rounds)) {
      // Check if we have content
      const hasContent = firstRound.pro && firstRound.con && 
                        firstRound.pro.trim() !== '' && firstRound.con.trim() !== ''
      const hasTopic = debate.topic && debate.topic.trim() !== ''
      
      // If we don't have content or topic at all, we need generation
      if (!hasContent || !hasTopic) {
        return true
      }
      
      // Check if content/topic are in the wrong language using metadata
      const contentInWrongLanguage = firstRound.contentLanguage && 
                                   firstRound.contentLanguage !== requestedLanguage
      const topicInWrongLanguage = debate.topicLanguage && 
                                 debate.topicLanguage !== requestedLanguage
      
      // Need generation if content or topic are in wrong language (fallback was used)
      return contentInWrongLanguage || topicInWrongLanguage
    }

    // For database format (rounds as object with nested language structure)  
    // This is used in admin/backend contexts where we have the raw DB data
    if (typeof firstRound.pro === 'object' && firstRound.pro !== null) {
      // Enhanced server-side matching logic
      const sourceLanguage = requestedLanguage === 'en' ? 'ro' : 'en'
      
      // Check if content exists in requested language
      const hasRequestedContent = firstRound.pro[requestedLanguage] && 
                                 firstRound.pro[requestedLanguage].trim() !== '' &&
                                 firstRound.con[requestedLanguage] &&
                                 firstRound.con[requestedLanguage].trim() !== ''
      
      // Check if topic exists in requested language
      const topicField = `topic_${requestedLanguage}`
      const sourceTopicField = `topic_${sourceLanguage}`
      const hasTopicInLanguage = debate[topicField] && debate[topicField].trim() !== ''
      
      // Check for legacy bug where both topics are identical (like server-side logic)
      const sourceTopic = debate[sourceTopicField] || debate.topic
      const targetTopic = debate[topicField]
      const topicsAreIdentical = (targetTopic && sourceTopic && targetTopic === sourceTopic) ||
                               (targetTopic && !sourceTopic && requestedLanguage !== 'en')
      
      // Need generation if we don't have content, topic, or topics are identical (legacy bug)
      const needsTopicTranslation = !hasTopicInLanguage || topicsAreIdentical
      
      // Match server logic: return false only if we have both content AND topic (and no legacy issues)
      if (hasRequestedContent && hasTopicInLanguage && !needsTopicTranslation) {
        return false
      }
      
      return true
    }

    // Fallback - assume we need generation
    return true
  }

  // Trigger language generation
  const generateLanguage = async (debateId, targetLanguage, delay = 3000, debate = null) => {
    const queueKey = `${debateId}-${targetLanguage}`
    
    // Avoid duplicate generations - check both queue and current status
    if (generationQueue.current.has(queueKey)) {
      return
    }

    const currentStatus = getGenerationStatus(debateId)
    if (currentStatus.status === STATUS.GENERATING || 
        currentStatus.status === STATUS.PENDING ||
        currentStatus.status === STATUS.COMPLETE) {
      return
    }

    // Early check: if we have the debate data, check if generation is actually needed
    // This prevents showing "Preparing..." for content that already exists
    if (debate && !needsLanguageGeneration(debate, targetLanguage)) {
      console.log('Generation skipped - content already exists:', queueKey)
      return
    }

    generationQueue.current.add(queueKey)
    
    // Update status to pending
    setGenerationStatus(prev => ({
      ...prev,
      [debateId]: { status: STATUS.PENDING, language: targetLanguage }
    }))

    // Add notification about pending generation
    addNotification({
      id: queueKey,
      type: 'info',
      message: `Preparing ${targetLanguage === 'ro' ? 'Romanian' : 'English'} version...`,
      duration: delay + 5000 // Show until generation completes
    })

    // Wait for the specified delay
    const timeoutId = setTimeout(async () => {
      try {
        // Update status to generating
        setGenerationStatus(prev => ({
          ...prev,
          [debateId]: { status: STATUS.GENERATING, language: targetLanguage }
        }))

        // Call the generation API
        const response = await fetch('/api/debate/generate-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ debateId, targetLanguage })
        })

        const result = await response.json()

        if (response.ok) {
          if (result.generated) {
            // Actually generated new content - success
            setGenerationStatus(prev => ({
              ...prev,
              [debateId]: { status: STATUS.COMPLETE, language: targetLanguage }
            }))

            // Add success notification
            addNotification({
              id: `${queueKey}-complete`,
              type: 'success',
              message: `${targetLanguage === 'ro' ? 'Romanian' : 'English'} version is now available!`,
              duration: 4000,
              action: {
                label: 'Refresh',
                onClick: () => window.location.reload()
              }
            })
          } else {
            // Content already exists - clean up and remove preparing notification
            console.log('Generation skipped - content already exists:', queueKey)
            setGenerationStatus(prev => ({
              ...prev,
              [debateId]: { status: STATUS.IDLE, language: null }
            }))
            
            // Immediately remove the "preparing" notification since no work is needed
            removeNotification(queueKey)
          }
        } else {
          throw new Error(result.error || 'Generation failed')
        }

      } catch (error) {
        console.error('Language generation failed:', error)
        
        setGenerationStatus(prev => ({
          ...prev,
          [debateId]: { status: STATUS.ERROR, language: targetLanguage }
        }))

        addNotification({
          id: `${queueKey}-error`,
          type: 'error',
          message: `Failed to generate ${targetLanguage === 'ro' ? 'Romanian' : 'English'} version`,
          duration: 6000
        })

      } finally {
        generationQueue.current.delete(queueKey)
        timeouts.current.delete(queueKey)
      }
    }, delay)

    timeouts.current.set(queueKey, timeoutId)
  }

  // Add notification helper
  const addNotification = (notification) => {
    setNotifications(prev => [...prev, { 
      ...notification, 
      timestamp: Date.now() 
    }])

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }
  }

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Get generation status for a debate
  const getGenerationStatus = (debateId) => {
    return generationStatus[debateId] || { status: STATUS.IDLE, language: null }
  }

  // Check if currently generating
  const isGenerating = (debateId, language) => {
    const status = getGenerationStatus(debateId)
    return status.status === STATUS.GENERATING && status.language === language
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeouts.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeouts.current.clear()
      generationQueue.current.clear()
    }
  }, [])

  return {
    generateLanguage,
    needsLanguageGeneration,
    getGenerationStatus,
    isGenerating,
    notifications,
    removeNotification,
    STATUS
  }
}

export default useAsyncLanguageGeneration