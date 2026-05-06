# Phase 9 설계 — 점수 시스템

## 목표

버블을 제거할 때마다 크기별 점수가 합산되어 HUD에 실시간으로 표시된다.
게임 오버 또는 스테이지 클리어 시 세션 최고 점수를 갱신하고, 타이틀 화면에 표시한다.

---

## 파일 구조

```
src/
├── App.tsx                 # highScore 상태 관리, GameScreen에 점수 콜백 전달 (수정)
└── screens/
    └── GameScreen.tsx      # score 상태, 버블 제거 시 점수 누적, HUD 반영 (수정)
```

---

## 크기별 점수표

| 크기 | 점수 |
|------|------|
| large | 100 |
| medium | 200 |
| small | 400 |
| tiny | 800 |

작은 버블일수록 맞히기 어렵고 고점수.

```ts
const BUBBLE_SCORE: Record<BubbleSize, number> = {
  large:  100,
  medium: 200,
  small:  400,
  tiny:   800,
}
```

---

## 상태 설계

### GameScreen

| 이름 | 종류 | 설명 |
|------|------|------|
| `score` | `useState` | HUD 렌더링용 현재 점수 |
| `scoreRef` | `useRef` | 게임 루프 내 점수 참조 |

### App.tsx

| 이름 | 종류 | 설명 |
|------|------|------|
| `highScore` | `useState` | 세션 내 최고 점수, MainScreen에 전달 |

---

## 점수 누적 (게임 루프 내)

작살-버블 충돌 처리 시 제거된 버블의 점수를 누적한다.

```ts
if (hitIndex !== -1) {
  const hit = bubblesRef.current[hitIndex]
  scoreRef.current += BUBBLE_SCORE[hit.size]
  setScore(scoreRef.current)
  // ... 기존 분열 처리
}
```

---

## 최고 점수 갱신

게임 오버 또는 스테이지 클리어 시 `onScoreUpdate(score)` 콜백을 호출해
App.tsx의 `highScore`를 갱신한다.

```ts
// GameScreen props 추가
type GameScreenProps = {
  onQuit: () => void
  onScoreUpdate: (score: number) => void
}

// 게임 오버 시
gameStatusRef.current = 'gameover'
setGameStatus('gameover')
onScoreUpdate(scoreRef.current)

// 스테이지 클리어 시
gameStatusRef.current = 'stageclear'
setGameStatus('stageclear')
onScoreUpdate(scoreRef.current)
```

### App.tsx

```ts
const [highScore, setHighScore] = useState(0)

function handleScoreUpdate(score: number) {
  setHighScore(prev => Math.max(prev, score))
}

<GameScreen onQuit={() => setScreen('main')} onScoreUpdate={handleScoreUpdate} />
```

---

## HUD 점수 표시

```tsx
<span>SCORE {String(score).padStart(5, '0')}</span>
```

---

## 구현 시 주의사항

- `scoreRef`는 게임 루프 내에서 읽고 쓰고, `setScore`는 렌더링 트리거용으로만 사용한다.
- 스테이지 클리어 후 버블이 초기화될 때 점수는 유지한다 (초기화하지 않음).
- 게임 오버 후 GameScreen이 언마운트되고 다음 게임이 시작될 때 점수는 0으로 리셋된다.
