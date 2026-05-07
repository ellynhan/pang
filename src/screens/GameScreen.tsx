import { useEffect, useRef, useState } from 'react'
import '../styles/GameScreen.css'

type GameScreenProps = {
  onQuit: () => void
  onScoreUpdate: (score: number) => void
}

type GameStatus = 'playing' | 'stageclear' | 'gameover'

type Harpoon = {
  id: number
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

type Platform = {
  x: number
  y: number
  width: number
}

type ItemType = 'doubleWire' | 'clock' | 'dynamite' | 'shield' | 'oneUp'

type Item = {
  id: number
  type: ItemType
  x: number
  y: number
  vy: number
}

type StageConfig = {
  bubbles: Omit<Bubble, 'id'>[]
  platforms: Platform[]
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
const ITEM_DROP_CHANCE   = 0.3
const ITEM_RADIUS        = 14
const ITEM_FALL_SPEED    = 2
const ITEM_FLOOR_Y       = GAME_HEIGHT - GROUND_HEIGHT - ITEM_RADIUS
const CLOCK_FRAMES       = 120

const ITEM_TYPES: ItemType[] = ['doubleWire', 'clock', 'dynamite', 'shield', 'oneUp']

const ITEM_SYMBOL: Record<ItemType, string> = {
  doubleWire: '✦',
  clock:      '⏱',
  dynamite:   '✸',
  shield:     '◈',
  oneUp:      '♥',
}

const BUBBLE_CONFIG: Record<BubbleSize, { radius: number; speedX: number; bounceVY: number }> = {
  large:  { radius: 48, speedX: 1.5, bounceVY: -15  },
  medium: { radius: 32, speedX: 2.0, bounceVY: -13  },
  small:  { radius: 20, speedX: 2.5, bounceVY: -10  },
  tiny:   { radius: 12, speedX: 3.0, bounceVY: -7   },
}

const BUBBLE_SCORE: Record<BubbleSize, number> = {
  large:  100,
  medium: 200,
  small:  400,
  tiny:   800,
}

const NEXT_SIZE: Partial<Record<BubbleSize, BubbleSize>> = {
  large:  'medium',
  medium: 'small',
  small:  'tiny',
}

const STAGES: StageConfig[] = [
  {
    bubbles: [
      { size: 'large', x: 120, y: 100, vx:  1.5, vy: 2 },
      { size: 'large', x: 360, y: 100, vx: -1.5, vy: 2 },
    ],
    platforms: [],
  },
  {
    bubbles: [
      { size: 'large',  x: 240, y: 100, vx:  1.5, vy: 2 },
      { size: 'medium', x: 100, y: 150, vx: -2.0, vy: 2 },
      { size: 'medium', x: 380, y: 150, vx:  2.0, vy: 2 },
    ],
    platforms: [{ x: 160, y: 430, width: 160 }],
  },
  {
    bubbles: [
      { size: 'medium', x: 100, y: 100, vx:  2.0, vy: 2 },
      { size: 'medium', x: 380, y: 100, vx: -2.0, vy: 2 },
      { size: 'small',  x: 200, y: 200, vx:  2.5, vy: 2 },
      { size: 'small',  x: 280, y: 200, vx: -2.5, vy: 2 },
    ],
    platforms: [
      { x:  60, y: 400, width: 120 },
      { x: 300, y: 460, width: 120 },
    ],
  },
]

function makeBubbles(configs: Omit<Bubble, 'id'>[], idRef: { current: number }): Bubble[] {
  return configs.map(b => ({ ...b, id: idRef.current++ }))
}

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

function updateBubble(b: Bubble, platforms: Platform[]): Bubble {
  const { radius, speedX, bounceVY } = BUBBLE_CONFIG[b.size]
  const floorY = GAME_HEIGHT - GROUND_HEIGHT - radius
  const ceilY  = HUD_HEIGHT  + radius

  let vy = b.vy + GRAVITY
  let y  = b.y  + vy
  let x  = b.x  + b.vx
  let vx = b.vx

  if (y >= floorY) { y = floorY; vy = bounceVY }

  for (const p of platforms) {
    if (
      b.y + radius < p.y  &&
      y   + radius >= p.y &&
      x   + radius >  p.x &&
      x   - radius <  p.x + p.width
    ) {
      y = p.y - radius
      vy = bounceVY
      break
    }
  }

  if (y <= ceilY)  { y = ceilY; vy = Math.abs(vy) }
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

function isPlayerPickingItem(px: number, item: Item): boolean {
  const cx = Math.max(px, Math.min(px + PLAYER_WIDTH, item.x))
  const cy = Math.max(PLAYER_TOP_Y, Math.min(PLAYER_TOP_Y + PLAYER_HEIGHT, item.y))
  const dx = cx - item.x
  const dy = cy - item.y
  return dx * dx + dy * dy < ITEM_RADIUS * ITEM_RADIUS
}

const idCounter = { current: 100 }

function GameScreen({ onQuit, onScoreUpdate }: GameScreenProps) {
  const [playerX, setPlayerX]                   = useState(PLAYER_INIT_X)
  const [harpoons, setHarpoons]                 = useState<Harpoon[]>([])
  const [bubbles, setBubbles]                   = useState<Bubble[]>(() => makeBubbles(STAGES[0].bubbles, idCounter))
  const [platforms, setPlatforms]               = useState<Platform[]>(STAGES[0].platforms)
  const [items, setItems]                       = useState<Item[]>([])
  const [lives, setLives]                       = useState(INITIAL_LIVES)
  const [score, setScore]                       = useState(0)
  const [stageNumber, setStageNumber]           = useState(1)
  const [invincibleFrames, setInvincibleFrames] = useState(0)
  const [gameStatus, setGameStatus]             = useState<GameStatus>('playing')

  const playerXRef      = useRef(PLAYER_INIT_X)
  const harpoonsRef     = useRef<Harpoon[]>([])
  const bubblesRef      = useRef<Bubble[]>(makeBubbles(STAGES[0].bubbles, idCounter))
  const platformsRef    = useRef<Platform[]>(STAGES[0].platforms)
  const itemsRef        = useRef<Item[]>([])
  const livesRef        = useRef(INITIAL_LIVES)
  const scoreRef        = useRef(0)
  const stageRef        = useRef(1)
  const invincibleRef   = useRef(0)
  const gameStatusRef   = useRef<GameStatus>('playing')
  const clearTimerRef   = useRef(0)
  const clockFramesRef  = useRef(0)
  const doubleWireRef   = useRef(false)
  const shieldRef       = useRef(false)
  const keysRef         = useRef<Set<string>>(new Set())
  const nextIdRef       = useRef(200)

  function fireHarpoon() {
    if (gameStatusRef.current !== 'playing') return
    if (doubleWireRef.current) {
      if (harpoonsRef.current.length > 0) return
      const left: Harpoon  = { id: nextIdRef.current++, x: playerXRef.current + 6,                   tipY: PLAYER_TOP_Y, fixed: false, fixedFrames: 0 }
      const right: Harpoon = { id: nextIdRef.current++, x: playerXRef.current + PLAYER_WIDTH - 6,     tipY: PLAYER_TOP_Y, fixed: false, fixedFrames: 0 }
      harpoonsRef.current = [left, right]
    } else {
      if (harpoonsRef.current.length > 0) return
      const h: Harpoon = { id: nextIdRef.current++, x: playerXRef.current + PLAYER_WIDTH / 2, tipY: PLAYER_TOP_Y, fixed: false, fixedFrames: 0 }
      harpoonsRef.current = [h]
    }
    setHarpoons([...harpoonsRef.current])
  }

  function applyItem(type: ItemType) {
    if (type === 'doubleWire') { doubleWireRef.current = true }
    if (type === 'clock')      { clockFramesRef.current = CLOCK_FRAMES }
    if (type === 'shield')     { shieldRef.current = true }
    if (type === 'oneUp') {
      livesRef.current += 1
      setLives(livesRef.current)
    }
    if (type === 'dynamite') {
      const pts = bubblesRef.current.reduce((sum, b) => sum + BUBBLE_SCORE[b.size], 0)
      scoreRef.current += pts
      setScore(scoreRef.current)
      bubblesRef.current = []
      setBubbles([])
      itemsRef.current = []
      setItems([])
    }
  }

  function resetStageEffects() {
    doubleWireRef.current  = false
    clockFramesRef.current = 0
    shieldRef.current      = false
    harpoonsRef.current    = []
    setHarpoons([])
    itemsRef.current = []
    setItems([])
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ') e.preventDefault()
      if (e.key === 'Enter' && gameStatusRef.current === 'gameover') { onQuit(); return }
      if (e.key === 'Escape') { onQuit(); return }
      keysRef.current.add(e.key)
      if (e.key === ' ') fireHarpoon()
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
      const nextHarpoons = harpoonsRef.current
        .map(h => updateHarpoon(h))
        .filter((h): h is Harpoon => h !== null)
      harpoonsRef.current = nextHarpoons
      setHarpoons([...nextHarpoons])

      // 버블 업데이트 (시계 효과 중 정지)
      if (clockFramesRef.current > 0) {
        clockFramesRef.current -= 1
      } else {
        const nextBubbles = bubblesRef.current.map(b => updateBubble(b, platformsRef.current))
        bubblesRef.current = nextBubbles
        setBubbles(nextBubbles)
      }

      // 아이템 낙하 업데이트
      const nextItems = itemsRef.current
        .map(item => {
          const y = item.y + item.vy
          return y >= ITEM_FLOOR_Y ? null : { ...item, y }
        })
        .filter((item): item is Item => item !== null)
      itemsRef.current = nextItems
      setItems([...nextItems])

      // 스테이지 클리어
      if (gameStatusRef.current === 'playing' && bubblesRef.current.length === 0) {
        gameStatusRef.current = 'stageclear'
        setGameStatus('stageclear')
        clearTimerRef.current = CLEAR_FRAMES
        onScoreUpdate(scoreRef.current)
      }

      // 클리어 타이머
      if (gameStatusRef.current === 'stageclear') {
        clearTimerRef.current -= 1
        if (clearTimerRef.current <= 0) {
          const nextStage = (stageRef.current % STAGES.length) + 1
          stageRef.current = nextStage
          setStageNumber(nextStage)
          const cfg = STAGES[nextStage - 1]
          bubblesRef.current = makeBubbles(cfg.bubbles, nextIdRef)
          platformsRef.current = cfg.platforms
          setBubbles(bubblesRef.current)
          setPlatforms(platformsRef.current)
          playerXRef.current = PLAYER_INIT_X
          setPlayerX(PLAYER_INIT_X)
          resetStageEffects()
          gameStatusRef.current = 'playing'
          setGameStatus('playing')
        }
        rafId = requestAnimationFrame(loop)
        return
      }

      // 작살-버블 충돌
      for (const harpoon of harpoonsRef.current) {
        const hitIndex = bubblesRef.current.findIndex(b => isHarpoonHittingBubble(harpoon, b))
        if (hitIndex !== -1) {
          const hit     = bubblesRef.current[hitIndex]
          const rest    = bubblesRef.current.filter((_, i) => i !== hitIndex)
          const spawned = splitBubble(hit, () => nextIdRef.current++)
          bubblesRef.current = [...rest, ...spawned]
          setBubbles(bubblesRef.current)
          harpoonsRef.current = harpoonsRef.current.filter(h => h.id !== harpoon.id)
          setHarpoons([...harpoonsRef.current])
          scoreRef.current += BUBBLE_SCORE[hit.size]
          setScore(scoreRef.current)

          // tiny 소멸 시 아이템 드롭
          if (hit.size === 'tiny' && Math.random() < ITEM_DROP_CHANCE) {
            const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)]
            const newItem: Item = { id: nextIdRef.current++, type, x: hit.x, y: hit.y, vy: ITEM_FALL_SPEED }
            itemsRef.current = [...itemsRef.current, newItem]
            setItems([...itemsRef.current])
          }
        }
      }

      // 무적 차감
      if (invincibleRef.current > 0) {
        invincibleRef.current -= 1
        setInvincibleFrames(invincibleRef.current)
      }

      // 플레이어-버블 충돌
      if (invincibleRef.current === 0 && livesRef.current > 0) {
        const hit = bubblesRef.current.some(b => isPlayerHitByBubble(playerXRef.current, b))
        if (hit) {
          if (shieldRef.current) {
            shieldRef.current = false
            invincibleRef.current = INVINCIBLE_FRAMES
            setInvincibleFrames(INVINCIBLE_FRAMES)
          } else {
            livesRef.current -= 1
            setLives(livesRef.current)
            if (livesRef.current <= 0) {
              gameStatusRef.current = 'gameover'
              setGameStatus('gameover')
              onScoreUpdate(scoreRef.current)
            } else {
              invincibleRef.current = INVINCIBLE_FRAMES
              setInvincibleFrames(INVINCIBLE_FRAMES)
            }
          }
        }
      }

      // 플레이어-아이템 충돌
      const pickedIds = new Set<number>()
      for (const item of itemsRef.current) {
        if (isPlayerPickingItem(playerXRef.current, item)) {
          pickedIds.add(item.id)
          applyItem(item.type)
        }
      }
      if (pickedIds.size > 0) {
        itemsRef.current = itemsRef.current.filter(i => !pickedIds.has(i.id))
        setItems([...itemsRef.current])
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [onScoreUpdate])

  const isBlinking = invincibleFrames > 0 && Math.floor(invincibleFrames / 6) % 2 === 0

  return (
    <div className="game-root">
    <div className="game-screen-inner">
      <div className="hud">
        <span>SCORE {String(score).padStart(5, '0')}</span>
        <span>STAGE {stageNumber}</span>
        <div className="hud__lives">
          {Array.from({ length: lives }, (_, i) => (
            <span key={i}>♥</span>
          ))}
        </div>
      </div>

      {platforms.map((p, i) => (
        <div key={i} className="platform" style={{ left: p.x, top: p.y, width: p.width }} />
      ))}

      {bubbles.map(b => {
        const { radius } = BUBBLE_CONFIG[b.size]
        return (
          <div
            key={b.id}
            className={`bubble bubble--${b.size}`}
            style={{ left: b.x - radius, top: b.y - radius, width: radius * 2, height: radius * 2 }}
          />
        )
      })}

      {harpoons.map(h => (
        <div
          key={h.id}
          className={`harpoon${h.fixed ? ' harpoon--fixed' : ''}`}
          style={{ left: h.x - HARPOON_WIDTH / 2, top: h.tipY, height: PLAYER_TOP_Y - h.tipY }}
        />
      ))}

      {items.map(item => (
        <div
          key={item.id}
          className={`item item--${item.type}`}
          style={{ left: item.x - ITEM_RADIUS, top: item.y - ITEM_RADIUS }}
        >
          {ITEM_SYMBOL[item.type]}
        </div>
      ))}

      <div className="player" style={{ left: playerX, opacity: isBlinking ? 0.25 : 1 }} />

      <div className="ground" />

      {gameStatus === 'stageclear' && (
        <div className="overlay overlay--clear">
          <p className="overlay__title">STAGE CLEAR!</p>
        </div>
      )}

      {gameStatus === 'gameover' && (
        <div className="overlay overlay--gameover" onClick={onQuit}>
          <p className="overlay__title">GAME OVER</p>
          <p className="overlay__hint">PRESS ENTER / TAP</p>
        </div>
      )}

      <span className="esc-hint" onClick={onQuit}>ESC: 타이틀</span>
    </div>

    <div className="mobile-controls">
      <div className="ctrl-directions">
        <button
          className="ctrl-btn"
          onPointerDown={e => { e.preventDefault(); keysRef.current.add('ArrowLeft') }}
          onPointerUp={() => keysRef.current.delete('ArrowLeft')}
          onPointerLeave={() => keysRef.current.delete('ArrowLeft')}
          onPointerCancel={() => keysRef.current.delete('ArrowLeft')}
        >←</button>
        <button
          className="ctrl-btn"
          onPointerDown={e => { e.preventDefault(); keysRef.current.add('ArrowRight') }}
          onPointerUp={() => keysRef.current.delete('ArrowRight')}
          onPointerLeave={() => keysRef.current.delete('ArrowRight')}
          onPointerCancel={() => keysRef.current.delete('ArrowRight')}
        >→</button>
      </div>
      <button
        className="ctrl-btn ctrl-btn--fire"
        onPointerDown={e => { e.preventDefault(); fireHarpoon() }}
      >FIRE</button>
    </div>
    </div>
  )
}

export default GameScreen
