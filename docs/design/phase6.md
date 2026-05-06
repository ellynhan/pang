# Phase 6 설계 — 버블 분열

## 목표

작살이 버블에 닿으면 버블이 한 단계 작은 버블 2개로 분열한다.
극소(tiny) 버블은 분열 없이 소멸한다.
충돌 즉시 작살도 사라진다.

---

## 분열 규칙

```
large → medium × 2
medium → small  × 2
small  → tiny   × 2
tiny   → 소멸 (0개 생성)
```

분열 시 두 버블은 부모 버블의 중심 위치에서 각각 좌(-speedX) / 우(+speedX) 방향으로 시작하며, 위쪽으로 튀어 오르는 vy(bounceVY)를 초기값으로 가진다.

---

## 파일 구조

```
src/
└── screens/
    └── GameScreen.tsx  # 충돌 감지·분열 로직 추가 (수정)
```

CSS 변경 없음.

---

## 추가 상수

```ts
const NEXT_SIZE: Partial<Record<BubbleSize, BubbleSize>> = {
  large:  'medium',
  medium: 'small',
  small:  'tiny',
  // tiny: 없음 → 소멸
}
```

---

## 충돌 감지

작살은 x = harpoon.x 의 수직 선분(tipY ~ PLAYER_TOP_Y)이고, 버블은 반지름 radius의 원이다.

```
선분 위에서 버블 중심(bx, by)에 가장 가까운 점:
  cx = harpoon.x
  cy = clamp(by, harpoon.tipY, PLAYER_TOP_Y)

충돌 조건:
  (cx - bx)² + (cy - by)² < radius²
```

```ts
function isHarpoonHittingBubble(h: Harpoon, b: Bubble): boolean {
  const { radius } = BUBBLE_CONFIG[b.size]
  const cy = Math.max(h.tipY, Math.min(PLAYER_TOP_Y, b.y))
  const dx = h.x - b.x
  const dy = cy - b.y
  return dx * dx + dy * dy < radius * radius
}
```

---

## 분열 로직

충돌한 버블 1개를 제거하고 작살을 제거한 뒤, 다음 크기 버블 2개를 생성한다.

```ts
function splitBubble(hit: Bubble, nextId: () => number): Bubble[] {
  const nextSize = NEXT_SIZE[hit.size]
  if (!nextSize) return []   // tiny → 소멸
  const { speedX, bounceVY } = BUBBLE_CONFIG[nextSize]
  return [
    { id: nextId(), size: nextSize, x: hit.x, y: hit.y, vx: -speedX, vy: bounceVY },
    { id: nextId(), size: nextSize, x: hit.x, y: hit.y, vx:  speedX, vy: bounceVY },
  ]
}
```

---

## 게임 루프 통합

버블·작살 위치 갱신 이후 충돌 체크를 실행한다.
충돌이 발생하면 해당 프레임에서 즉시 상태를 반영한다.

```ts
// 충돌 체크 (작살이 존재하는 경우에만)
if (harpoonRef.current !== null) {
  const hitIndex = bubblesRef.current.findIndex(b =>
    isHarpoonHittingBubble(harpoonRef.current!, b)
  )
  if (hitIndex !== -1) {
    const hit = bubblesRef.current[hitIndex]
    const rest = bubblesRef.current.filter((_, i) => i !== hitIndex)
    const spawned = splitBubble(hit, () => nextIdRef.current++)
    bubblesRef.current = [...rest, ...spawned]
    setBubbles(bubblesRef.current)
    harpoonRef.current = null
    setHarpoon(null)
  }
}
```

---

## ID 관리

분열로 생성되는 버블의 ID 충돌을 방지하기 위해 단조 증가 카운터 ref를 사용한다.

```ts
const nextIdRef = useRef(100)  // 초기 버블(id 1,2)과 충돌하지 않는 값에서 시작
```

---

## 상태 흐름

```
작살 이동 중 or 고정 중
   ↓
매 프레임: isHarpoonHittingBubble 검사
   ↓ (충돌)
hitBubble 제거 + harpoon 제거
splitBubble → 새 버블 0~2개 추가
   ↓
bubblesRef / harpoonRef 갱신 → setBubbles / setHarpoon 호출
```

---

## 구현 시 주의사항

- 충돌 검사는 버블 위치 갱신 **이후** 실행해 같은 프레임 내 최신 위치 기준으로 판정한다.
- 한 프레임에 여러 버블이 동시에 충돌하더라도 `findIndex`로 첫 번째 충돌만 처리한다 (작살은 1개이므로 동시에 여러 버블을 맞출 수 없음).
- `tiny` 분열 시 `splitBubble`이 빈 배열을 반환하므로 버블이 완전히 소멸한다.
- 고정된 작살(fixed)도 버블과 충돌 판정을 수행한다.
