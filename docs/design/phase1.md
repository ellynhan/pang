# Phase 1 설계 — 메인 화면

## 목표

브라우저에서 게임을 실행하면 타이틀 화면이 표시되고,
두 개의 메뉴 버튼(게임 시작 / 종료)을 마우스 클릭 또는 키보드 방향키로 조작할 수 있는 상태를 만든다.

---

## 화면 레이아웃

게임 화면은 **세로형 고정 해상도(480×640px)** 캔버스 방식으로 구성한다.
브라우저 창 크기와 무관하게 중앙에 고정 배치된다.

```
┌──────────────────────────────┐  ← 480 × 640 고정
│                              │
│           PANG               │  ← 타이틀 로고
│                              │
│                              │
│   ▶  ┌──────────────────┐   │
│      │   GAME  START    │   │  ← 선택 중 (커서 + 강조)
│      └──────────────────┘   │
│                              │
│      ┌──────────────────┐   │
│      │      종  료      │   │  ← 미선택
│      └──────────────────┘   │
│                              │
│         HIGH SCORE           │
│           00000              │
│                              │
└──────────────────────────────┘
```

---

## 파일 구조

Phase 1에서 생성하거나 수정할 파일 목록이다.

```
src/
├── App.tsx                       # 화면 전환 상태 관리 (수정)
├── index.css                     # 전역 스타일 (수정)
├── screens/
│   └── MainScreen.tsx            # 메인 화면 컴포넌트 (신규)
├── components/
│   └── MenuButton.tsx            # 공통 메뉴 버튼 컴포넌트 (신규)
└── styles/
    └── MainScreen.css            # 메인 화면 전용 스타일 (신규)
```

---

## 컴포넌트 설계

### App.tsx — 화면 전환 관리

게임 전체의 현재 화면 상태를 관리하는 루트 컴포넌트.
Phase 1에서는 `'main'` 상태만 존재하며, 이후 Phase에서 `'game'` 등이 추가된다.

```ts
type Screen = 'main' // Phase 2 이후: | 'game' | 'gameover'

function App() {
  const [screen, setScreen] = useState<Screen>('main')

  function handleStart() {
    alert('게임 화면은 Phase 2에서 구현됩니다.')
  }

  return (
    <div className="app">
      <div className="game-screen">
        {screen === 'main' && (
          <MainScreen onStart={handleStart} highScore={0} />
        )}
      </div>
    </div>
  )
}
```

---

### MainScreen.tsx — 메인 화면

타이틀 로고, 메뉴 버튼 2개, 최고 점수를 렌더링한다.
키보드 방향키로 메뉴를 이동하고 Enter로 선택할 수 있다.

| prop | 타입 | 설명 |
|------|------|------|
| `onStart` | `() => void` | GAME START 실행 시 호출 |
| `highScore` | `number` | 표시할 최고 점수 |

**키보드 동작**

| 키 | 동작 |
|----|------|
| ↑ | 이전 메뉴 항목으로 이동 (끝에서 마지막으로 순환) |
| ↓ | 다음 메뉴 항목으로 이동 (끝에서 처음으로 순환) |
| Enter | 현재 선택된 항목 실행 |

**상태**

```ts
const MENU_ITEMS = ['GAME START', '종  료'] as const
const [selectedIndex, setSelectedIndex] = useState(0) // 기본: GAME START
```

**키 이벤트 처리**

```ts
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      setSelectedIndex(i => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length)
    } else if (e.key === 'ArrowDown') {
      setSelectedIndex(i => (i + 1) % MENU_ITEMS.length)
    } else if (e.key === 'Enter') {
      if (selectedIndex === 0) onStart()
      if (selectedIndex === 1) handleQuit()
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [selectedIndex, onStart])
```

**버튼별 동작**

| 버튼 | 마우스 클릭 | 키보드 Enter |
|------|------------|-------------|
| GAME START | `onStart()` 호출 | 동일 |
| 종료 | confirm 후 `window.close()` | 동일 |

---

### MenuButton.tsx — 공통 버튼 컴포넌트

| prop | 타입 | 설명 |
|------|------|------|
| `label` | `string` | 버튼 텍스트 |
| `onClick` | `() => void` | 클릭 핸들러 |
| `isSelected` | `boolean` | 키보드 선택 상태 (커서 및 강조 스타일 적용) |

---

## 스타일 설계

### 게임 화면 고정 영역

```css
.app {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #000;
}

.game-screen {
  width: 480px;
  height: 640px;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
}
```

### 버튼 선택 상태 스타일

- 기본: 테두리 + 텍스트 컬러
- `isSelected` 또는 hover: 배경 반전 + 왼쪽에 커서(▶) 표시
- 마우스 hover와 키보드 선택이 동일한 강조 스타일을 공유

---

## 상태 흐름

```
앱 실행
   ↓
screen = 'main' → MainScreen 렌더링
selectedIndex = 0 (GAME START 기본 선택)
   ↓
↑/↓ 키 입력 → selectedIndex 변경
   ↓
Enter 또는 클릭
   ├─ selectedIndex === 0 → onStart()
   └─ selectedIndex === 1 → confirm → window.close()
```

---

## 구현 시 주의사항

- 게임 화면(480×640)은 `<canvas>`가 아닌 **CSS 고정 크기 div** 로 구현한다.
- `keydown` 이벤트는 `window`에 등록하고 컴포넌트 언마운트 시 반드시 제거한다.
- `window.close()`는 브라우저 정책상 동작하지 않을 수 있으므로, confirm 후 시도하고 실패 시 안내 문구를 표시한다.
- 마우스 hover와 키보드 `selectedIndex` 강조는 동일한 CSS 클래스를 사용해 일관성을 유지한다.
