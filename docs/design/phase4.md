# Phase 4 설계 — 작살 발사

## 목표

스페이스바를 누르면 플레이어 중앙에서 위 방향으로 작살이 발사된다.
작살이 천장에 닿으면 잠깐 고정된 후 사라지고, 그 동안에는 재발사할 수 없다.

---

## 화면 레이아웃

```
├──────────────────────────────┤  ← 천장 (HUD 하단, y=40)
│          ─────               │  ← 고정 시 수평선
│            │                 │
│            │ 작살 와이어      │
│            │                 │
│           ┌───┐              │
│           │ P │              │  ← 플레이어 중앙에서 발사
└───────────┴───┴──────────────┘
```

---

## 파일 구조

```
src/
├── screens/
│   └── GameScreen.tsx   # 작살 상태·루프 추가 (수정)
└── styles/
    └── GameScreen.css   # .harpoon 스타일 추가 (수정)
```

---

## 상수

```ts
const GAME_HEIGHT    = 640
const HUD_HEIGHT     = 40
const GROUND_HEIGHT  = 20
const PLAYER_HEIGHT  = 50
const PLAYER_TOP_Y   = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT  // 570
const HARPOON_SPEED  = 10   // px / frame
const HARPOON_WIDTH  = 4    // px
const FIXED_FRAMES   = 40   // 천장 고정 후 소멸까지 (~0.67초 @ 60fps)
```

---

## 작살 타입

```ts
type Harpoon = {
  x: number          // 와이어 중앙 x (발사 시점의 플레이어 중앙)
  tipY: number       // 선단 y 좌표 (위로 갈수록 감소)
  fixed: boolean     // 천장 도달 여부
  fixedFrames: number // 고정 후 남은 프레임
}
```

---

## 상태 및 Ref

| 이름 | 종류 | 설명 |
|------|------|------|
| `harpoon` | `useState<Harpoon \| null>` | 렌더링용 작살 상태 |
| `harpoonRef` | `useRef<Harpoon \| null>` | 게임 루프 내 실제 작살 상태 |

---

## 발사 조건

스페이스바(`' '`) 입력 시 `harpoonRef.current === null`이면 발사한다.
작살이 살아있는 동안에는 추가 발사가 불가하다.

```ts
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
```

---

## 게임 루프 내 작살 업데이트

```ts
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
```

---

## 렌더링

작살은 선단(tipY)에서 플레이어 상단(PLAYER_TOP_Y)까지의 수직 선이다.

```tsx
{harpoon && (
  <div
    className={`harpoon${harpoon.fixed ? ' harpoon--fixed' : ''}`}
    style={{
      left: harpoon.x - HARPOON_WIDTH / 2,
      top: harpoon.tipY,
      height: PLAYER_TOP_Y - harpoon.tipY,
    }}
  />
)}
```

---

## 스타일

| 상태 | 표현 |
|------|------|
| 비행 중 | 흰색 수직 선 |
| 천장 고정 | 흰색 수직 선 + 천장 상단 수평선(::before) |

---

## 상태 흐름

```
스페이스바 입력 + 작살 없음
   ↓
harpoonRef = { tipY: PLAYER_TOP_Y, fixed: false, ... }
   ↓
매 프레임: tipY -= HARPOON_SPEED
   ↓
tipY <= HUD_HEIGHT → fixed = true, fixedFrames = FIXED_FRAMES
   ↓
매 프레임: fixedFrames -= 1
   ↓
fixedFrames <= 0 → harpoonRef = null (소멸, 재발사 가능)
```

---

## 구현 시 주의사항

- 스페이스바 기본 동작(페이지 스크롤)을 `e.preventDefault()`로 막는다.
- 작살 상태도 `playerXRef`와 동일하게 ref + state 쌍으로 관리한다.
- `updateHarpoon`은 기존 게임 루프(`requestAnimationFrame`)에 통합한다.
