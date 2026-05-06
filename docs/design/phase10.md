# Phase 10 설계 — Mission 1 스테이지 구성

## 목표

Mission 1의 3개 스테이지를 버블 배치와 발판 구성으로 구현한다.
클리어 시 다음 스테이지로 자동 진행하고, Stage 3 클리어 후 Stage 1로 순환한다.

---

## 스테이지 구성

### Stage 1 — 평지

| 항목 | 내용 |
|------|------|
| 버블 | large × 2 |
| 발판 | 없음 |

```
┌──────────────────────────────┐
│  ◯                      ◯   │  ← large 2개
│                              │
│                              │
│                              │
│           ┌───┐              │
├───────────┴───┴──────────────┤
```

### Stage 2 — 발판 1개

| 항목 | 내용 |
|------|------|
| 버블 | large × 1 + medium × 2 |
| 발판 | 중앙 1개 (y=430) |

```
┌──────────────────────────────┐
│       ◯    ◯      ◯         │
│                              │
│         ┌────────┐           │  ← 발판 (y=430)
│                              │
├─────────────────────────────-┤
```

### Stage 3 — 발판 2개 (높낮이 차이)

| 항목 | 내용 |
|------|------|
| 버블 | medium × 2 + small × 2 |
| 발판 | 좌측(y=400) + 우측(y=460) 2개 |

```
┌──────────────────────────────┐
│  ◎   ◎   ○       ○          │
│                              │
│  ┌──────┐                   │  ← 발판 좌측 (y=400)
│                 ┌──────┐    │  ← 발판 우측 (y=460)
├──────────────────────────────┤
```

---

## 파일 구조

```
src/
├── screens/
│   └── GameScreen.tsx  # Platform 타입, STAGES 상수, 스테이지 전환 로직 추가 (수정)
└── styles/
    └── GameScreen.css  # .platform 스타일 추가 (수정)
```

---

## 타입 및 상수

```ts
type Platform = {
  x: number      // 좌측 x
  y: number      // 상단 y (버블이 닿는 면)
  width: number
}

type StageConfig = {
  bubbles: Omit<Bubble, 'id'>[]
  platforms: Platform[]
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
```

---

## 발판-버블 충돌

버블이 위에서 내려올 때 발판 상단에 닿으면 바닥 반사와 동일하게 처리한다.

```ts
// updateBubble 내부 - floor 체크 이후
for (const p of platforms) {
  if (
    b.y + radius < p.y &&    // 이전 프레임에는 발판 위
    y  + radius >= p.y &&    // 이번 프레임에 발판 도달
    x  + radius > p.x &&
    x  - radius < p.x + p.width
  ) {
    y = p.y - radius
    vy = bounceVY
    break
  }
}
```

- 발판은 위에서만 충돌 (통과는 아래·옆에서 가능)
- `updateBubble`이 `platforms` 배열을 인자로 받도록 시그니처 변경

---

## 스테이지 전환

```ts
// stageRef: 현재 스테이지 번호 (1~3)
const stageRef = useRef(1)

// stageclear 타이머 만료 시
const nextStage = (stageRef.current % STAGES.length) + 1
stageRef.current = nextStage
const cfg = STAGES[nextStage - 1]
bubblesRef.current = cfg.bubbles.map(b => ({ ...b, id: nextIdRef.current++ }))
platformsRef.current = cfg.platforms
setBubbles(bubblesRef.current)
setPlatforms(platformsRef.current)
```

---

## HUD 스테이지 표시

```tsx
<span>STAGE {stageNumber}</span>
```

---

## 발판 스타일

```css
.platform {
  position: absolute;
  height: 12px;
  background: #5a6a3a;
  border-top: 2px solid #8abf5a;
}
```

---

## 구현 시 주의사항

- 발판은 버블에만 영향을 준다. 플레이어는 바닥에서만 이동한다.
- Stage 3 클리어 후 Stage 1로 순환한다 (Mission 2 미구현).
- 스테이지 전환 시 점수·라이프는 유지, 버블·발판·작살만 초기화한다.
- `makeBubbles` 헬퍼로 스테이지 버블 배열 생성 시 `nextIdRef`를 사용해 고유 ID를 보장한다.
