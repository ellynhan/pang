# Phase 3 설계 — 플레이어 이동

## 목표

←/→ 방향키를 누르는 동안 플레이어가 좌우로 부드럽게 이동하고,
화면 양쪽 끝에서 더 이상 나아가지 않는다.

---

## 화면 레이아웃

```
┌──────────────────────────────┐
│ SCORE  00000     ♥ ♥ ♥      │
├──────────────────────────────┤
│                              │
│                              │
│                              │
│                              │
│                              │
│    ┌───┐                     │  ← ← ← 이동 중
│    │ P │                     │
├────┴───┴─────────────────────┤
└──────────────────────────────┘
```

---

## 파일 구조

```
src/
├── screens/
│   └── GameScreen.tsx   # 플레이어 위치 상태 및 게임 루프 추가 (수정)
└── styles/
    └── GameScreen.css   # .player left 동적 처리로 변경 (수정)
```

---

## 구현 설계

### 상수

```ts
const GAME_WIDTH    = 480
const PLAYER_WIDTH  = 30
const PLAYER_SPEED  = 3   // px / frame (60fps 기준 약 180px/s)
const GROUND_HEIGHT = 20
```

### 상태 및 Ref

| 이름 | 종류 | 설명 |
|------|------|------|
| `playerX` | `useState` | 렌더링용 플레이어 X 좌표 (left 기준) |
| `playerXRef` | `useRef` | 게임 루프 내에서 읽고 쓰는 실제 좌표 |
| `keysRef` | `useRef<Set<string>>` | 현재 눌린 키 목록 |

- `playerX` state는 렌더링 트리거용으로만 사용
- 게임 루프 안에서는 `playerXRef`로 좌표를 직접 읽고 써서 클로저 문제를 방지

### 키 입력 처리

`keydown` / `keyup` 이벤트로 `keysRef`를 갱신한다.
기존 ESC 처리도 동일한 `keydown` 핸들러에 통합한다.

```ts
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
```

### 게임 루프 (requestAnimationFrame)

매 프레임마다 `keysRef`를 확인해 위치를 갱신한다.

```ts
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
```

### 렌더링

플레이어 `left` 값을 인라인 스타일로 적용한다.

```tsx
<div className="player" style={{ left: playerX }} />
```

CSS의 `.player`에서 `left: 50%`와 `transform: translateX(-50%)`를 제거하고
`left`를 인라인으로만 제어한다.

---

## 벽 충돌

```
x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, x))
```

- 좌측 벽: `x < 0` → `x = 0`
- 우측 벽: `x > GAME_WIDTH - PLAYER_WIDTH` → `x = GAME_WIDTH - PLAYER_WIDTH`

---

## 상태 흐름

```
← / → 키 누름 → keysRef 갱신
   ↓
requestAnimationFrame loop (매 프레임)
   ↓
x 좌표 계산 → 벽 클램프
   ↓
playerXRef 갱신 → setPlayerX → 리렌더링
```

---

## 구현 시 주의사항

- `playerXRef`와 `keysRef`는 게임 루프용 ref로, 이 값의 변경이 직접 리렌더를 일으키지 않는다.
- `setPlayerX`는 좌표가 실제로 변경된 경우에만 호출해 불필요한 렌더링을 방지한다.
- 게임 루프 `useEffect`의 의존성 배열은 `[]`로 유지한다. `keysRef`와 `playerXRef`는 ref이므로 의존성에 넣지 않는다.
- 컴포넌트 언마운트 시 `cancelAnimationFrame`으로 루프를 반드시 정리한다.
