import styles from './DebateCard.module.css'

export default function DebateCard({ debate }) {
  // Get the single round data (SwipeDebateContainer passes filtered data)
  const currentRound = debate.rounds[0]

  return (
    <div className={styles.debateContainer}>
      <div className={styles.roundsContainer}>
        <div className={styles.round}>
          <div className={styles.roundHeader}>
            <h2>Round {currentRound.round}: {currentRound.type}</h2>
          </div>
          
          <div className={styles.argumentsSplit}>
            <div className={styles.proSide}>
              <div className={`${styles.sideHeader} ${styles.proHeader}`}>
                <h3>PRO</h3>
              </div>
              <div className={`${styles.tldr} ${styles.proTldr}`}>
                {currentRound.proTldr}
              </div>
              <div className={styles.argumentText}>
                {currentRound.pro}
              </div>
            </div>
            
            <div className={styles.conSide}>
              <div className={`${styles.sideHeader} ${styles.conHeader}`}>
                <h3>CON</h3>
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
  )
}