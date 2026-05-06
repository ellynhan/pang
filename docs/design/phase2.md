# Phase 2 설계 — 게임 화면 진입 및 플레이어 표시

## 목표

GAME START를 누르면 게임 화면으로 전환되고,
스테이지 배경과 플레이어 캐릭터가 화면 하단에 표시된다.
이 단계에서 플레이어는 움직이지 않으며, 표시만 된다.

---

## 화면 레이아웃

```
┌──────────────────────────────┐
│ SCORE  00000     ♥ ♥ ♥      │  ← HUD (점수 좌측 / 라이프 우측)
├──────────────────────────────┤
│                              │
│                              │
│        [스테이지 배경]        │
│                              │
│                              │
│                              │
│           ┌───┐              │
│           │ P │              │  ← 플레이어 (하단 중앙 고정)
├───────────┴───┴──────────────┤  ← 바닥선
└──────────────────────────────┘
```

---

## 파일 구조

```
src/
├── App.tsx                       # Screen 타입 확장, game 화면 연결 (수정)
├── screens/
│   └── GameScreen.tsx            # 게임 화면 컴포넌트 (신규)
└── styles/
    └── GameScreen.css            # 게임 화면 전용 스타일 (신규)
```

---

## 컴포넌트 설계

### App.tsx — Screen 타입 확장

`Screen` 타입에 `'game'`을 추가하고, `handleStart`에서 실제로 화면을 전환한다.

```ts
type Screen = 'main' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('main')
  const [highScore] = useState(0)

  return (
    <div className="app">
      <div className="game-screen">
        {screen === 'main' && (
          <MainScreen onStart={() => setScreen('game')} highScore={highScore} />
        )}
        {screen === 'game' && (
          <GameScreen onQuit={() => setScreen('main')} />
        )}
      </div>
    </div>
  )
}
```

---

### GameScreen.tsx — 게임 화면

HUD, 스테이지 배경, 플레이어를 렌더링한다.

| prop | 타입 | 설명 |
|------|------|------|
| `onQuit` | `() => void` | ESC 키 입력 시 타이틀로 복귀 |

**상태 (Phase 2 고정값)**

| 상태 | 초기값 | 설명 |
|------|--------|------|
| `score` | `0` | 현재 점수 (고정) |
| `lives` | `3` | 남은 라이프 (고정) |

**플레이어 위치**

- x: 게임 화면 수평 중앙 `(480 / 2)`
- y: 바닥에서 플레이어 높이만큼 위 `(640 - GROUND_HEIGHT - PLAYER_HEIGHT)`
- Phase 2에서는 고정 위치, 이동은 Phase 3에서 구현

**ESC 키**

게임 화면에서 ESC를 누르면 타이틀로 복귀한다.

```ts
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onQuit()
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [onQuit])
```

---

## 치수 상수

```ts
const GAME_WIDTH = 480
const GAME_HEIGHT = 640
const GROUND_HEIGHT = 20   // 바닥선 두께
const PLAYER_WIDTH = 30
const PLAYER_HEIGHT = 50
```

---

## 스타일 설계

### HUD

- 상단 고정 영역 (높이 40px)
- 좌측: `SCORE 00000`
- 우측: `♥ ♥ ♥` (라이프 수만큼 표시)
- 배경: 반투명 어두운 색으로 게임 영역과 구분

### 스테이지 배경

- 단색 또는 그라디언트로 아케이드 분위기 표현
- 바닥선: 플레이어가 서 있는 지면을 시각적으로 구분

### 플레이어

- 단순 사각형으로 표현 (스프라이트는 추후 단계에서 적용)
- 색상으로 캐릭터임을 명확히 구분

---

## 상태 흐름

```
[메인 화면] GAME START 클릭 또는 Enter
   ↓
screen = 'game' → GameScreen 렌더링
   ↓
ESC 키 입력
   ↓
screen = 'main' → MainScreen 복귀
```

---

## 구현 시 주의사항

- 플레이어 이동은 Phase 3에서 구현하므로 이 단계에서는 위치를 고정으로 렌더링한다.
- HUD의 점수·라이프는 초기값으로 고정 표시하며, 실시간 반영은 이후 Phase에서 연결한다.
- ESC 키로 타이틀 복귀 시 게임 상태를 초기화할 필요가 없다 (Phase 2는 상태 변화가 없음).
