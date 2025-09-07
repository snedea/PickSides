'use client'

import { useLanguage } from '../../contexts/LanguageContext'
import styles from './BottomNavBar.module.css'

export default function BottomNavBar({ 
  currentDebate, 
  totalDebates, 
  onAddTopic, 
  onHome 
}) {
  const { language, toggleLanguage } = useLanguage()

  return (
    <div className={styles.bottomNav}>
      {/* Page indicator */}
      <button className={styles.navItem} disabled>
        <span className={styles.pageIndicator}>
          📄 {currentDebate}/{totalDebates}
        </span>
      </button>

      {/* Language toggle */}
      <button 
        className={styles.navItem}
        onClick={toggleLanguage}
        aria-label={`Switch to ${language === 'en' ? 'Romanian' : 'English'}`}
      >
        <span className={styles.languageFlag}>
          {language === 'en' ? '🇬🇧' : '🇷🇴'}
        </span>
      </button>

      {/* Add topic button (center, standout) */}
      <button 
        className={`${styles.navItem} ${styles.addButton}`}
        onClick={onAddTopic}
        aria-label="Add new debate topic"
      >
        <span className={styles.addIcon}>➕</span>
      </button>

      {/* Home button */}
      <button 
        className={styles.navItem}
        onClick={onHome}
        aria-label="Go to home"
      >
        <span className={styles.homeIcon}>🏠</span>
      </button>

      {/* Placeholder for balance */}
      <div className={styles.navItem}>
        <span className={styles.placeholderIcon}>⭐</span>
      </div>
    </div>
  )
}