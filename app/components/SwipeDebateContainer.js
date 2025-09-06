'use client'

import { useState, useEffect } from 'react'
import DebateCard from './DebateCard'
import VotingCard from './VotingCard'
import styles from './SwipeDebateContainer.module.css'

export default function SwipeDebateContainer({ debates }) {
  const [currentDebateIndex, setCurrentDebateIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1) // 1, 2, 3 for rounds, 4 for voting
  const [votes, setVotes] = useState({}) // Track votes by debate ID
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const minSwipeDistance = 50
  const currentDebate = debates[currentDebateIndex]
  
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
          setTimeout(() => {
            setVotes(prev => ({
              ...prev,
              [currentDebate.id]: 'tie'
            }))
            
            // Auto-advance to next debate (or previous if swiping right)
            setTimeout(() => {
              if (distanceX > 0) {
                // Swipe left - next debate
                nextDebate()
              } else {
                // Swipe right - previous debate
                previousDebate()
              }
            }, 350) // Brief delay to show tie confirmation
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
            setTimeout(() => {
              setVotes(prev => ({
                ...prev,
                [currentDebate.id]: 'pro'
              }))
              setTimeout(() => {
                nextDebate()
              }, 350)
            }, 150)
          } else {
            // Swipe down - vote Con
            if (typeof window !== 'undefined' && window.triggerConFlash) {
              window.triggerConFlash()
            }
            setTimeout(() => {
              setVotes(prev => ({
                ...prev,
                [currentDebate.id]: 'con'
              }))
              setTimeout(() => {
                nextDebate()
              }, 350)
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
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const previousDebate = () => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentDebateIndex(prev => prev > 0 ? prev - 1 : debates.length - 1)
      setCurrentRound(1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handleVote = (side) => {
    setVotes(prev => ({
      ...prev,
      [currentDebate.id]: side
    }))
    
    // Auto-advance to next debate after brief confirmation
    setTimeout(() => {
      nextDebate()
    }, 500)
  }

  // Create debate data for current round
  const currentRoundData = currentRound <= 3 ? {
    ...currentDebate,
    rounds: [currentDebate.rounds[currentRound - 1]]
  } : null

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
            {currentDebateIndex + 1} / {debates.length}
          </div>
        </div>
        <div className={styles.fixedTopic}>
          <h1>{currentDebate.topic}</h1>
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
          <DebateCard debate={currentRoundData} />
        ) : (
          <VotingCard 
            topic={currentDebate.topic}
            onVote={handleVote}
            hasVoted={!!votes[currentDebate.id]}
            votedFor={votes[currentDebate.id]}
          />
        )}
      </div>

    </div>
  )
}