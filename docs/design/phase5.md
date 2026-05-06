# Phase 5 설계 — 버블 등장 및 이동

## 목표

대형 버블 2개가 화면에 등장해 중력과 반사 물리에 따라 튀어 다닌다.
이 단계에서 버블은 분열하거나 플레이어·작살과 충돌하지 않는다.

---

## 화면 레이아웃

```
├──────────────────────────────┤  ← 천장 (y = HUD_HEIGHT = 40)
│    ◯          ◯             │  ← 대형 버블 2개 (좌우로 이동)
│                              │
│  ◯                    ◯     │  ← 튀어오른 후
│                              │
│                              │
│           ┌───┐              │
│           │ P │              │
├───────────┴───┴──────────────┤  ← 바닥 (버블 반사)
```

---

## 파일 구조

```
src/
├── screens/
│   └── GameScreen.tsx   # 버블 타입·초기 상태·루프 추가 (수정)
└── styles/
    └── GameScreen.css   # .bubble 스타일 추가 (수정)
```

---

## 버블 타입 및 상수

### 버블 크기별 물리 설정

| 크기 | 반지름 | 수평 속도 | 바닥 반사 vy |
|------|--------|-----------|-------------|
| large | 48px | 1.5 | -13 |
| medium | 32px | 2.0 | -10 |
| small | 20px | 2.5 | -7.5 |
| tiny | 12px | 3.0 | -5.5 |

- 수평 속도는 크기에 관계없이 일정하게 유지 (벽 반사 시 부호만 전환)
- 바닥 반사 시 vy를 고정값으로 설정 (탄성 반사가 아닌 팡 게임 특유의 일정한 튐)

```ts
type BubbleSize = 'large' | 'medium' | 'small' | 'tiny'

type Bubble = {
  id: number
  size: BubbleSize
  x: number   // 중심 x
  y: number   // 중심 y
  vx: number  // 수평 속도
  vy: number  // 수직 속도
}

const GRAVITY = 0.25  // px/frame²

const BUBBLE_CONFIG: Record<BubbleSize, { radius: number; speedX: number; bounceVY: number }> = {
  large:  { radius: 48, speedX: 1.5, bounceVY: -13   },
  medium: { radius: 32, speedX: 2.0, bounceVY: -10   },
  small:  { radius: 20, speedX: 2.5, bounceVY: -7.5  },
  tiny:   { radius: 12, speedX: 3.0, bounceVY: -5.5  },
}
```

### 초기 버블 (Phase 5)

```ts
const INITIAL_BUBBLES: Bubble[] = [
  { id: 1, size: 'large', x: 120, y: 100, vx:  1.5, vy: 2 },
  { id: 2, size: 'large', x: 360, y: 100, vx: -1.5, vy: 2 },
]
```

---

## 물리 업데이트 로직

```ts
function updateBubble(b: Bubble): Bubble {
  const { radius, speedX, bounceVY } = BUBBLE_CONFIG[b.size]
  const floorY = GAME_HEIGHT - GROUND_HEIGHT - radius
  const ceilY  = HUD_HEIGHT  + radius

  let vy = b.vy + GRAVITY
  let y  = b.y  + vy
  let x  = b.x  + b.vx
  let vx = b.vx

  // 바닥 반사: vy를 고정 반사값으로 설정
  if (y >= floorY) { y = floorY; vy = bounceVY }

  // 천장 반사: HUD 아래로 밀어냄
  if (y <= ceilY) { y = ceilY; vy = Math.abs(vy) }

  // 벽 반사: 속도 부호 전환 (크기 일정 유지)
  if (x - radius <= 0)           { x = radius;              vx =  speedX }
  if (x + radius >= GAME_WIDTH)  { x = GAME_WIDTH - radius; vx = -speedX }

  return { ...b, x, y, vx, vy }
}
```

---

## 게임 루프 통합

```ts
// bubblesRef: 게임 루프용
// setBubbles: 렌더링 트리거용
const bubblesRef = useRef<Bubble[]>(INITIAL_BUBBLES)
const [bubbles, setBubbles] = useState<Bubble[]>(INITIAL_BUBBLES)

// loop() 안에 추가
const nextBubbles = bubblesRef.current.map(updateBubble)
bubblesRef.current = nextBubbles
setBubbles(nextBubbles)
```

---

## 렌더링

버블은 크기(radius)에 따라 left/top/width/height가 결정되는 원형 div다.

```tsx
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
```

---

## 스타일

크기별 색상으로 시각적 구분:

| 크기 | 색상 |
|------|------|
| large | 파랑 계열 |
| medium | 초록 계열 |
| small | 주황 계열 |
| tiny | 빨강 계열 |

---

## 구현 시 주의사항

- `bubblesRef`와 `setBubbles`는 항상 동기화 상태를 유지한다. `bubblesRef`를 갱신한 직후 `setBubbles`를 호출한다.
- 이 단계에서 버블과 플레이어·작살의 충돌 판정은 구현하지 않는다 (Phase 6·7에서 추가).
- `INITIAL_BUBBLES`는 상수로 분리해 Phase 10(스테이지 구성)에서 교체하기 쉽게 한다.
- 버블이 화면에 많아질수록 매 프레임 렌더링 비용이 커지므로, 불필요한 state 갱신을 줄이기 위해 매 프레임 무조건 setBubbles를 호출한다 (배열 참조가 항상 새로 만들어지므로 React가 차이를 감지함).
