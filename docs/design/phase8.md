# Phase 8 설계 — 스테이지 클리어 및 게임 오버

## 목표

모든 버블을 제거하면 스테이지 클리어 메시지가 표시된 후 스테이지가 초기화된다.
라이프가 0이 되면 게임 오버 화면이 표시되고, Enter 키로 타이틀 화면으로 복귀한다.

---

## 파일 구조

```
src/
├── screens/
│   └── GameScreen.tsx  # 게임 상태 타입, 클리어/오버 판정·화면 추가 (수정)
└── styles/
    └── GameScreen.css  # 오버레이 스타일 추가 (수정)
```

---

## 게임 상태 타입

```ts
type GameStatus = 'playing' | 'stageclear' | 'gameover'
```

| 상태 | 설명 |
|------|------|
| `playing` | 정상 진행 중 |
| `stageclear` | 버블 전체 소멸, 클리어 오버레이 표시 중 |
| `gameover` | 라이프 0, 게임 오버 오버레이 표시 중 |

---

## 추가 상수

```ts
const CLEAR_FRAMES = 120  // 클리어 메시지 표시 시간 (~2초 @ 60fps)
```

---

## 스테이지 클리어 판정

게임 루프에서 `playing` 상태일 때 버블 배열이 비어있으면 클리어 처리.

```ts
if (gameStatusRef.current === 'playing' && bubblesRef.current.length === 0) {
  gameStatusRef.current = 'stageclear'
  setGameStatus('stageclear')
  clearTimerRef.current = CLEAR_FRAMES
}
```

클리어 타이머가 0이 되면 버블·작살·플레이어 위치를 초기화하고 `playing`으로 복귀.

```ts
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
  return  // 클리어 중 충돌 판정 스킵
}
```

---

## 게임 오버 판정

미스 처리 시 라이프가 0이 되면 `gameover` 상태로 전환.
(기존 Phase 7의 미스 처리 분기에서 추가)

```ts
if (hit) {
  livesRef.current -= 1
  setLives(livesRef.current)
  if (livesRef.current <= 0) {
    gameStatusRef.current = 'gameover'
    setGameStatus('gameover')
  } else {
    // 기존 스테이지 리셋 + 무적 부여
  }
}
```

게임 오버 상태에서는 루프 초반에 바로 return해 모든 게임 로직을 정지.

```ts
if (gameStatusRef.current === 'gameover') {
  rafId = requestAnimationFrame(loop)
  return
}
```

---

## Enter 키 처리 (게임 오버 복귀)

기존 keydown 핸들러에 추가.

```ts
if (e.key === 'Enter' && gameStatusRef.current === 'gameover') {
  onQuit()
  return
}
```

---

## 오버레이 렌더링

```tsx
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
```

---

## 오버레이 스타일

- 화면 전체를 반투명 검정으로 덮는 절대 위치 div (z-index 최상위)
- 클리어: 노란색 계열 텍스트
- 게임 오버: 빨간색 계열 텍스트
- 텍스트는 화면 중앙 정렬

---

## 상태 흐름

```
[playing]
  버블 모두 소멸 → [stageclear] → 2초 후 초기화 → [playing]
  라이프 0       → [gameover]  → Enter 키      → onQuit() (타이틀 복귀)
```

---

## 구현 시 주의사항

- `stageclear` 상태에서는 버블·플레이어가 계속 렌더링되지만 충돌 판정은 중단한다.
- `gameover` 상태에서는 게임 루프 초반에 return해 모든 이동·충돌 로직을 정지시킨다.
- `gameStatusRef`와 `setGameStatus`는 항상 동시에 갱신한다.
