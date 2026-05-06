# Phase 11 설계 — 아이템 시스템

## 목표

버블이 완전히 소멸(tiny 제거 또는 단일 버블 제거)될 때 확률적으로 아이템이 드롭된다.
아이템은 바닥으로 낙하하며, 플레이어가 접촉하면 효과가 적용된다.

---

## 아이템 종류 및 효과

| 아이템 | 심볼 | 효과 |
|--------|------|------|
| 더블 와이어 | ✦ | 작살 2개 동시 발사 (스테이지 종료 시 해제) |
| 시계 | ⏱ | 버블 이동 2초간 정지 |
| 다이너마이트 | ✸ | 화면 내 모든 버블 즉시 소멸 |
| 방어막 | ◈ | 다음 충돌 1회 무적 처리 |
| 1UP | ♥ | 라이프 1 추가 |

드롭 확률: 버블 소멸 시 30%, 종류는 균등 랜덤.

---

## 파일 구조

```
src/
├── screens/
│   └── GameScreen.tsx  # 아이템 타입·드롭·충돌·효과 추가 (수정)
└── styles/
    └── GameScreen.css  # .item 스타일 추가 (수정)
```

---

## 아이템 타입

```ts
type ItemType = 'doubleWire' | 'clock' | 'dynamite' | 'shield' | 'oneUp'

type Item = {
  id: number
  type: ItemType
  x: number   // 중심 x
  y: number   // 중심 y
  vy: number  // 낙하 속도
}
```

---

## 상수

```ts
const ITEM_DROP_CHANCE  = 0.3   // 30% 확률
const ITEM_RADIUS       = 14    // px
const ITEM_FALL_SPEED   = 2     // px/frame
const CLOCK_FRAMES      = 120   // 시계 정지 시간 (~2초)
const ITEM_TYPES: ItemType[] = ['doubleWire', 'clock', 'dynamite', 'shield', 'oneUp']
```

---

## 드롭 조건

tiny 버블이 소멸될 때(splitBubble이 빈 배열 반환 = 버블 완전 소멸) 확률적으로 아이템 생성.
드롭 위치: 소멸된 버블의 x, y.

```ts
// 작살-버블 충돌 처리 내
if (hit.size === 'tiny' && Math.random() < ITEM_DROP_CHANCE) {
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)]
  const newItem: Item = { id: nextIdRef.current++, type, x: hit.x, y: hit.y, vy: ITEM_FALL_SPEED }
  itemsRef.current = [...itemsRef.current, newItem]
  setItems(itemsRef.current)
}
```

---

## 아이템 이동 (낙하)

매 프레임 y += vy로 낙하. 바닥(ITEM_FLOOR_Y)에 닿으면 제거.

```ts
const ITEM_FLOOR_Y = GAME_HEIGHT - GROUND_HEIGHT - ITEM_RADIUS

function updateItem(item: Item): Item | null {
  const y = item.y + item.vy
  return y >= ITEM_FLOOR_Y ? null : { ...item, y }
}
```

---

## 플레이어-아이템 충돌

플레이어 사각형과 아이템 원의 충돌을 감지해 효과를 적용하고 아이템을 제거.

```ts
function isPlayerPickingItem(px: number, item: Item): boolean {
  const cx = Math.max(px, Math.min(px + PLAYER_WIDTH, item.x))
  const cy = Math.max(PLAYER_TOP_Y, Math.min(PLAYER_TOP_Y + PLAYER_HEIGHT, item.y))
  const dx = cx - item.x
  const dy = cy - item.y
  return dx * dx + dy * dy < ITEM_RADIUS * ITEM_RADIUS
}
```

---

## 아이템 효과 적용

| 아이템 | 처리 |
|--------|------|
| `doubleWire` | `doubleWireRef.current = true` (작살 발사 시 2개 생성) |
| `clock` | `clockFramesRef.current = CLOCK_FRAMES` (버블 업데이트 스킵) |
| `dynamite` | `bubblesRef.current = []` (전체 버블 제거 + 점수 합산) |
| `shield` | `shieldRef.current = true` (다음 충돌 1회 무적) |
| `oneUp` | `livesRef.current += 1` (최대 제한 없음) |

---

## 더블 와이어 발사 처리

```ts
// 스페이스바 입력 시
if (doubleWireRef.current) {
  // 플레이어 좌측과 우측에서 각 1개씩 발사
  const left  = { x: playerXRef.current + 4, ... }
  const right = { x: playerXRef.current + PLAYER_WIDTH - 4, ... }
  harpoon1Ref.current = left
  harpoon2Ref.current = right
} else {
  harpoonRef.current = { x: playerXRef.current + PLAYER_WIDTH / 2, ... }
}
```

더블 와이어는 스테이지 클리어 또는 게임 오버 시 해제.

---

## 시계 효과 (버블 정지)

```ts
// 버블 업데이트 전
if (clockFramesRef.current > 0) {
  clockFramesRef.current -= 1
  // 버블 map 스킵 (위치 고정)
} else {
  const nextBubbles = bubblesRef.current.map(b => updateBubble(b, platformsRef.current))
  ...
}
```

---

## 렌더링

```tsx
{items.map(item => (
  <div
    key={item.id}
    className={`item item--${item.type}`}
    style={{ left: item.x - ITEM_RADIUS, top: item.y - ITEM_RADIUS }}
  />
))}
```

---

## 스타일

```css
.item {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid rgba(255,255,255,0.6);
  z-index: 6;
}
```

---

## 구현 시 주의사항

- 더블 와이어 상태에서는 작살 2개를 별도 ref(harpoon1Ref, harpoon2Ref)로 관리한다.
- 시계 효과 중에도 플레이어 이동·작살 발사는 정상 동작한다.
- 다이너마이트 사용 시 모든 버블에 대한 점수를 합산해 scoreRef에 누적한다.
- 스테이지 클리어 시 items·doubleWire·clock·shield를 초기화한다.
