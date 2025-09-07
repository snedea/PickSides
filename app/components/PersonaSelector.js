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
  const [shouldSaveCustom, setShouldSaveCustom] = useState(false)

  const defaultPersonas = [
    { id: 'default', name: 'Default AI', nameRo: 'IA Implicită', icon: '🤖' },
    { id: 'socrates', name: 'Socrates', nameRo: 'Socrate', icon: '🏛️' },
    { id: 'tzara', name: 'Tristan Tzara', nameRo: 'Tristan Tzara', icon: '🎭' },
    { id: 'rand', name: 'Ayn Rand', nameRo: 'Ayn Rand', icon: '📖' },
    { id: 'einstein', name: 'Albert Einstein', nameRo: 'Albert Einstein', icon: '🧮' },
    { id: 'shakespeare', name: 'Shakespeare', nameRo: 'Shakespeare', icon: '🎬' },
    { id: 'nietzsche', name: 'Nietzsche', nameRo: 'Nietzsche', icon: '⚡' }
  ]

  // Load custom personas from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_personas')
      if (saved) {
        setCustomPersonas(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading custom personas:', error)
    }
  }, [])

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
      setShowCustomInput(true)
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

  const handleDeleteCustomPersona = (personaId) => {
    const updated = customPersonas.filter(p => p.id !== personaId)
    saveCustomPersonas(updated)
  }

  const handleCancel = () => {
    setInputValue('')
    setShowCustomInput(false)
    setShouldSaveCustom(false)
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
            onClick={handleCustomSubmit}
            disabled={!inputValue.trim()}
            className={styles.confirmButton}
          >
            {t('ui.setPersona') || 'Set Persona'}
          </button>
          <button 
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
              onClick={() => handlePersonaSelect(persona)}
              className={styles.option}
            >
              <span className={styles.icon}>{persona.icon}</span>
              <span className={styles.name}>
                {t('isRomanian') && persona.nameRo ? persona.nameRo : persona.name}
              </span>
            </button>
          ))}
          
          {/* Custom personas */}
          {customPersonas.length > 0 && (
            <>
              <div className={styles.divider}></div>
              {customPersonas.map(persona => (
                <div key={persona.id} className={styles.customOption}>
                  <button
                    onClick={() => handlePersonaSelect(persona)}
                    className={styles.option}
                  >
                    <span className={styles.icon}>{persona.icon}</span>
                    <span className={styles.name}>{persona.name}</span>
                  </button>
                  <button
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
          
          {/* Custom option */}
          <div className={styles.divider}></div>
          <button
            onClick={() => handlePersonaSelect({ id: 'custom' })}
            className={styles.option}
          >
            <span className={styles.icon}>✨</span>
            <span className={styles.name}>{t('ui.custom') || 'Custom...'}</span>
          </button>
        </div>
      )}
    </div>
  )
}