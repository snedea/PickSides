import SwipeDebateContainer from './components/SwipeDebateContainer'
import { sampleDebates } from './data/sampleDebates'

export default function Home() {
  return <SwipeDebateContainer debates={sampleDebates} />
}