'use client'

import { useState } from 'react'
import styles from './DebateCard.module.css'

const getModelDisplayName = (modelId) => {
  const modelNames = {
    'gpt-4-turbo': 'ChatGPT',
    'claude-3-sonnet': 'Claude',
    'gemini-pro': 'Gemini'
  };
  return modelNames[modelId] || 'AI';
};

const getModelClass = (modelId) => {
  const modelClasses = {
    'gpt-4-turbo': 'chatgpt',
    'claude-3-sonnet': 'claude',
    'gemini-pro': 'gemini'
  };
  return modelClasses[modelId] || 'default';
};

export default function DebateCard({ debate, onVote, onUnvote, roundNumber, roundWinners }) {
  const [enlargedSide, setEnlargedSide] = useState(null)
  const [showVoteAnimation, setShowVoteAnimation] = useState(false)

  // Get the single round data (SwipeDebateContainer passes filtered data)
  const currentRound = debate.rounds[0]
  const currentVote = roundWinners[`round${roundNumber}`]

  const handleSectionTap = (side) => {
    setEnlargedSide(side)
  }

  const handleVote = (side, e) => {
    e.stopPropagation() // Prevent triggering section tap
    
    if (currentVote === side) {
      // Unvote if clicking same side
      onUnvote(roundNumber)
    } else {
      // Vote for this side
      setShowVoteAnimation(true)
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10)
      
      setTimeout(() => {
        setShowVoteAnimation(false)
        onVote(roundNumber, side)
        setEnlargedSide(null)
      }, 250)
    }
  }

  const handleBackgroundTap = () => {
    setEnlargedSide(null)
  }

  // ENLARGED VIEW
  if (enlargedSide) {
    const sideData = enlargedSide === 'pro' ? {
      model: debate.pro_model,
      tldr: currentRound.proTldr,
      argument: currentRound.pro,
      class: 'proModel'
    } : {
      model: debate.con_model,
      tldr: currentRound.conTldr,
      argument: currentRound.con,
      class: 'conModel'
    }

    return (
      <div 
        className={styles.enlargedContainer}
        onClick={handleBackgroundTap}
      >
        {/* Header with model name and heart button */}
        <div className={styles.enlargedHeader}>
          <div className={styles.enlargedModelInfo}>
            <h3 className={styles.enlargedModelName}>
              {getModelDisplayName(sideData.model)}
            </h3>
            <span className={`${styles.enlargedStance} ${enlargedSide === 'pro' ? styles.proStance : styles.conStance}`}>
              {enlargedSide.toUpperCase()} - Round {roundNumber}
            </span>
          </div>
          
          {/* Heart vote button */}
          <button
            onClick={(e) => handleVote(enlargedSide, e)}
            className={styles.enlargedHeartButton}
          >
            {currentVote === enlargedSide ? '❤️' : '♡'}
          </button>
        </div>

        {/* TL;DR */}
        <div className={`${styles.enlargedTldr} ${enlargedSide === 'pro' ? styles.proTldr : styles.conTldr}`}>
          {sideData.tldr}
        </div>

        {/* Argument text */}
        <div className={styles.enlargedArgument}>
          {sideData.argument}
        </div>

        {/* Vote animation */}
        {showVoteAnimation && (
          <div className={styles.voteAnimation}>
            <div className={styles.heartPulse}>❤️</div>
          </div>
        )}

        {/* Bottom hint */}
        <div className={styles.enlargedHints}>
          <p>Tap anywhere to return to comparison view</p>
        </div>
      </div>
    )
  }

  // SPLIT VIEW
  return (
    <div className={styles.debateContainer}>
      {/* Round indicator with vote history */}
      <div className={styles.progressHeader}>
        <span className={styles.roundLabel}>Round {roundNumber} of 3</span>
        <div className={styles.progressDots}>
          {[1, 2, 3].map(num => {
            const vote = roundWinners[`round${num}`]
            return (
              <div 
                key={num}
                className={`${styles.progressDot} ${
                  vote === 'pro' 
                    ? styles.proDot
                    : vote === 'con'
                      ? styles.conDot
                      : num === roundNumber 
                        ? styles.currentDot
                        : styles.emptyDot
                }`}
              />
            )
          })}
        </div>
      </div>

      <div className={styles.roundsContainer}>
        <div className={styles.round}>
          <div className={styles.roundHeader}>
            <h2>Round {currentRound.round}: {currentRound.type}</h2>
          </div>
          
          {/* Debate arguments */}
          <div className={styles.argumentsSplit}>
            {/* Pro Side */}
            <div className={`${styles.proSide}`}>
              {/* Vote indicator/button */}
              <div className={styles.heartButtonContainer}>
                <button
                  onClick={(e) => handleVote('pro', e)}
                  className={styles.heartButton}
                >
                  {currentVote === 'pro' ? '❤️' : '♡'}
                </button>
              </div>
              
              {/* Content */}
              <div 
                className={styles.sectionContent}
                onClick={() => handleSectionTap('pro')}
              >
                <div className={`${styles.sideHeader} ${styles.proHeader}`}>
                  <div className={`${styles.modelName} ${styles.proModel} ${styles[getModelClass(debate.pro_model)]}`}>
                    {getModelDisplayName(debate.pro_model)}
                  </div>
                  <h3>PRO</h3>
                </div>
                <div className={`${styles.tldr} ${styles.proTldr}`}>
                  {currentRound.proTldr}
                </div>
                <div className={styles.argumentText}>
                  {currentRound.pro}
                </div>
              </div>
            </div>

            {/* Con Side */}
            <div className={`${styles.conSide}`}>
              {/* Vote indicator/button */}
              <div className={styles.heartButtonContainer}>
                <button
                  onClick={(e) => handleVote('con', e)}
                  className={styles.heartButton}
                >
                  {currentVote === 'con' ? '❤️' : '♡'}
                </button>
              </div>
              
              {/* Content */}
              <div 
                className={styles.sectionContent}
                onClick={() => handleSectionTap('con')}
              >
                <div className={`${styles.sideHeader} ${styles.conHeader}`}>
                  <div className={`${styles.modelName} ${styles.conModel} ${styles[getModelClass(debate.con_model)]}`}>
                    {getModelDisplayName(debate.con_model)}
                  </div>
                  <h3>CON</h3>
                </div>
                <div className={`${styles.tldr} ${styles.conTldr}`}>
                  {currentRound.conTldr}
                </div>
                <div className={styles.argumentText}>
                  {currentRound.con}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className={styles.bottomHint}>
        <p>Tap text to read full argument • Tap ♡ to vote</p>
      </div>
    </div>
  )
}