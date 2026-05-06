import { useState } from 'react'
import GameScreen from './screens/GameScreen'
import MainScreen from './screens/MainScreen'

type Screen = 'main' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('main')
  const [highScore] = useState(0)

  return (
    <div className="app">
      <div className="game-screen">
        {screen === 'main' && (
          <MainScreen onStart={() => setScreen('game')} highScore={highScore} />
        )}
        {screen === 'game' && (
          <GameScreen onQuit={() => setScreen('main')} />
        )}
      </div>
    </div>
  )
}

export default App
