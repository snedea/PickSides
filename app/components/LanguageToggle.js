'use client'

import { useLanguage } from '../../contexts/LanguageContext'
import styles from './LanguageToggle.module.css'

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()
  
  return (
    <button
      onClick={toggleLanguage}
      className={styles.languageToggle}
      aria-label={`Switch to ${language === 'en' ? 'Romanian' : 'English'}`}
    >
      <span className={styles.flag}>
        {language === 'en' ? '🇬🇧' : '🇷🇴'}
      </span>
      <span className={styles.code}>
        {language === 'en' ? 'EN' : 'RO'}
      </span>
    </button>
  )
}