# Phase 7 설계 — 충돌 판정 및 라이프 시스템

## 목표

플레이어가 버블에 닿으면 라이프가 1 감소하고, 일정 시간 무적 상태가 된다.
충돌 이후에도 버블·작살·플레이어 위치는 초기화되지 않고 게임이 그대로 이어진다.
라이프가 0이 되면 추가 충돌을 처리하지 않는다 (게임 오버 화면은 Phase 8).

---

## 파일 구조

```
src/
├── screens/
│   └── GameScreen.tsx  # 플레이어-버블 충돌, 라이프·무적 상태 추가 (수정)
└── styles/
    └── GameScreen.css  # 무적 깜빡임은 인라인 opacity로 처리 (변경 없음)
```

---

## 추가 상수

```ts
const INVINCIBLE_FRAMES = 120  // 충돌 후 무적 지속 (~2초 @ 60fps)
```

---

## 충돌 감지 — 사각형(플레이어) vs 원(버블)

플레이어 사각형의 가장 가까운 점과 버블 중심 사이의 거리가 반지름보다 작으면 충돌.

```
플레이어 사각형:
  left   = playerX
  right  = playerX + PLAYER_WIDTH
  top    = PLAYER_TOP_Y
  bottom = PLAYER_TOP_Y + PLAYER_HEIGHT
```

```ts
function isPlayerHitByBubble(px: number, b: Bubble): boolean {
  const { radius } = BUBBLE_CONFIG[b.size]
  const cx = Math.max(px, Math.min(px + PLAYER_WIDTH, b.x))
  const cy = Math.max(PLAYER_TOP_Y, Math.min(PLAYER_TOP_Y + PLAYER_HEIGHT, b.y))
  const dx = cx - b.x
  const dy = cy - b.y
  return dx * dx + dy * dy < radius * radius
}
```

---

## 상태 및 Ref

| 이름 | 종류 | 설명 |
|------|------|------|
| `lives` | `useState` | HUD 렌더링용 남은 라이프 |
| `livesRef` | `useRef` | 게임 루프 내 라이프 참조 |
| `invincibleFrames` | `useState` | 깜빡임 렌더링용 무적 잔여 프레임 |
| `invincibleRef` | `useRef` | 게임 루프 내 무적 판정용 |

---

## 미스 처리 — 게임 상태 유지

충돌 시 라이프 감소와 무적 부여만 수행한다.
버블·작살·플레이어 위치는 초기화하지 않는다.

```ts
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
```

---

## 무적 깜빡임 렌더링

무적 잔여 프레임을 6으로 나눈 몫이 짝수면 반투명, 홀수면 불투명.

```tsx
const isBlinking = invincibleFrames > 0 && Math.floor(invincibleFrames / 6) % 2 === 0

<div
  className="player"
  style={{ left: playerX, opacity: isBlinking ? 0.25 : 1 }}
/>
```

---

## HUD 라이프 표시

`INITIAL_LIVES` 상수 대신 `lives` state로 실시간 반영.

```tsx
{Array.from({ length: lives }, (_, i) => <span key={i}>♥</span>)}
```

---

## 상태 흐름

```
플레이어 ↔ 버블 충돌 감지 (무적 0, 라이프 > 0)
   ↓
lives -= 1
   ├─ lives > 0 → invincibleRef = 120, 게임 상태 그대로 유지
   └─ lives = 0 → gameStatus = 'gameover' (Phase 8 처리)
```

---

## 구현 시 주의사항

- 충돌 처리는 버블 이동·분열 판정 이후 마지막에 수행한다.
- 충돌 후 버블·작살·플레이어를 초기화하지 않는다. 게임 상태를 유지해야 한다.
- `lives === 0` 상태에서는 충돌 감지를 건너뛴다.
