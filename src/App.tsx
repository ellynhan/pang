import { useState } from 'react'
import MainScreen from './screens/MainScreen'

type Screen = 'main' // Phase 2 이후: | 'game' | 'gameover'

function App() {
  const [screen, setScreen] = useState<Screen>('main')
  const [highScore] = useState(0)

  function handleStart() {
    alert('게임 화면은 Phase 2에서 구현됩니다.')
    setScreen('main')
  }

  return (
    <div className="app">
      <div className="game-screen">
        {screen === 'main' && (
          <MainScreen onStart={handleStart} highScore={highScore} />
        )}
      </div>
    </div>
  )
}

export default App
