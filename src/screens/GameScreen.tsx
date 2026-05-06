import { useEffect, useRef, useState } from 'react'
import '../styles/GameScreen.css'

type GameScreenProps = {
  onQuit: () => void
}

type Harpoon = {
  x: number
  tipY: number
  fixed: boolean
  fixedFrames: number
}

type BubbleSize = 'large' | 'medium' | 'small' | 'tiny'

type Bubble = {
  id: number
  size: BubbleSize
  x: number
  y: number
  vx: number
  vy: number
}

const INITIAL_SCORE  = 0
const INITIAL_LIVES  = 3
const GAME_WIDTH     = 480
const GAME_HEIGHT    = 640
const HUD_HEIGHT     = 40
const GROUND_HEIGHT  = 20
const PLAYER_WIDTH   = 30
const PLAYER_HEIGHT  = 50
const PLAYER_SPEED   = 3
const PLAYER_TOP_Y   = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT
const HARPOON_SPEED  = 10
const HARPOON_WIDTH  = 4
const FIXED_FRAMES   = 40
const GRAVITY        = 0.25

const BUBBLE_CONFIG: Record<BubbleSize, { radius: number; speedX: number; bounceVY: number }> = {
  large:  { radius: 48, speedX: 1.5, bounceVY: -13   },
  medium: { radius: 32, speedX: 2.0, bounceVY: -10   },
  small:  { radius: 20, speedX: 2.5, bounceVY: -7.5  },
  tiny:   { radius: 12, speedX: 3.0, bounceVY: -5.5  },
}

const INITIAL_BUBBLES: Bubble[] = [
  { id: 1, size: 'large', x: 120, y: 100, vx:  1.5, vy: 2 },
  { id: 2, size: 'large', x: 360, y: 100, vx: -1.5, vy: 2 },
]

function updateHarpoon(h: Harpoon): Harpoon | null {
  if (h.fixed) {
    const remaining = h.fixedFrames - 1
    return remaining <= 0 ? null : { ...h, fixedFrames: remaining }
  }
  const nextTipY = h.tipY - HARPOON_SPEED
  if (nextTipY <= HUD_HEIGHT) {
    return { ...h, tipY: HUD_HEIGHT, fixed: true, fixedFrames: FIXED_FRAMES }
  }
  return { ...h, tipY: nextTipY }
}

function updateBubble(b: Bubble): Bubble {
  const { radius, speedX, bounceVY } = BUBBLE_CONFIG[b.size]
  const floorY = GAME_HEIGHT - GROUND_HEIGHT - radius
  const ceilY  = HUD_HEIGHT  + radius

  let vy = b.vy + GRAVITY
  let y  = b.y  + vy
  let x  = b.x  + b.vx
  let vx = b.vx

  if (y >= floorY) { y = floorY; vy = bounceVY }
  if (y <= ceilY)  { y = ceilY;  vy = Math.abs(vy) }
  if (x - radius <= 0)          { x = radius;              vx =  speedX }
  if (x + radius >= GAME_WIDTH) { x = GAME_WIDTH - radius; vx = -speedX }

  return { ...b, x, y, vx, vy }
}

function GameScreen({ onQuit }: GameScreenProps) {
  const [playerX, setPlayerX]   = useState((GAME_WIDTH - PLAYER_WIDTH) / 2)
  const [harpoon, setHarpoon]   = useState<Harpoon | null>(null)
  const [bubbles, setBubbles]   = useState<Bubble[]>(INITIAL_BUBBLES)

  const playerXRef  = useRef((GAME_WIDTH - PLAYER_WIDTH) / 2)
  const harpoonRef  = useRef<Harpoon | null>(null)
  const bubblesRef  = useRef<Bubble[]>(INITIAL_BUBBLES)
  const keysRef     = useRef<Set<string>>(new Set())

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ') e.preventDefault()
      keysRef.current.add(e.key)
      if (e.key === 'Escape') onQuit()
      if (e.key === ' ' && harpoonRef.current === null) {
        const h: Harpoon = {
          x: playerXRef.current + PLAYER_WIDTH / 2,
          tipY: PLAYER_TOP_Y,
          fixed: false,
          fixedFrames: 0,
        }
        harpoonRef.current = h
        setHarpoon(h)
      }
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
      // 플레이어 이동
      let x = playerXRef.current
      if (keysRef.current.has('ArrowLeft'))  x -= PLAYER_SPEED
      if (keysRef.current.has('ArrowRight')) x += PLAYER_SPEED
      x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, x))
      if (x !== playerXRef.current) {
        playerXRef.current = x
        setPlayerX(x)
      }

      // 작살 업데이트
      if (harpoonRef.current !== null) {
        const next = updateHarpoon(harpoonRef.current)
        harpoonRef.current = next
        setHarpoon(next)
      }

      // 버블 업데이트
      const nextBubbles = bubblesRef.current.map(updateBubble)
      bubblesRef.current = nextBubbles
      setBubbles(nextBubbles)

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

      {bubbles.map(b => {
        const { radius } = BUBBLE_CONFIG[b.size]
        return (
          <div
            key={b.id}
            className={`bubble bubble--${b.size}`}
            style={{
              left:   b.x - radius,
              top:    b.y - radius,
              width:  radius * 2,
              height: radius * 2,
            }}
          />
        )
      })}

      {harpoon && (
        <div
          className={`harpoon${harpoon.fixed ? ' harpoon--fixed' : ''}`}
          style={{
            left:   harpoon.x - HARPOON_WIDTH / 2,
            top:    harpoon.tipY,
            height: PLAYER_TOP_Y - harpoon.tipY,
          }}
        />
      )}

      <div className="player" style={{ left: playerX }} />

      <div className="ground" />

      <span className="esc-hint">ESC: 타이틀</span>
    </div>
  )
}

export default GameScreen
