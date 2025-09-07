'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import useAsyncLanguageGeneration from '../hooks/useAsyncLanguageGeneration'
import DebateCard from './DebateCard'
import VotingCard from './VotingCard'
import TopicSubmissionCard from './TopicSubmissionCard'
import FinalResultsCard from './FinalResultsCard'
import BottomNavBar from './BottomNavBar'
import DebateOverview from './DebateOverview'
import AsyncGenerationNotifications from './AsyncGenerationNotifications'
import styles from './SwipeDebateContainer.module.css'

export default function SwipeDebateContainer() {
  const { language } = useLanguage()
  const {
    generateLanguage,
    needsLanguageGeneration,
    getGenerationStatus,
    isGenerating,
    notifications,
    removeNotification
  } = useAsyncLanguageGeneration()
  const [debates, setDebates] = useState([])
  const [currentDebateIndex, setCurrentDebateIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1) // 1, 2, 3 for rounds, 4 for voting
  const [votes, setVotes] = useState({}) // Track final debate votes by debate ID
  const [roundVotes, setRoundVotes] = useState({}) // Track round-by-round votes by debate ID
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [showOverview, setShowOverview] = useState(true)
  const [isGeneratingDebate, setIsGeneratingDebate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isVoting, setIsVoting] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)
  
  // Round-by-round voting state
  const [roundWinners, setRoundWinners] = useState({
    round1: null,  // 'pro' or 'con'
    round2: null,
    round3: null
  })
  
  const currentDebate = debates[currentDebateIndex]

  // Calculate current score from round winners
  const calculateCurrentScore = () => {
    const score = { pro: 0, con: 0 }
    Object.values(roundWinners).forEach(winner => {
      if (winner === 'pro') score.pro++
      else if (winner === 'con') score.con++
    })
    return score
  }

  // Handle round voting
  const handleRoundVote = (roundNumber, side) => {
    const currentDebate = debates[currentDebateIndex]
    if (!currentDebate) return
    
    // Update round winners
    setRoundWinners(prev => ({
      ...prev,
      [`round${roundNumber}`]: side
    }))
    
    // Update persistent round votes
    setRoundVotes(prev => ({
      ...prev,
      [currentDebate.id]: {
        ...prev[currentDebate.id],
        [`round${roundNumber}`]: side
      }
    }))
    
    // Auto-advance after voting with delay
    if (roundNumber < 3) {
      setTimeout(() => setCurrentRound(roundNumber + 1), 300)
    } else {
      // All rounds complete, show final score
      setTimeout(() => setCurrentRound(4), 300)
    }
  }

  // Handle unvoting (removing a vote)
  const handleUnvote = (roundNumber) => {
    const currentDebate = debates[currentDebateIndex]
    if (!currentDebate) return
    
    setRoundWinners(prev => ({
      ...prev,
      [`round${roundNumber}`]: null
    }))
    
    // Update persistent round votes
    setRoundVotes(prev => {
      const debateVotes = { ...prev[currentDebate.id] }
      delete debateVotes[`round${roundNumber}`]
      return {
        ...prev,
        [currentDebate.id]: debateVotes
      }
    })
  }

  // Handle voting again (reset all votes)
  const handleVoteAgain = () => {
    const currentDebate = debates[currentDebateIndex]
    if (!currentDebate) return
    
    setRoundWinners({
      round1: null,
      round2: null,
      round3: null
    })
    
    // Clear persistent round votes for this debate
    setRoundVotes(prev => ({
      ...prev,
      [currentDebate.id]: {}
    }))
    
    // Also clear final vote if exists
    setVotes(prev => {
      const newVotes = { ...prev }
      delete newVotes[currentDebate.id]
      return newVotes
    })
    
    setCurrentRound(1)
  }

  // Handle viewing votes (go back to round 1)
  const handleViewVotes = () => {
    setCurrentRound(1)
  }

  // Handle home button
  const handleHome = () => {
    setShowOverview(true)
    setShowSubmissionForm(false)
  }

  // Handle debate selection from overview
  const handleDebateSelect = (debate, targetRound = 1, targetState = 'round') => {
    const debateIndex = debates.findIndex(d => d.id === debate.id)
    if (debateIndex !== -1) {
      setCurrentDebateIndex(debateIndex)
      setCurrentRound(targetRound)
      
      // Load round winners from persistent storage
      const persistentRoundVotes = roundVotes[debate.id] || {}
      setRoundWinners({
        round1: persistentRoundVotes.round1 || null,
        round2: persistentRoundVotes.round2 || null,
        round3: persistentRoundVotes.round3 || null
      })
      
      setShowOverview(false)
    }
  }

  // Handle debate deletion
  const handleDebateDelete = async (debateId) => {
    try {
      // Call delete API
      const response = await fetch(`/api/debates/${debateId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete debate')
      }
      
      // Remove from local state
      setDebates(prev => prev.filter(d => d.id !== debateId))
      
      // Clean up votes from localStorage
      setVotes(prev => {
        const newVotes = { ...prev }
        delete newVotes[debateId]
        return newVotes
      })
      
      setRoundVotes(prev => {
        const newRoundVotes = { ...prev }
        delete newRoundVotes[debateId]
        return newRoundVotes
      })
      
      // Reset current debate if we deleted the one being viewed
      const currentDebate = debates[currentDebateIndex]
      if (currentDebate && currentDebate.id === debateId) {
        setCurrentDebateIndex(0)
        setCurrentRound(1)
        setRoundWinners({ round1: null, round2: null, round3: null })
        setShowOverview(true)
      }
      
    } catch (error) {
      console.error('Error deleting debate:', error)
      alert('Failed to delete debate. Please try again.')
    }
  }

  // Load debates function (can be called anywhere)
  const loadDebates = async (forceRefresh = false) => {
    // Smart caching: don't refetch if data is very fresh (within 30 seconds)
    // unless explicitly forced
    if (!forceRefresh && lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime
      if (timeSinceLastRefresh < 30000) {
        return // Skip refresh if data is fresh
      }
    }
    
    try {
      setIsLoading(true)
      setLoadError(null)
      
      const response = await fetch(`/api/debates?limit=20&language=${language}`)
      if (!response.ok) {
        throw new Error('Failed to load debates')
      }
      
      const debatesData = await response.json()
      setDebates(debatesData)
      setLastRefreshTime(Date.now())
      
    } catch (error) {
      console.error('Error loading debates:', error)
      setLoadError('Failed to load debates. Please try again.')
      setDebates([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  // Load debates from database on mount and when language changes
  useEffect(() => {
    loadDebates(true) // Force refresh on initial load and language change
  }, [language])

  // Trigger async generation when viewing a debate that needs target language content
  useEffect(() => {
    if (currentDebate && !showOverview && !showSubmissionForm && currentRound <= 3) {
      // Check if current debate needs language generation
      if (needsLanguageGeneration(currentDebate, language)) {
        // Generate missing language content after a short delay
        generateLanguage(currentDebate.id, language, 5000) // 5 second delay
      }
    }
  }, [currentDebate, language, showOverview, showSubmissionForm, currentRound, needsLanguageGeneration, generateLanguage])

  // Load persistent votes from localStorage
  useEffect(() => {
    try {
      const savedVotes = localStorage.getItem('debate_final_votes')
      const savedRoundVotes = localStorage.getItem('debate_round_votes')
      
      if (savedVotes) {
        setVotes(JSON.parse(savedVotes))
      }
      
      if (savedRoundVotes) {
        setRoundVotes(JSON.parse(savedRoundVotes))
      }
    } catch (error) {
      console.error('Error loading persistent votes:', error)
    }
  }, [])

  // Save final votes to localStorage whenever votes change
  useEffect(() => {
    try {
      localStorage.setItem('debate_final_votes', JSON.stringify(votes))
    } catch (error) {
      console.error('Error saving final votes:', error)
    }
  }, [votes])

  // Save round votes to localStorage whenever roundVotes change
  useEffect(() => {
    try {
      localStorage.setItem('debate_round_votes', JSON.stringify(roundVotes))
    } catch (error) {
      console.error('Error saving round votes:', error)
    }
  }, [roundVotes])

  // Auto-refresh debates when returning to overview
  useEffect(() => {
    if (showOverview) {
      loadDebates() // Smart refresh when overview is shown
    }
  }, [showOverview])

  // Auto-refresh debates when generation completes
  useEffect(() => {
    const completedGenerations = notifications.filter(n => n.type === 'success')
    if (completedGenerations.length > 0) {
      // Refresh debates after successful generation
      setTimeout(() => {
        loadDebates(true) // Force refresh to get updated content
      }, 1000)
    }
  }, [notifications])

  const nextRound = () => {
    if (currentRound < 4 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentRound(prev => prev + 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const previousRound = () => {
    if (currentRound > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentRound(prev => prev - 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const nextDebate = () => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      const newIndex = currentDebateIndex < debates.length - 1 ? currentDebateIndex + 1 : 0
      setCurrentDebateIndex(newIndex)
      setCurrentRound(1)
      
      // Load round voting state for new debate from persistent storage
      const newDebate = debates[newIndex]
      if (newDebate) {
        const persistentRoundVotes = roundVotes[newDebate.id] || {}
        setRoundWinners({
          round1: persistentRoundVotes.round1 || null,
          round2: persistentRoundVotes.round2 || null,
          round3: persistentRoundVotes.round3 || null
        })
      } else {
        setRoundWinners({
          round1: null,
          round2: null,
          round3: null
        })
      }
      
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const previousDebate = () => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      const newIndex = currentDebateIndex > 0 ? currentDebateIndex - 1 : debates.length - 1
      setCurrentDebateIndex(newIndex)
      setCurrentRound(1)
      
      // Load round voting state for new debate from persistent storage
      const newDebate = debates[newIndex]
      if (newDebate) {
        const persistentRoundVotes = roundVotes[newDebate.id] || {}
        setRoundWinners({
          round1: persistentRoundVotes.round1 || null,
          round2: persistentRoundVotes.round2 || null,
          round3: persistentRoundVotes.round3 || null
        })
      } else {
        setRoundWinners({
          round1: null,
          round2: null,
          round3: null
        })
      }
      
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handleVote = async (side) => {
    if (isVoting || !currentDebate) return
    
    setIsVoting(true)
    
    // Optimistic update
    setVotes(prev => ({
      ...prev,
      [currentDebate.id]: side
    }))
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debateId: currentDebate.id,
          side
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          // User already voted - keep the optimistic update and treat as success
          console.log('User already voted on this debate')
          // Don't update vote counts since they already voted
          return
        } else {
          throw new Error(errorData.error || 'Failed to vote')
        }
      }
      
      // Update debate vote counts in local state only if vote was successful
      setDebates(prev => 
        prev.map(debate => 
          debate.id === currentDebate.id 
            ? { 
                ...debate, 
                [side === 'pro' ? 'pro_votes' : side === 'con' ? 'con_votes' : 'tie_votes']: 
                  (debate[side === 'pro' ? 'pro_votes' : side === 'con' ? 'con_votes' : 'tie_votes'] || 0) + 1
              }
            : debate
        )
      )
      
    } catch (error) {
      console.error('Voting error:', error)
      
      // Revert optimistic update on error
      setVotes(prev => {
        const newVotes = { ...prev }
        delete newVotes[currentDebate.id]
        return newVotes
      })
      
      // Could show error toast here
      alert('Failed to record vote. Please try again.')
      
      // Don't auto-advance on error
      setIsVoting(false)
      return
    } finally {
      setIsVoting(false)
    }
    
    // Auto-advance to next debate after brief confirmation (only on success)
    setTimeout(() => {
      nextDebate()
    }, 500)
  }


  const handleTopicSubmit = async ({ topic, proModel, conModel, proPersona, conPersona }) => {
    setIsGeneratingDebate(true)
    
    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, proModel, conModel, proPersona, conPersona, language })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate debate')
      }
      
      const newDebate = await response.json()
      
      // Add to debates array and navigate to it (optimistic update)
      setDebates(prev => [...prev, newDebate])
      setLastRefreshTime(Date.now()) // Update refresh timestamp for new data
      setCurrentDebateIndex(debates.length) // Navigate to new debate
      setCurrentRound(1)
      setShowSubmissionForm(false)
      setShowOverview(false) // Exit overview if we were there
      
      // Initialize empty voting state for new debate
      setRoundWinners({
        round1: null,
        round2: null,
        round3: null
      })
      
    } catch (error) {
      console.error('Error generating debate:', error)
      // Could add error toast here
    } finally {
      setIsGeneratingDebate(false)
    }
  }

  const handleSubmissionCancel = () => {
    setShowSubmissionForm(false)
  }

  // Create debate data for current round
  const currentRoundData = currentRound <= 3 && currentDebate && currentDebate.rounds ? {
    ...currentDebate,
    rounds: [currentDebate.rounds[currentRound - 1]]
  } : null

  // Show submission form if requested
  if (showSubmissionForm) {
    return (
      <TopicSubmissionCard
        onSubmit={handleTopicSubmit}
        onCancel={handleSubmissionCancel}
        isLoading={isGeneratingDebate}
      />
    )
  }

  // Show overview screen if requested
  if (showOverview) {
    return (
      <div className={styles.container}>
        <DebateOverview 
          debates={debates}
          roundVotes={roundVotes}
          finalVotes={votes}
          onDebateSelect={handleDebateSelect}
          onAddTopic={() => setShowSubmissionForm(true)}
          onDebateDelete={handleDebateDelete}
        />
        <BottomNavBar 
          currentDebate={currentDebateIndex + 1}
          totalDebates={debates.length}
          onAddTopic={() => setShowSubmissionForm(true)}
          onHome={handleHome}
        />
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading debates...</p>
          {loadError && (
            <p className={styles.error}>{loadError}</p>
          )}
        </div>
      </div>
    )
  }

  // Show overview with empty state if no debates loaded
  if (debates.length === 0 && !isLoading) {
    return (
      <div className={styles.container}>
        <DebateOverview 
          debates={[]}
          roundVotes={{}}
          finalVotes={{}}
          onDebateSelect={() => {}}
          onAddTopic={() => setShowSubmissionForm(true)}
          onDebateDelete={() => {}}
        />
        <BottomNavBar 
          currentDebate={0}
          totalDebates={0}
          onAddTopic={() => setShowSubmissionForm(true)}
          onHome={() => setShowOverview(true)}
        />
      </div>
    )
  }

  return (
    <div 
      className={styles.container}
    >
      {/* Async Generation Notifications */}
      <AsyncGenerationNotifications 
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Fixed Topic Header */}
      <div className={styles.fixedHeader}>
        <div className={styles.fixedTopic}>
          <h1>{currentDebate?.topic || 'Loading...'}</h1>
        </div>
      </div>

      {/* Bottom Navigation Dots */}
      <div className={styles.bottomDots}>
        {[1, 2, 3, 4].map(round => (
          <div 
            key={round}
            className={`${styles.navDot} ${currentRound === round ? styles.active : ''} ${round === 4 ? styles.voteDot : ''}`}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true)
                setCurrentRound(round)
                setTimeout(() => setIsTransitioning(false), 300)
              }
            }}
          />
        ))}
      </div>

      {/* Floating Navigation Cue */}
      <div className={styles.floatingNav}>
        <div 
          className={styles.floatingChevron} 
          onClick={() => {
            if (currentRound < 4) {
              nextRound()
            } else if (currentRound === 4) {
              // On voting screen, go to next debate
              nextDebate()
            }
          }}
        />
      </div>

      {/* Main Content */}
      <div className={`${styles.content} ${isTransitioning ? styles.transitioning : ''}`}>
        {currentRound <= 3 ? (
          <DebateCard 
            debate={currentRoundData}
            onVote={handleRoundVote}
            onUnvote={handleUnvote}
            roundNumber={currentRound}
            roundWinners={roundWinners}
          />
        ) : currentDebate ? (
          <FinalResultsCard 
            roundWinners={roundWinners}
            proModel={currentDebate.pro_model}
            conModel={currentDebate.con_model}
            topic={currentDebate.topic}
            debate={currentDebate}
            onContinue={() => nextDebate()}
            onVoteAgain={handleVoteAgain}
            onViewVotes={handleViewVotes}
          />
        ) : null}
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar 
        currentDebate={currentDebateIndex + 1}
        totalDebates={debates.length}
        onAddTopic={() => setShowSubmissionForm(true)}
        onHome={handleHome}
      />
    </div>
  )
}