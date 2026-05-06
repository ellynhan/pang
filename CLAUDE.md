# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기술 스택

| 항목 | 버전 |
|------|------|
| 언어 | TypeScript 5.8 |
| 프레임워크 | React 19 |
| 번들러 | Vite 6 |
| 린터 | ESLint 9 |

## 주요 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드 (tsc -b && vite build)
npm run build

# 빌드 결과물 미리보기
npm run preview

# 린트 검사
npm run lint
```

## 기획 문서

| 파일 | 내용 |
|------|------|
| [docs/PRD.md](docs/PRD.md) | 게임 전체 개요 및 핵심 게임플레이 |
| [docs/FEATURES/main.md](docs/FEATURES/main.md) | 메인 화면 구성 및 화면 전환 흐름 |
| [docs/FEATURES/game_rule.md](docs/FEATURES/game_rule.md) | 버블 시스템, 아이템, 점수 등 상세 게임 룰 |
| [docs/FEATURES/mission1.md](docs/FEATURES/mission1.md) | Mission 1 스테이지별 난이도 및 구성 |
| [docs/PLAN.md](docs/PLAN.md) | Phase별 개발 목표 및 계획 |

## Phase 설계 문서

각 Phase의 구현 방법, 컴포넌트 설계, 파일 구조 등 기술 설계 내용을 담습니다.
설계 문서는 `docs/design/` 디렉토리에 Phase별로 관리합니다.

| Phase | 파일 | 핵심 내용 |
|-------|------|-----------|
| Phase 1 | [docs/design/phase1.md](docs/design/phase1.md) | 메인 화면, 메뉴 버튼, 화면 전환 상태 설계 |
| Phase 2 | [docs/design/phase2.md](docs/design/phase2.md) | 게임 화면 진입, 플레이어 표시, HUD 기초 설계 |
| Phase 3 | [docs/design/phase3.md](docs/design/phase3.md) | 플레이어 좌우 이동, 벽 충돌, 게임 루프 설계 |

## 코드 구조

```
src/
├── main.tsx     # React 앱 진입점 (createRoot)
├── App.tsx      # 루트 컴포넌트
└── index.css    # 글로벌 스타일 (CSS reset 포함)
```

`index.html` → `src/main.tsx` → `src/App.tsx` 순서로 렌더링됩니다.

## TypeScript 설정 주요 옵션

- `strict: true` — 엄격 타입 검사 활성화
- `noUnusedLocals`, `noUnusedParameters` — 미사용 변수·파라미터 오류 처리
- `noUncheckedSideEffectImports` — 사이드 이펙트 임포트 검사
- Target: `ES2020`, JSX transform: `react-jsx`

## 테스트 방법

현재 테스트 프레임워크(Jest, Vitest 등)가 설정되어 있지 않습니다. 기능 검증은 `npm run dev`로 개발 서버를 실행한 뒤 브라우저에서 직접 확인합니다.

테스트 도구를 추가하려면 Vitest 사용을 권장합니다(Vite 기반 프로젝트와의 호환성 최적).
