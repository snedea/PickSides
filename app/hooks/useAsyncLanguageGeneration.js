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
    
    // Get the first round - API returns rounds as an array, DB has object format
    const firstRound = Array.isArray(debate.rounds) ? debate.rounds[0] : debate.rounds['1']
    if (!firstRound) return false

    // Debug logging to understand the data structure
    console.log('needsLanguageGeneration check:', {
      debateId: debate.id,
      requestedLanguage,
      roundsType: Array.isArray(debate.rounds) ? 'array' : 'object',
      firstRound: firstRound,
      hasProContent: !!firstRound.pro,
      proContentType: typeof firstRound.pro
    })

    // For API response format (rounds as array with string content)
    if (Array.isArray(debate.rounds)) {
      // If the current round has content in the requested language, no generation needed
      // This checks if the content is showing in the requested language already
      const hasContent = firstRound.pro && firstRound.con && 
                        firstRound.pro.trim() !== '' && firstRound.con.trim() !== ''
      
      console.log('Array format check:', {
        hasContent,
        currentLanguage: 'displaying current language content'
      })
      
      // For now, don't trigger generation if content exists (fallback is working)
      // TODO: Add more sophisticated language detection
      return false
    }

    // For database format (rounds as object with nested language structure)
    if (typeof firstRound.pro === 'object' && firstRound.pro !== null) {
      const hasRequestedContent = firstRound.pro[requestedLanguage] && 
                                 firstRound.pro[requestedLanguage].trim() !== '' &&
                                 firstRound.con[requestedLanguage] &&
                                 firstRound.con[requestedLanguage].trim() !== ''
      
      console.log('Object format check:', {
        hasRequestedContent,
        availableLanguages: Object.keys(firstRound.pro || {}),
        proContent: firstRound.pro[requestedLanguage]?.substring(0, 50) + '...'
      })
      
      return !hasRequestedContent
    }

    // Fallback for unknown format
    console.log('Unknown format, skipping generation')
    return false
  }

  // Trigger language generation
  const generateLanguage = async (debateId, targetLanguage, delay = 3000) => {
    const queueKey = `${debateId}-${targetLanguage}`
    
    // Avoid duplicate generations - check both queue and current status
    if (generationQueue.current.has(queueKey)) {
      console.log('Skipping generation - already in queue:', queueKey)
      return
    }

    const currentStatus = getGenerationStatus(debateId)
    if (currentStatus.status === STATUS.GENERATING || currentStatus.status === STATUS.PENDING) {
      console.log('Skipping generation - already in progress:', queueKey, currentStatus)
      return
    }

    console.log('Starting generation for:', queueKey)
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
            // Content already exists - not an error, just clean up
            console.log('Generation skipped - content already exists:', queueKey)
            setGenerationStatus(prev => ({
              ...prev,
              [debateId]: { status: STATUS.IDLE, language: null }
            }))
            // Don't show error notification for this case
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