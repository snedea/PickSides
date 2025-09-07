'use client'

import { useLanguage } from '../../contexts/LanguageContext'
import styles from './DebateTile.module.css'

const getModelDisplayName = (modelId) => {
  const modelNames = {
    'gpt-4-turbo': 'ChatGPT',
    'claude-3-sonnet': 'Claude',
    'gemini-pro': 'Gemini'
  }
  return modelNames[modelId] || 'AI'
}

const formatModelPersonaDisplay = (modelId, persona) => {
  const modelName = getModelDisplayName(modelId);
  if (persona && persona !== 'Default AI' && persona !== 'IA Implicită' && persona.trim() !== '') {
    return `${persona} (${modelName})`;
  }
  return modelName;
}

export default function DebateTile({ 
  debate, 
  roundVotes = {}, 
  finalVote = null, 
  onClick,
  onDelete 
}) {
  const { t } = useLanguage()
  
  // Calculate completion status
  const roundVoteCount = Object.keys(roundVotes).length
  const isNotStarted = roundVoteCount === 0
  const isInProgress = roundVoteCount > 0 && roundVoteCount < 3
  const isCompleted = roundVoteCount === 3
  const isFinalized = isCompleted && finalVote
  
  // Get status for styling
  const getStatusClass = () => {
    if (isNotStarted) return styles.notStarted
    if (isInProgress) return styles.inProgress
    if (isFinalized) return styles.finalized
    return styles.completed
  }
  
  // Generate visual indicators for rounds
  const getRoundIndicators = () => {
    return [1, 2, 3].map(round => {
      const vote = roundVotes[`round${round}`]
      if (vote === 'pro') return '🟢'
      if (vote === 'con') return '🔴'
      return '⚪'
    }).join(' ')
  }
  
  // Get winner display
  const getWinnerDisplay = () => {
    if (!isCompleted) return null
    
    // Count round wins
    const proWins = Object.values(roundVotes).filter(v => v === 'pro').length
    const conWins = Object.values(roundVotes).filter(v => v === 'con').length
    
    if (proWins > conWins) {
      return `${getModelDisplayName(debate.pro_model)} ${t('ui.winsExclamation')}`
    } else if (conWins > proWins) {
      return `${getModelDisplayName(debate.con_model)} ${t('ui.winsExclamation')}`
    } else {
      return t('ui.tieResult')
    }
  }
  
  // Truncate topic for display
  const truncatedTopic = debate.topic?.length > 80 
    ? `${debate.topic.substring(0, 77)}...`
    : debate.topic || 'Unknown Topic'
    
  // Handle delete button click
  const handleDeleteClick = (e) => {
    e.stopPropagation() // Prevent tile click
    if (onDelete) {
      const confirmed = confirm(`${t('ui.deleteConfirmation')}\n\n${t('ui.deleteWarning')}`)
      if (confirmed) {
        onDelete(debate.id)
      }
    }
  }
    
  return (
    <div 
      className={`${styles.tile} ${getStatusClass()}`}
      onClick={onClick}
    >
      {/* Status heart for finalized debates */}
      {isFinalized && (
        <div className={styles.heartIcon}>❤️</div>
      )}
      
      {/* Delete button */}
      <button 
        className={styles.deleteButton}
        onClick={handleDeleteClick}
        aria-label={t('ui.deleteDebate')}
        title={t('ui.deleteDebate')}
      >
        ×
      </button>
      
      {/* Topic */}
      <h3 className={styles.tileTitle}>{truncatedTopic}</h3>
      
      {/* Round indicators */}
      <div className={styles.roundIndicators}>
        <span className={styles.indicatorEmojis}>{getRoundIndicators()}</span>
      </div>
      
      {/* Winner or status display */}
      <div className={styles.statusDisplay}>
        {isCompleted ? (
          <div className={styles.winnerDisplay}>
            {getWinnerDisplay()}
          </div>
        ) : (
          <div className={styles.statusLabel}>
            {isNotStarted && t('ui.notStarted')}
            {isInProgress && t('ui.inProgress')}
          </div>
        )}
      </div>
      
      {/* Models display */}
      <div className={styles.modelsDisplay}>
        <span className={styles.modelName}>
          {formatModelPersonaDisplay(debate.pro_model, debate.pro_persona)} vs {formatModelPersonaDisplay(debate.con_model, debate.con_persona)}
        </span>
      </div>
    </div>
  )
}