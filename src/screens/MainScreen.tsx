import { useEffect, useState } from 'react'
import MenuButton from '../components/MenuButton'
import '../styles/MainScreen.css'

type MainScreenProps = {
  onStart: () => void
  highScore: number
}

const MENU_ITEMS = ['GAME START', '종  료'] as const

function MainScreen({ onStart, highScore }: MainScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  function handleQuit() {
    if (window.confirm('게임을 종료하시겠습니까?')) {
      window.close()
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowUp') {
        setSelectedIndex(i => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length)
      } else if (e.key === 'ArrowDown') {
        setSelectedIndex(i => (i + 1) % MENU_ITEMS.length)
      } else if (e.key === 'Enter') {
        if (selectedIndex === 0) onStart()
        else handleQuit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, onStart])

  return (
    <div className="main-screen">
      <h1 className="main-screen__logo">PANG</h1>

      <div className="main-screen__buttons">
        <MenuButton
          label={MENU_ITEMS[0]}
          onClick={onStart}
          isSelected={selectedIndex === 0}
        />
        <MenuButton
          label={MENU_ITEMS[1]}
          onClick={handleQuit}
          isSelected={selectedIndex === 1}
        />
      </div>

      <div className="main-screen__score">
        HIGH SCORE
        <span>{String(highScore).padStart(5, '0')}</span>
      </div>
    </div>
  )
}

export default MainScreen
