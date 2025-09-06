'use client'

import { useState, useEffect } from 'react'
import DebateCard from './DebateCard'
import VotingCard from './VotingCard'
import TopicSubmissionCard from './TopicSubmissionCard'
import FinalResultsCard from './FinalResultsCard'
import styles from './SwipeDebateContainer.module.css'

export default function SwipeDebateContainer() {
  const [debates, setDebates] = useState([])
  const [currentDebateIndex, setCurrentDebateIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1) // 1, 2, 3 for rounds, 4 for voting
  const [votes, setVotes] = useState({}) // Track votes by debate ID
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [isGeneratingDebate, setIsGeneratingDebate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isVoting, setIsVoting] = useState(false)
  
  // Round-by-round voting state
  const [roundWinners, setRoundWinners] = useState({
    round1: null,  // 'pro' or 'con'
    round2: null,
    round3: null
  })
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const minSwipeDistance = 50
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
    // Update round winners
    setRoundWinners(prev => ({
      ...prev,
      [`round${roundNumber}`]: side
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
    setRoundWinners(prev => ({
      ...prev,
      [`round${roundNumber}`]: null
    }))
  }

  // Handle voting again (reset all votes)
  const handleVoteAgain = () => {
    setRoundWinners({
      round1: null,
      round2: null,
      round3: null
    })
    setCurrentRound(1)
  }

  // Handle viewing votes (go back to round 1)
  const handleViewVotes = () => {
    setCurrentRound(1)
  }

  // Load debates from database on mount
  useEffect(() => {
    async function loadDebates() {
      try {
        setIsLoading(true)
        setLoadError(null)
        
        const response = await fetch('/api/debates?limit=20')
        if (!response.ok) {
          throw new Error('Failed to load debates')
        }
        
        const debatesData = await response.json()
        
        if (debatesData.length === 0) {
          // If no debates in database, load sample debates as fallback
          const { sampleDebates } = await import('../data/sampleDebates')
          setDebates(sampleDebates)
        } else {
          setDebates(debatesData)
        }
        
      } catch (error) {
        console.error('Error loading debates:', error)
        setLoadError('Failed to load debates. Please try again.')
        
        // Load sample debates as fallback
        try {
          const { sampleDebates } = await import('../data/sampleDebates')
          setDebates(sampleDebates)
        } catch (fallbackError) {
          console.error('Failed to load fallback debates:', fallbackError)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDebates()
  }, [])
  
  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)
    
    if (Math.abs(distanceX) < minSwipeDistance && Math.abs(distanceY) < minSwipeDistance) return

    if (isHorizontalSwipe) {
      // Horizontal swipe - change debates
      if (currentRound === 4) {
        // On voting screen - register as tie if no vote, then navigate
        if (!votes[currentDebate.id]) {
          // Trigger TIE button flash animation
          if (typeof window !== 'undefined' && window.triggerTieFlash) {
            window.triggerTieFlash()
          }
          
          // Wait for flash animation, then register vote and auto-advance
          setTimeout(async () => {
            await handleVote('tie')
            
            // Navigation will be handled by handleVote function
            // But for horizontal gesture, we need to handle direction
            if (distanceX > 0) {
              // Swipe left - next debate (handleVote already calls nextDebate)
            } else {
              // Swipe right - previous debate
              setTimeout(() => previousDebate(), 500)
            }
          }, 150)
        } else {
          // Already voted, navigate immediately
          if (distanceX > 0) {
            nextDebate()
          } else {
            previousDebate()
          }
        }
      } else {
        // On rounds 1-3, horizontal swipe navigates debates
        if (distanceX > 0) {
          // Swipe left - next debate
          nextDebate()
        } else {
          // Swipe right - previous debate
          previousDebate()
        }
      }
    } else {
      // Vertical swipe
      if (currentRound === 4) {
        // On voting screen - up=Pro, down=Con
        if (!votes[currentDebate.id]) {
          if (distanceY > 0) {
            // Swipe up - vote Pro
            if (typeof window !== 'undefined' && window.triggerProFlash) {
              window.triggerProFlash()
            }
            setTimeout(async () => {
              await handleVote('pro')
            }, 150)
          } else {
            // Swipe down - vote Con
            if (typeof window !== 'undefined' && window.triggerConFlash) {
              window.triggerConFlash()
            }
            setTimeout(async () => {
              await handleVote('con')
            }, 150)
          }
        }
      } else {
        // Change rounds (not on voting screen)
        if (distanceY > 0) {
          // Swipe up - next round
          nextRound()
        } else {
          // Swipe down - previous round
          previousRound()
        }
      }
    }
  }

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
      setCurrentDebateIndex(prev => prev < debates.length - 1 ? prev + 1 : 0)
      setCurrentRound(1)
      // Reset round voting state for new debate
      setRoundWinners({
        round1: null,
        round2: null,
        round3: null
      })
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const previousDebate = () => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentDebateIndex(prev => prev > 0 ? prev - 1 : debates.length - 1)
      setCurrentRound(1)
      // Reset round voting state for new debate
      setRoundWinners({
        round1: null,
        round2: null,
        round3: null
      })
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


  const handleTopicSubmit = async ({ topic, proModel, conModel }) => {
    setIsGeneratingDebate(true)
    
    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, proModel, conModel })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate debate')
      }
      
      const newDebate = await response.json()
      
      // Add to debates array and navigate to it
      setDebates(prev => [...prev, newDebate])
      setCurrentDebateIndex(debates.length) // Navigate to new debate
      setCurrentRound(1)
      setShowSubmissionForm(false)
      
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

  // Show error state if no debates loaded
  if (debates.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>No debates available.</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fixed Topic Header */}
      <div className={styles.fixedHeader}>
        <div className={styles.indicators}>
          <div className={styles.debateIndicator}>
            {debates.length > 0 ? `${currentDebateIndex + 1} / ${debates.length}` : '0 / 0'}
          </div>
          <button 
            className={styles.addTopicButton}
            onClick={() => setShowSubmissionForm(true)}
            aria-label="Add new topic"
          >
            +
          </button>
        </div>
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


    </div>
  )
}