# 메인 화면 구성

## 화면 레이아웃

게임 시작 시 표시되는 첫 진입 화면으로, 플레이어가 게임을 시작하거나 설정을 확인할 수 있는 허브 역할을 한다.

```
┌─────────────────────────────────┐
│                                 │
│          PANG                   │
│       (타이틀 로고)              │
│                                 │
│       [ 1 PLAYER START ]        │
│       [ 2 PLAYER START ]        │
│                                 │
│         HIGH SCORE              │
│           00000                 │
│                                 │
│      INSERT COIN / PRESS START  │
│                                 │
└─────────────────────────────────┘
```

## 구성 요소

| 요소 | 설명 |
|------|------|
| 타이틀 로고 | "PANG" 로고 표시, 화면 상단 중앙 배치 |
| 1 PLAYER START | 1인 게임 시작 버튼 |
| 2 PLAYER START | 2인 협력 게임 시작 버튼 |
| HIGH SCORE | 현재 최고 점수 표시 |
| 시작 안내 문구 | PRESS START 등 입력 유도 문구 |

## 동작 흐름

1. 게임 진입 시 타이틀 화면 표시
2. 1 PLAYER / 2 PLAYER 선택
3. 선택 후 Mission 1 Stage 1 시작

## 화면 전환

- **1 PLAYER START 선택** → Mission 1 Stage 1 로드
- **2 PLAYER START 선택** → Mission 1 Stage 1 로드 (2인 모드)
- 입력 없이 일정 시간 경과 → 데모 플레이(어트랙트 모드) 또는 화면 루프
