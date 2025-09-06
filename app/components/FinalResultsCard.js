'use client'

import { useState } from 'react'
import styles from './FinalResultsCard.module.css'

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

export default function FinalResultsCard({ 
  roundWinners, 
  proModel, 
  conModel, 
  topic,
  debate,
  onContinue,
  onVoteAgain,
  onViewVotes
}) {
  const [hasVoted, setHasVoted] = useState(false)

  // Calculate winner and score
  const calculateWinner = () => {
    const score = { pro: 0, con: 0 }
    Object.values(roundWinners).forEach(winner => {
      if (winner === 'pro') score.pro++
      else if (winner === 'con') score.con++
    })
    
    const proModelName = getModelDisplayName(proModel)
    const conModelName = getModelDisplayName(conModel)
    
    if (score.pro > score.con) {
      return { 
        winner: 'pro', 
        score, 
        model: proModel,
        display: `Pro (${proModelName})`
      }
    }
    if (score.con > score.pro) {
      return { 
        winner: 'con', 
        score, 
        model: conModel,
        display: `Con (${conModelName})`
      }
    }
    return { 
      winner: 'tie', 
      score, 
      model: null,
      display: `Pro (${proModelName}) vs Con (${conModelName})`
    }
  }

  const result = calculateWinner()
  const proModelName = getModelDisplayName(proModel)
  const conModelName = getModelDisplayName(conModel)

  const getRoundLabel = (round, winner) => {
    if (!winner) return 'Not voted'
    if (winner === 'pro') return `Pro (${proModelName})`
    if (winner === 'con') return `Con (${conModelName})`
    return 'Not voted'
  }

  const handleConfirm = () => {
    setHasVoted(true)
  }

  const handleVoteAgain = () => {
    if (confirm('This will erase your current votes. Continue?')) {
      onVoteAgain()
    }
  }

  // POST-VOTE STATE
  if (hasVoted) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.resultsCard}>
          {/* Confirmation */}
          <div className={styles.header}>
            <div className={styles.confirmationIcon}>✅</div>
            <h1 className={styles.title}>Vote Recorded!</h1>
            <p className={styles.topic}>
              {result.display} won {result.score.pro}-{result.score.con}
            </p>
          </div>

          {/* Primary action */}
          <div className={styles.continueSection}>
            <button 
              className={`${styles.continueButton} ${styles.primary}`}
              onClick={onContinue}
            >
              <span className={styles.continueText}>Continue to Next Debate</span>
              <span className={styles.arrow}>→</span>
            </button>
          </div>

          {/* Secondary actions */}
          <div className={styles.secondaryActions}>
            <button
              onClick={onViewVotes}
              className={styles.secondaryButton}
            >
              View My Votes
            </button>
            <button
              onClick={handleVoteAgain}
              className={styles.secondaryButton}
            >
              Vote Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PRE-VOTE STATE (showing results)
  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.winnerIcon}>🏆</div>
          <h1 className={styles.title}>
            {result.display} Wins!
          </h1>
          <p className={styles.scoreDisplay}>
            Final Score: {result.score.pro} - {result.score.con}
          </p>
        </div>

        {/* Round Breakdown */}
        <div className={styles.roundBreakdown}>
          <h3 className={styles.breakdownTitle}>YOUR ROUND VOTES</h3>
          <div className={styles.rounds}>
            {[1, 2, 3].map(round => (
              <div key={round} className={styles.roundResult}>
                <div className={styles.roundNumber}>Round {round}</div>
                <div className={`${styles.roundWinner} ${roundWinners[`round${round}`] === 'pro' ? styles.proWin : styles.conWin}`}>
                  {getRoundLabel(round, roundWinners[`round${round}`])} ✓
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm vote button */}
        <div className={styles.continueSection}>
          <button 
            className={styles.confirmButton}
            onClick={handleConfirm}
          >
            <div className={styles.confirmIcon}>❤️</div>
            <div className={styles.confirmText}>Confirm Vote</div>
          </button>
        </div>

        {/* Option to review */}
        <div className={styles.reviewOption}>
          <button
            onClick={onViewVotes}
            className={styles.reviewButton}
          >
            ← Review my round votes
          </button>
        </div>
      </div>
    </div>
  )
}