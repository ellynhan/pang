import { useEffect, useRef, useState } from 'react'
import '../styles/GameScreen.css'

type GameScreenProps = {
  onQuit: () => void
}

type GameStatus = 'playing' | 'stageclear' | 'gameover'

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

const INITIAL_LIVES      = 3
const GAME_WIDTH         = 480
const GAME_HEIGHT        = 640
const HUD_HEIGHT         = 40
const GROUND_HEIGHT      = 20
const PLAYER_WIDTH       = 30
const PLAYER_HEIGHT      = 50
const PLAYER_SPEED       = 3
const PLAYER_TOP_Y       = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT
const PLAYER_INIT_X      = (GAME_WIDTH - PLAYER_WIDTH) / 2
const HARPOON_SPEED      = 10
const HARPOON_WIDTH      = 4
const FIXED_FRAMES       = 40
const GRAVITY            = 0.25
const INVINCIBLE_FRAMES  = 120
const CLEAR_FRAMES       = 120

// bounceVY 기준 최고점 (GRAVITY=0.25 기준):
//   large  -15 → 450px 상승 → y=572-450=122 (화면 상단 근처)
//   medium -13 → 338px 상승 → y=588-338=250
//   small  -10 → 200px 상승 → y=600-200=400
//   tiny    -7 →  98px 상승 → y=608-98=510
const BUBBLE_CONFIG: Record<BubbleSize, { radius: number; speedX: number; bounceVY: number }> = {
  large:  { radius: 48, speedX: 1.5, bounceVY: -15  },
  medium: { radius: 32, speedX: 2.0, bounceVY: -13  },
  small:  { radius: 20, speedX: 2.5, bounceVY: -10  },
  tiny:   { radius: 12, speedX: 3.0, bounceVY: -7   },
}

