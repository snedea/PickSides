'use client'

import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
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

const formatModelPersonaDisplay = (modelId, persona, t) => {
  const modelName = getModelDisplayName(modelId);
  
  if (persona && persona !== 'Default AI' && persona !== 'IA Implicită' && persona.trim() !== '') {
    return `${modelName} ${t('ui.asPersona')} ${persona}`.toUpperCase();
  }
  return modelName.toUpperCase();
};

export default function DebateCard({ debate, onVote, onUnvote, roundNumber, roundWinners }) {
  const [enlargedSide, setEnlargedSide] = useState(null)
  const [showVoteAnimation, setShowVoteAnimation] = useState(false)
  const { t } = useLanguage()


  // Get the single round data (SwipeDebateContainer passes filtered data)
  const currentRound = debate.rounds[0]
  const currentVote = roundWinners[`round${roundNumber}`]

  // Helper function to translate round types
  const getRoundTypeTranslation = (roundType) => {
    const typeMap = {
      'Opening': 'rounds.opening',
      'Counter': 'rounds.counter', 
      'Closing': 'rounds.closing',
      'Deschidere': 'rounds.opening',
      'Contraargument': 'rounds.counter',
      'Închidere': 'rounds.closing'
    }
    return t(typeMap[roundType] || 'rounds.opening')
  }

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
              {formatModelPersonaDisplay(
                sideData.model, 
                enlargedSide === 'pro' ? debate.pro_persona : debate.con_persona, 
                t
              )}
            </h3>
            <span className={`${styles.enlargedStance} ${enlargedSide === 'pro' ? styles.proStance : styles.conStance}`}>
              {enlargedSide === 'pro' ? t('ui.pro') : t('ui.con')} - {t('ui.round')} {roundNumber}
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
          <p>{t('ui.tapAnywhere')}</p>
        </div>
      </div>
    )
  }

  // SPLIT VIEW
  return (
    <div className={styles.debateContainer}>

      <div className={styles.roundsContainer}>
        <div className={styles.round}>
          <div className={styles.roundHeader}>
            <h2>{t('ui.round')} {currentRound.round}: {getRoundTypeTranslation(currentRound.type)}</h2>
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
                    {formatModelPersonaDisplay(debate.pro_model, debate.pro_persona, t)}
                  </div>
                  <h3>{t('ui.pro')}</h3>
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
                    {formatModelPersonaDisplay(debate.con_model, debate.con_persona, t)}
                  </div>
                  <h3>{t('ui.con')}</h3>
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
        <p>{t('ui.tapToRead')}</p>
      </div>
    </div>
  )
}