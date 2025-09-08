'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import styles from './PersonaSelector.module.css'

export default function PersonaSelector({ side, currentPersona, onSelect }) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customPersonas, setCustomPersonas] = useState([])
  const [crowdsourcedPersonas, setCrowdsourcedPersonas] = useState([])
  const [shouldSaveCustom, setShouldSaveCustom] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    era: '',
    occupation: '',
    context: '',
    birth_year: '',
    death_year: ''
  })

  const defaultPersonas = [
    { id: 'default', name: 'Default AI', nameRo: 'IA Implicită', icon: '🤖' },
    { id: 'socrates', name: 'Socrates', nameRo: 'Socrate', icon: '🏛️' },
    { id: 'tzara', name: 'Tristan Tzara', nameRo: 'Tristan Tzara', icon: '🎭' },
    { id: 'rand', name: 'Ayn Rand', nameRo: 'Ayn Rand', icon: '📖' },
    { id: 'einstein', name: 'Albert Einstein', nameRo: 'Albert Einstein', icon: '🧮' },
    { id: 'shakespeare', name: 'Shakespeare', nameRo: 'Shakespeare', icon: '🎬' },
    { id: 'nietzsche', name: 'Nietzsche', nameRo: 'Nietzsche', icon: '⚡' }
  ]

  // Load custom personas from localStorage and crowdsourced from API
  useEffect(() => {
    // Load custom personas from localStorage
    try {
      const saved = localStorage.getItem('custom_personas')
      if (saved) {
        setCustomPersonas(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading custom personas:', error)
    }

    // Load crowdsourced personas from API
    fetchCrowdsourcedPersonas()
  }, [])

  const fetchCrowdsourcedPersonas = async () => {
    try {
      const response = await fetch('/api/personas?limit=20')
      const data = await response.json()
      if (data.success) {
        setCrowdsourcedPersonas(data.personas || [])
      }
    } catch (error) {
      console.error('Error loading crowdsourced personas:', error)
    }
  }

  // Save custom personas to localStorage
  const saveCustomPersonas = (personas) => {
    try {
      localStorage.setItem('custom_personas', JSON.stringify(personas))
      setCustomPersonas(personas)
    } catch (error) {
      console.error('Error saving custom personas:', error)
    }
  }

  const handlePersonaSelect = (persona) => {
    if (persona.id === 'custom') {
      setShowEnhancedForm(true)
      return
    }
    
    const displayName = t('isRomanian') && persona.nameRo ? persona.nameRo : persona.name
    onSelect(side, displayName)
    setIsOpen(false)
  }

  const handleCustomSubmit = () => {
    if (!inputValue.trim()) return
    
    const customPersona = inputValue.trim()
    onSelect(side, customPersona)
    
    // Save to custom personas if requested
    if (shouldSaveCustom) {
      const newCustomPersonas = [...customPersonas, {
        id: `custom_${Date.now()}`,
        name: customPersona,
        icon: '✨'
      }]
      saveCustomPersonas(newCustomPersonas)
    }
    
    // Reset state
    setInputValue('')
    setShowCustomInput(false)
    setShouldSaveCustom(false)
    setIsOpen(false)
  }

  const handleEnhancedSubmit = async () => {
    const { name } = formData
    
    if (!name.trim()) {
      setSubmissionStatus({ type: 'error', message: 'Please enter a name.' })
      return
    }
    
    setIsSubmitting(true)
    setSubmissionStatus({ type: 'info', message: 'Researching historical figure...' })
    
    try {
      const response = await fetch('/api/personas/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim()
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSubmissionStatus({ 
          type: 'success', 
          message: result.message 
        })
        
        // Select the newly created persona
        onSelect(side, result.persona.name)
        
        // Refresh the crowdsourced personas list
        await fetchCrowdsourcedPersonas()
        
        // Close form after a delay
        setTimeout(() => {
          handleCancel()
        }, 2000)
        
      } else {
        if (result.error === 'duplicate') {
          setSubmissionStatus({ 
            type: 'error', 
            message: result.message + ' You can select the existing persona instead.' 
          })
        } else if (result.error === 'quality') {
          setSubmissionStatus({ 
            type: 'error', 
            message: result.message 
          })
        } else if (result.error === 'research') {
          setSubmissionStatus({ 
            type: 'error', 
            message: result.message 
          })
        } else {
          setSubmissionStatus({ 
            type: 'error', 
            message: result.message || 'Failed to create persona. Please try again.' 
          })
        }
      }
    } catch (error) {
      setSubmissionStatus({ 
        type: 'error', 
        message: 'Network error. Please check your connection and try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSubmissionStatus(null) // Clear status when user types
  }

  const handleDeleteCustomPersona = (personaId) => {
    const updated = customPersonas.filter(p => p.id !== personaId)
    saveCustomPersonas(updated)
  }

  const handleCancel = () => {
    setInputValue('')
    setShowCustomInput(false)
    setShowEnhancedForm(false)
    setShouldSaveCustom(false)
    setIsSubmitting(false)
    setSubmissionStatus(null)
    setFormData({
      name: '',
      era: '',
      occupation: '',
      context: '',
      birth_year: '',
      death_year: ''
    })
    setIsOpen(false)
  }

  // Get current persona display name
  const getCurrentPersonaName = () => {
    if (!currentPersona) return t('ui.defaultAI') || 'Default AI'
    
    const defaultPersona = defaultPersonas.find(p => 
      p.name === currentPersona || p.nameRo === currentPersona
    )
    
    if (defaultPersona) {
      return t('isRomanian') && defaultPersona.nameRo ? defaultPersona.nameRo : defaultPersona.name
    }
    
    return currentPersona
  }

  if (showEnhancedForm) {
    return (
      <div className={styles.enhancedForm}>
        <div className={styles.formHeader}>
          <h3>Add Historical Figure</h3>
          <p>AI will research and create a complete personality profile</p>
        </div>
        
        <div className={styles.formGroup}>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && formData.name.trim() && handleEnhancedSubmit()}
            placeholder="Enter any historical figure name (e.g., Winston Churchill, Marie Curie, Leonardo da Vinci)"
            className={styles.input}
            disabled={isSubmitting}
            autoFocus
          />
        </div>
        
        {submissionStatus && (
          <div className={`${styles.status} ${styles[submissionStatus.type]}`}>
            {submissionStatus.message}
          </div>
        )}
        
        <div className={styles.buttonRow}>
          <button 
            type="button"
            onClick={handleEnhancedSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            className={styles.confirmButton}
          >
            {isSubmitting ? 'Researching & Creating...' : 'Research & Create'}
          </button>
          <button 
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }
  
  if (showCustomInput) {
    return (
      <div className={styles.customInput}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
          placeholder={t('ui.enterPersona') || "Enter any person (e.g., 'Shakespeare', 'Elon Musk')"}
          className={styles.input}
          autoFocus
        />
        
        <div className={styles.checkboxRow}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={shouldSaveCustom}
              onChange={(e) => setShouldSaveCustom(e.target.checked)}
            />
            <span>{t('ui.savePersona') || 'Save this persona for future use'}</span>
          </label>
        </div>
        
        <div className={styles.buttonRow}>
          <button 
            type="button"
            onClick={handleCustomSubmit}
            disabled={!inputValue.trim()}
            className={styles.confirmButton}
          >
            {t('ui.setPersona') || 'Set Persona'}
          </button>
          <button 
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            {t('ui.cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.selector}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
      >
        <span className={styles.currentPersona}>{getCurrentPersonaName()}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Default personas */}
          {defaultPersonas.map(persona => (
            <button
              key={persona.id}
              type="button"
              onClick={() => handlePersonaSelect(persona)}
              className={styles.option}
            >
              <span className={styles.icon}>{persona.icon}</span>
              <span className={styles.name}>
                {t('isRomanian') && persona.nameRo ? persona.nameRo : persona.name}
              </span>
            </button>
          ))}
          
          {/* Crowdsourced personas */}
          {crowdsourcedPersonas.length > 0 && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.sectionHeader}>🌟 Community Personas</div>
              {crowdsourcedPersonas.map(persona => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handlePersonaSelect(persona)}
                  className={`${styles.option} ${styles.crowdsourced}`}
                  title={`${persona.era} • ${persona.occupation} • Quality: ${(persona.quality_score * 100).toFixed(0)}%`}
                >
                  <span className={styles.icon}>{persona.icon}</span>
                  <span className={styles.name}>
                    {t('isRomanian') && persona.nameRo ? persona.nameRo : persona.name}
                  </span>
                  <span className={styles.era}>{persona.era}</span>
                </button>
              ))}
            </>
          )}
          
          {/* Custom personas */}
          {customPersonas.length > 0 && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.sectionHeader}>✨ Your Custom</div>
              {customPersonas.map(persona => (
                <div key={persona.id} className={styles.customOption}>
                  <button
                    type="button"
                    onClick={() => handlePersonaSelect(persona)}
                    className={styles.option}
                  >
                    <span className={styles.icon}>{persona.icon}</span>
                    <span className={styles.name}>{persona.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomPersona(persona.id)}
                    className={styles.deleteButton}
                    title={t('ui.deletePersona') || 'Delete persona'}
                  >
                    ×
                  </button>
                </div>
              ))}
            </>
          )}
          
          {/* Add new persona options */}
          <div className={styles.divider}></div>
          <button
            type="button"
            onClick={() => handlePersonaSelect({ id: 'custom' })}
            className={`${styles.option} ${styles.addNew}`}
          >
            <span className={styles.icon}>🧠</span>
            <span className={styles.name}>Add Historical Figure...</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className={`${styles.option} ${styles.quickAdd}`}
          >
            <span className={styles.icon}>✨</span>
            <span className={styles.name}>Quick Custom...</span>
          </button>
        </div>
      )}
    </div>
  )
}