const NEXT_SIZE: Partial<Record<BubbleSize, BubbleSize>> = {
  large:  'medium',
  medium: 'small',
  small:  'tiny',
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

function isHarpoonHittingBubble(h: Harpoon, b: Bubble): boolean {
  const { radius } = BUBBLE_CONFIG[b.size]
  const cy = Math.max(h.tipY, Math.min(PLAYER_TOP_Y, b.y))
  const dx = h.x - b.x
  const dy = cy  - b.y
  return dx * dx + dy * dy < radius * radius
}

function splitBubble(hit: Bubble, nextId: () => number): Bubble[] {
  const nextSize = NEXT_SIZE[hit.size]
  if (!nextSize) return []
  const { speedX, bounceVY } = BUBBLE_CONFIG[nextSize]
  return [
    { id: nextId(), size: nextSize, x: hit.x, y: hit.y, vx: -speedX, vy: bounceVY },
    { id: nextId(), size: nextSize, x: hit.x, y: hit.y, vx:  speedX, vy: bounceVY },
  ]
}

function isPlayerHitByBubble(px: number, b: Bubble): boolean {
  const { radius } = BUBBLE_CONFIG[b.size]
  const cx = Math.max(px, Math.min(px + PLAYER_WIDTH, b.x))
  const cy = Math.max(PLAYER_TOP_Y, Math.min(PLAYER_TOP_Y + PLAYER_HEIGHT, b.y))
  const dx = cx - b.x
  const dy = cy - b.y
  return dx * dx + dy * dy < radius * radius
}

function GameScreen({ onQuit }: GameScreenProps) {
  const [playerX, setPlayerX]                   = useState(PLAYER_INIT_X)
  const [harpoon, setHarpoon]                   = useState<Harpoon | null>(null)
  const [bubbles, setBubbles]                   = useState<Bubble[]>(INITIAL_BUBBLES)
  const [lives, setLives]                       = useState(INITIAL_LIVES)
  const [invincibleFrames, setInvincibleFrames] = useState(0)
  const [gameStatus, setGameStatus]             = useState<GameStatus>('playing')

  const playerXRef    = useRef(PLAYER_INIT_X)
  const harpoonRef    = useRef<Harpoon | null>(null)
  const bubblesRef    = useRef<Bubble[]>(INITIAL_BUBBLES)
  const livesRef      = useRef(INITIAL_LIVES)
  const invincibleRef = useRef(0)
  const gameStatusRef = useRef<GameStatus>('playing')
  const clearTimerRef = useRef(0)
  const keysRef       = useRef<Set<string>>(new Set())
  const nextIdRef     = useRef(100)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ') e.preventDefault()

      if (e.key === 'Enter' && gameStatusRef.current === 'gameover') {
        onQuit()
        return
      }
      if (e.key === 'Escape') { onQuit(); return }

      keysRef.current.add(e.key)

      if (e.key === ' ' && harpoonRef.current === null && gameStatusRef.current === 'playing') {
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
      // 게임 오버: 모든 로직 정지
      if (gameStatusRef.current === 'gameover') {
        rafId = requestAnimationFrame(loop)
        return
      }

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

      // 스테이지 클리어 처리 (playing 중에만 판정)
      if (gameStatusRef.current === 'playing' && bubblesRef.current.length === 0) {
        gameStatusRef.current = 'stageclear'
        setGameStatus('stageclear')
        clearTimerRef.current = CLEAR_FRAMES
      }

      // 클리어 타이머 (stageclear 중)
      if (gameStatusRef.current === 'stageclear') {
        clearTimerRef.current -= 1
        if (clearTimerRef.current <= 0) {
          bubblesRef.current = [...INITIAL_BUBBLES]
          setBubbles(bubblesRef.current)
          harpoonRef.current = null
          setHarpoon(null)
          playerXRef.current = PLAYER_INIT_X
          setPlayerX(PLAYER_INIT_X)
          gameStatusRef.current = 'playing'
          setGameStatus('playing')
        }
        rafId = requestAnimationFrame(loop)
        return
      }

      // 작살-버블 충돌 판정
      if (harpoonRef.current !== null) {
        const hitIndex = bubblesRef.current.findIndex(b =>
          isHarpoonHittingBubble(harpoonRef.current!, b)
        )
        if (hitIndex !== -1) {
          const hit     = bubblesRef.current[hitIndex]
          const rest    = bubblesRef.current.filter((_, i) => i !== hitIndex)
          const spawned = splitBubble(hit, () => nextIdRef.current++)
          bubblesRef.current = [...rest, ...spawned]
          setBubbles(bubblesRef.current)
          harpoonRef.current = null
          setHarpoon(null)
        }
      }

      // 무적 프레임 차감
      if (invincibleRef.current > 0) {
        invincibleRef.current -= 1
        setInvincibleFrames(invincibleRef.current)
      }

      // 플레이어-버블 충돌 판정
      if (invincibleRef.current === 0 && livesRef.current > 0) {
        const hit = bubblesRef.current.some(b => isPlayerHitByBubble(playerXRef.current, b))
        if (hit) {
          livesRef.current -= 1
          setLives(livesRef.current)
          if (livesRef.current <= 0) {
            gameStatusRef.current = 'gameover'
            setGameStatus('gameover')
          } else {
            invincibleRef.current = INVINCIBLE_FRAMES
            setInvincibleFrames(INVINCIBLE_FRAMES)
          }
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const isBlinking = invincibleFrames > 0 && Math.floor(invincibleFrames / 6) % 2 === 0

  return (
    <div className="game-screen-inner">
      <div className="hud">
        <span>SCORE 00000</span>
        <div className="hud__lives">
          {Array.from({ length: lives }, (_, i) => (
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

      <div
        className="player"
        style={{ left: playerX, opacity: isBlinking ? 0.25 : 1 }}
      />

      <div className="ground" />

      {gameStatus === 'stageclear' && (
        <div className="overlay overlay--clear">
          <p className="overlay__title">STAGE CLEAR!</p>
        </div>
      )}

      {gameStatus === 'gameover' && (
        <div className="overlay overlay--gameover">
          <p className="overlay__title">GAME OVER</p>
          <p className="overlay__hint">PRESS ENTER</p>
        </div>
      )}

      <span className="esc-hint">ESC: 타이틀</span>
    </div>
  )
}

export default GameScreen
