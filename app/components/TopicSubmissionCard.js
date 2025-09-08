'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import PersonaSelector from './PersonaSelector'
import styles from './TopicSubmissionCard.module.css'

const MODELS = [
  { id: 'gpt-4-turbo', name: 'ChatGPT', icon: '🤖' },
  { id: 'claude-3-sonnet', name: 'Claude', icon: '🧠' },
  { id: 'gemini-pro', name: 'Gemini', icon: '✨' }
]

// Available personas for random selection (excluding Default AI)
const DEFAULT_PERSONAS = [
  { id: 'socrates', name: 'Socrates', nameRo: 'Socrate', icon: '🏛️' },
  { id: 'tzara', name: 'Tristan Tzara', nameRo: 'Tristan Tzara', icon: '🎭' },
  { id: 'rand', name: 'Ayn Rand', nameRo: 'Ayn Rand', icon: '📖' },
  { id: 'einstein', name: 'Albert Einstein', nameRo: 'Albert Einstein', icon: '🧮' },
  { id: 'shakespeare', name: 'Shakespeare', nameRo: 'Shakespeare', icon: '🎬' },
  { id: 'nietzsche', name: 'Nietzsche', nameRo: 'Nietzsche', icon: '⚡' }
]

// Utility functions for persona selection
const getPersonaDisplayName = (persona, isRomanian) => {
  return isRomanian && persona.nameRo ? persona.nameRo : persona.name
}

const getAllAvailablePersonas = () => {
  try {
    const customPersonas = JSON.parse(localStorage.getItem('custom_personas') || '[]')
    return [...DEFAULT_PERSONAS, ...customPersonas]
  } catch (error) {
    console.error('Error loading custom personas for random selection:', error)
    return DEFAULT_PERSONAS
  }
}

const selectRandomPersonas = (availablePersonas) => {
  if (availablePersonas.length === 0) return { pro: null, con: null }
  if (availablePersonas.length === 1) {
    const persona = availablePersonas[0]
    return { pro: persona, con: persona } // Same persona if only one available
  }
  
  // Pick random Pro persona
  const proIndex = Math.floor(Math.random() * availablePersonas.length)
  const proPersona = availablePersonas[proIndex]
  
  // Pick random Con persona (different from Pro)
  const remainingPersonas = availablePersonas.filter((_, index) => index !== proIndex)
  const conIndex = Math.floor(Math.random() * remainingPersonas.length)
  const conPersona = remainingPersonas[conIndex]
  
  return { pro: proPersona, con: conPersona }
}

export default function TopicSubmissionCard({ onSubmit, onCancel, isLoading }) {
  const { t, language } = useLanguage()
  const [topic, setTopic] = useState('')
  const [error, setError] = useState('')
  const [proModel, setProModel] = useState('gpt-4-turbo')
  const [conModel, setConModel] = useState('claude-3-sonnet')
  const [proPersona, setProPersona] = useState(null)
  const [conPersona, setConPersona] = useState(null)
  
  // Randomly select personas on component mount
  useEffect(() => {
    const selectRandomPersonasOnLoad = () => {
      const availablePersonas = getAllAvailablePersonas()
      const { pro, con } = selectRandomPersonas(availablePersonas)
      
      if (pro && con) {
        const isRomanian = language === 'ro' || (t('isRomanian') && t('isRomanian') === 'true')
        
        // Set random personas with language-appropriate names
        setProPersona(getPersonaDisplayName(pro, isRomanian))
        setConPersona(getPersonaDisplayName(con, isRomanian))
      }
    }
    
    // Delay slightly to ensure localStorage and language are ready
    const timer = setTimeout(selectRandomPersonasOnLoad, 100)
    return () => clearTimeout(timer)
  }, [language, t]) // Re-run if language changes

  const cycleModel = (current, setter) => {
    const currentIndex = MODELS.findIndex(m => m.id === current)
    const nextIndex = (currentIndex + 1) % MODELS.length
    setter(MODELS[nextIndex].id)
  }

  const handlePersonaSelect = (side, persona) => {
    if (side === 'pro') {
      setProPersona(persona)
    } else {
      setConPersona(persona)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedTopic = topic.trim()
    
    if (!trimmedTopic) {
      setError(t('ui.pleaseEnterTopic'))
      return
    }
    
    if (trimmedTopic.length < 10) {
      setError(t('ui.topicTooShort'))
      return
    }
    
    if (trimmedTopic.length > 200) {
      setError(t('ui.topicTooLong'))
      return
    }
    
    setError('')
    onSubmit({ topic: trimmedTopic, proModel, conModel, proPersona, conPersona })
  }

  const handleInputChange = (e) => {
    setTopic(e.target.value)
    if (error) setError('')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{t('ui.submitTopicTitle')}</h2>
        <p>{t('ui.submitTopic')}</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="topic" className={styles.label}>
            {t('ui.debateTopic')}
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={handleInputChange}
            placeholder={t('ui.exampleTopic')}
            className={`${styles.textarea} ${error ? styles.error : ''}`}
            rows={4}
            disabled={isLoading}
            maxLength={200}
          />
          <div className={styles.charCount}>
            {topic.length}/200
          </div>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.modelSelection}>
          <h3 className={styles.sectionTitle}>{t('ui.chooseModels')}</h3>
          <div className={styles.modelButtons}>
            <div className={`${styles.sideContainer} ${styles.proSide}`}>
              <div className={styles.sideHeader}>
                <span className={styles.sideLabel}>{t('ui.pro')}</span>
              </div>
              <div className={styles.selectors}>
                <button
                  type="button"
                  onClick={() => cycleModel(proModel, setProModel)}
                  className={`${styles.modelButton} ${styles.proButton}`}
                  disabled={isLoading}
                >
                  <span className={styles.modelIcon}>{MODELS.find(m => m.id === proModel).icon}</span>
                  <span className={styles.modelName}>{MODELS.find(m => m.id === proModel).name}</span>
                </button>
                <PersonaSelector
                  side="pro"
                  currentPersona={proPersona}
                  onSelect={handlePersonaSelect}
                />
              </div>
              {proPersona && (
                <div className={styles.personaPreview}>
                  {MODELS.find(m => m.id === proModel).name} {t('ui.asPersona')} {proPersona}
                </div>
              )}
            </div>
            
            <div className={`${styles.sideContainer} ${styles.conSide}`}>
              <div className={styles.sideHeader}>
                <span className={styles.sideLabel}>{t('ui.con')}</span>
              </div>
              <div className={styles.selectors}>
                <button
                  type="button"
                  onClick={() => cycleModel(conModel, setConModel)}
                  className={`${styles.modelButton} ${styles.conButton}`}
                  disabled={isLoading}
                >
                  <span className={styles.modelIcon}>{MODELS.find(m => m.id === conModel).icon}</span>
                  <span className={styles.modelName}>{MODELS.find(m => m.id === conModel).name}</span>
                </button>
                <PersonaSelector
                  side="con"
                  currentPersona={conPersona}
                  onSelect={handlePersonaSelect}
                />
              </div>
              {conPersona && (
                <div className={styles.personaPreview}>
                  {MODELS.find(m => m.id === conModel).name} {t('ui.asPersona')} {conPersona}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.buttons}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isLoading}
          >
{t('ui.cancel')}
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? (
              <span className={styles.loadingText}>
                <span className={styles.spinner} />
{t('ui.generatingDebate')}
              </span>
            ) : (
t('ui.createDebate')
            )}
          </button>
        </div>
      </form>
    </div>
  )
}