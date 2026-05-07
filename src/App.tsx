import { useState, useEffect } from 'react'
import GameScreen from './screens/GameScreen'
import MainScreen from './screens/MainScreen'

type Screen = 'main' | 'game'

const GAME_W = 480
const GAME_H = 640

function App() {
  const [screen, setScreen] = useState<Screen>('main')
  const [highScore, setHighScore] = useState(0)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function updateScale() {
      setScale(Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  function handleScoreUpdate(score: number) {
    setHighScore(prev => Math.max(prev, score))
  }

  return (
    <div className="app">
      <div style={{ width: GAME_W * scale, height: GAME_H * scale, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div
          className="game-screen"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {screen === 'main' && (
            <MainScreen onStart={() => setScreen('game')} highScore={highScore} />
          )}
          {screen === 'game' && (
            <GameScreen
              onQuit={() => setScreen('main')}
              onScoreUpdate={handleScoreUpdate}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
