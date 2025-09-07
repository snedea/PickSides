'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // UI Elements
    ui: {
      submitTopic: "What should we debate?",
      submitTopicTitle: "Submit a Topic",
      submit: "Start Debate",
      vote: "Vote",
      continue: "Continue",
      voteAgain: "Vote Again",
      viewVotes: "View My Votes",
      round: "Round",
      pro: "PRO",
      con: "CON",
      wins: "Wins",
      finalScore: "Final Score",
      confirmVote: "Confirm Vote",
      tapToRead: "Tap text to read full argument • Tap ♡ to vote",
      whoWon: "Who won this debate?",
      swipeNext: "Swipe up for next debate",
      voteRecorded: "Vote Recorded!",
      continueToNext: "Continue to Next Debate",
      reviewVotes: "← Review my round votes",
      yourRoundVotes: "YOUR ROUND VOTES",
      tapAnywhere: "Tap anywhere to return to comparison view",
      roundOf: "of",
      loading: "Loading...",
      debateTopic: "Debate Topic",
      winnerAnnouncement: "Wins!",
      tieAnnouncement: "It's a tie!",
      modelVs: "vs",
      cancel: "Cancel",
      createDebate: "Create Debate",
      generatingDebate: "Generating Debate...",
      chooseModels: "Choose Your Models",
      pleaseEnterTopic: "Please enter a debate topic",
      topicTooShort: "Topic must be at least 10 characters",
      topicTooLong: "Topic must be less than 200 characters",
      exampleTopic: "e.g., Should artificial intelligence be regulated by governments?",
      // Overview screen
      allDebates: "All Debates",
      noDebatesYet: "Nothing here. Why not pick sides?",
      startFirstDebate: "Start your first debate!",
      notStarted: "Not Started",
      inProgress: "In Progress",
      completed: "Completed",
      finalized: "Finalized",
      winsExclamation: "Wins!",
      tieResult: "Tie!",
      // Delete functionality
      deleteDebate: "Delete Debate",
      deleteConfirmation: "Are you sure you want to delete this debate?",
      deleteWarning: "This will permanently remove the debate and all your votes.",
      delete: "Delete",
      keepDebate: "Keep Debate"
    },
    // Round Types
    rounds: {
      opening: "Opening",
      counter: "Counter",
      closing: "Closing"
    },
    // API Prompts
    prompts: {
      systemPrompt: "You are participating in a debate.",
      proStance: "Argue strongly FOR the position:",
      conStance: "Argue strongly AGAINST the position:",
      languageInstruction: ""
    }
  },
  ro: {
    // UI Elements  
    ui: {
      submitTopic: "Despre ce să dezbatem?",
      submitTopicTitle: "Propune un Subiect",
      submit: "Începe Dezbaterea",
      vote: "Votează",
      continue: "Continuă",
      voteAgain: "Votează Din Nou",
      viewVotes: "Vezi Voturile Mele",
      round: "Runda",
      pro: "PENTRU",
      con: "CONTRA",
      wins: "Câștigă",
      finalScore: "Scor Final",
      confirmVote: "Confirmă Votul",
      tapToRead: "Apasă pe text pentru argumentul complet • Apasă ♡ pentru a vota",
      whoWon: "Cine a câștigat această dezbatere?",
      swipeNext: "Glisează pentru următoarea dezbatere",
      voteRecorded: "Vot Înregistrat!",
      continueToNext: "Continuă la Următoarea Dezbatere",
      reviewVotes: "← Revizuiește voturile mele pe runde",
      yourRoundVotes: "VOTURILE TALE PE RUNDE",
      tapAnywhere: "Apasă oriunde pentru a reveni la vizualizarea comparativă",
      roundOf: "din",
      loading: "Se încarcă...",
      debateTopic: "Subiectul Dezbaterii",
      winnerAnnouncement: "Câștigă!",
      tieAnnouncement: "Este egalitate!",
      modelVs: "contra",
      cancel: "Anulează",
      createDebate: "Creează Dezbaterea",
      generatingDebate: "Se generează dezbaterea...",
      chooseModels: "Alege Modelele Tale",
      pleaseEnterTopic: "Te rog introdu un subiect de dezbatere",
      topicTooShort: "Subiectul trebuie să aibă cel puțin 10 caractere",
      topicTooLong: "Subiectul trebuie să aibă mai puțin de 200 de caractere",
      exampleTopic: "ex., Ar trebui să fie inteligența artificială reglementată de guverne?",
      // Overview screen
      allDebates: "Toate Dezbaterile",
      noDebatesYet: "Nimic aici. De ce nu alegi o parte?",
      startFirstDebate: "Începe prima ta dezbatere!",
      notStarted: "Neînceput",
      inProgress: "În Progres",
      completed: "Finalizat",
      finalized: "Completat",
      winsExclamation: "Câștigă!",
      tieResult: "Egalitate!",
      // Delete functionality
      deleteDebate: "Șterge Dezbaterea",
      deleteConfirmation: "Ești sigur că vrei să ștergi această dezbatere?",
      deleteWarning: "Aceasta va elimina permanent dezbaterea și toate voturile tale.",
      delete: "Șterge",
      keepDebate: "Păstrează Dezbaterea"
    },
    // Round Types
    rounds: {
      opening: "Deschidere",
      counter: "Contraargument", 
      closing: "Închidere"
    },
    // API Prompts
    prompts: {
      systemPrompt: "Participi la o dezbatere.",
      proStance: "Argumentează puternic PENTRU poziția:",
      conStance: "Argumentează puternic ÎMPOTRIVA poziției:",
      languageInstruction: "Răspunde în limba română. "
    }
  }
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  // Initialize language from localStorage on client side
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && ['en', 'ro'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ro' : 'en'
    setLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const changeLanguage = (newLang) => {
    if (['en', 'ro'].includes(newLang)) {
      setLanguage(newLang)
      localStorage.setItem('language', newLang)
    }
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: changeLanguage, 
      toggleLanguage, 
      t,
      isRomanian: language === 'ro',
      isEnglish: language === 'en'
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}