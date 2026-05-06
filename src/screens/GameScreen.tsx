import { useEffect } from 'react'
import '../styles/GameScreen.css'

type GameScreenProps = {
  onQuit: () => void
}

const INITIAL_SCORE = 0
const INITIAL_LIVES = 3

function GameScreen({ onQuit }: GameScreenProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onQuit()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onQuit])

  return (
    <div className="game-screen-inner">
      <div className="hud">
        <span>SCORE {String(INITIAL_SCORE).padStart(5, '0')}</span>
        <div className="hud__lives">
          {Array.from({ length: INITIAL_LIVES }, (_, i) => (
            <span key={i}>♥</span>
          ))}
        </div>
      </div>

      <div className="player" />

      <div className="ground" />

      <span className="esc-hint">ESC: 타이틀</span>
    </div>
  )
}

export default GameScreen
