import { useEffect, useRef, useState } from 'react'
import '../styles/GameScreen.css'

type GameScreenProps = {
  onQuit: () => void
}

const INITIAL_SCORE = 0
const INITIAL_LIVES = 3
const GAME_WIDTH    = 480
const PLAYER_WIDTH  = 30
const PLAYER_SPEED  = 3

function GameScreen({ onQuit }: GameScreenProps) {
  const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2)
  const playerXRef = useRef((GAME_WIDTH - PLAYER_WIDTH) / 2)
  const keysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key)
      if (e.key === 'Escape') onQuit()
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [onQuit])

  useEffect(() => {
    let rafId: number

    function loop() {
      let x = playerXRef.current
      if (keysRef.current.has('ArrowLeft'))  x -= PLAYER_SPEED
      if (keysRef.current.has('ArrowRight')) x += PLAYER_SPEED
      x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, x))

      if (x !== playerXRef.current) {
        playerXRef.current = x
        setPlayerX(x)
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

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

      <div className="player" style={{ left: playerX }} />

      <div className="ground" />

      <span className="esc-hint">ESC: 타이틀</span>
    </div>
  )
}

export default GameScreen
