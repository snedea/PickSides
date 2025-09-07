'use client'

import { useLanguage } from '../../contexts/LanguageContext'
import DebateTile from './DebateTile'
import styles from './DebateOverview.module.css'

export default function DebateOverview({ 
  debates = [], 
  roundVotes = {}, 
  finalVotes = {}, 
  onDebateSelect,
  onAddTopic,
  onDebateDelete
}) {
  const { t } = useLanguage()
  
  // Handle tile click - navigate to appropriate round/screen
  const handleTileClick = (debate) => {
    const debateRoundVotes = roundVotes[debate.id] || {}
    const finalVote = finalVotes[debate.id]
    const roundVoteCount = Object.keys(debateRoundVotes).length
    
    // Determine where to navigate
    let targetRound = 1
    let targetState = 'round'
    
    if (roundVoteCount === 0) {
      // Not started - go to round 1
      targetRound = 1
      targetState = 'round'
    } else if (roundVoteCount < 3) {
      // In progress - go to next unvoted round
      for (let i = 1; i <= 3; i++) {
        if (!debateRoundVotes[`round${i}`]) {
          targetRound = i
          targetState = 'round'
          break
        }
      }
    } else if (roundVoteCount === 3 && !finalVote) {
      // All rounds complete, no final vote - go to final voting screen
      targetRound = 4
      targetState = 'voting'
    } else {
      // Fully complete - go to results screen
      targetRound = 4
      targetState = 'results'
    }
    
    onDebateSelect(debate, targetRound, targetState)
  }
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t('ui.allDebates')}</h1>
        {debates.length > 0 && (
          <p className={styles.subtitle}>
            {debates.length} {debates.length === 1 ? 'debate' : 'debates'}
          </p>
        )}
      </div>
      
      {/* Empty state */}
      {debates.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎭</div>
          <h2 className={styles.emptyTitle}>{t('ui.noDebatesYet')}</h2>
          <p className={styles.emptySubtitle}>{t('ui.startFirstDebate')}</p>
          <button 
            className={styles.addFirstButton}
            onClick={onAddTopic}
          >
            ➕ {t('ui.createDebate')}
          </button>
        </div>
      ) : (
        /* Debates grid */
        <div className={styles.grid}>
          {debates.map((debate) => (
            <DebateTile
              key={debate.id}
              debate={debate}
              roundVotes={roundVotes[debate.id] || {}}
              finalVote={finalVotes[debate.id]}
              onClick={() => handleTileClick(debate)}
              onDelete={onDebateDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}