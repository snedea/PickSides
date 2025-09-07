'use client'

import { useState } from 'react'
import styles from './VotingCard.module.css'

const getModelDisplayName = (modelId) => {
  const modelNames = {
    'gpt-4-turbo': 'ChatGPT',
    'claude-3-sonnet': 'Claude',
    'gemini-pro': 'Gemini'
  };
  return modelNames[modelId] || 'AI';
};

export default function VotingCard({ topic, proModel, conModel, onVote, hasVoted, votedFor }) {
  const [tieFlash, setTieFlash] = useState(false)
  const [proFlash, setProFlash] = useState(false)
  const [conFlash, setConFlash] = useState(false)

  // Functions to trigger button flashes (will be called from parent)
  const triggerTieFlash = () => {
    setTieFlash(true)
    setTimeout(() => setTieFlash(false), 300)
  }

  const triggerProFlash = () => {
    setProFlash(true)
    setTimeout(() => setProFlash(false), 300)
  }

  const triggerConFlash = () => {
    setConFlash(true)
    setTimeout(() => setConFlash(false), 300)
  }

  // Expose the flash functions to parent component
  if (typeof window !== 'undefined') {
    window.triggerTieFlash = triggerTieFlash
    window.triggerProFlash = triggerProFlash
    window.triggerConFlash = triggerConFlash
  }

  return (
    <div className={styles.votingContainer}>
      <div className={styles.votingCard}>
        <div className={styles.question}>
          <h2>Who won this debate?</h2>
          {proModel && conModel && (
            <div className={styles.modelMatchup}>
              <span className={styles.proModelName}>{getModelDisplayName(proModel)}</span>
              <span className={styles.vs}> vs </span>
              <span className={styles.conModelName}>{getModelDisplayName(conModel)}</span>
            </div>
          )}
          <p className={styles.topic}>{topic}</p>
        </div>
        
        <div className={styles.voteButtonsContainer}>
          <button 
            className={`${styles.voteButton} ${styles.proButton} ${hasVoted && votedFor === 'pro' ? styles.selected : ''} ${proFlash ? styles.flashPro : ''}`}
            onClick={() => !hasVoted && onVote('pro')}
            disabled={hasVoted}
          >
            <div className={styles.voteLabel}>PRO</div>
            {hasVoted && votedFor === 'pro' && <div className={styles.checkmark}>✓</div>}
          </button>
          
          <button 
            className={`${styles.voteButton} ${styles.tieButton} ${hasVoted && votedFor === 'tie' ? styles.selected : ''} ${tieFlash ? styles.flashTie : ''}`}
            onClick={() => !hasVoted && onVote('tie')}
            disabled={hasVoted}
          >
            <div className={styles.voteLabel}>TIE</div>
            {hasVoted && votedFor === 'tie' && <div className={styles.checkmark}>🤝</div>}
          </button>

          <button 
            className={`${styles.voteButton} ${styles.conButton} ${hasVoted && votedFor === 'con' ? styles.selected : ''} ${conFlash ? styles.flashCon : ''}`}
            onClick={() => !hasVoted && onVote('con')}
            disabled={hasVoted}
          >
            <div className={styles.voteLabel}>CON</div>
            {hasVoted && votedFor === 'con' && <div className={styles.checkmark}>✓</div>}
          </button>
        </div>
        
        {hasVoted && (
          <div className={styles.voteConfirmation}>
            <div className={`${styles.confirmationText} ${votedFor === 'tie' ? styles.tieConfirmation : ''}`}>
              {votedFor === 'tie' ? 'Debate tied! 🤝' : 'Vote registered! 🎉'}
            </div>
          </div>
        )}
        
        {!hasVoted && (
          <div className={styles.instruction}>
            <div>Tap a button to vote</div>
            <div className={styles.swipeInstruction}>
              Or swipe: ↑ Pro, ↓ Con, ← → Tie
            </div>
          </div>
        )}
      </div>
    </div>
  )
}