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

## TypeScript 설정 주요 옵션

- `strict: true` — 엄격 타입 검사 활성화
- `noUnusedLocals`, `noUnusedParameters` — 미사용 변수·파라미터 오류 처리
- `noUncheckedSideEffectImports` — 사이드 이펙트 임포트 검사
- Target: `ES2020`, JSX transform: `react-jsx`
