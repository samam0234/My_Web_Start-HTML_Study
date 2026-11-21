# 에이전트 공통 가이드라인 (인수인계 문서)

이 문서는 이 저장소에서 작업하는 모든 AI 에이전트(Claude, Grok, Codex 등)가 **공통으로** 지켜야 할 규칙을 정리한 인수인계 문서입니다.
`.claude/`, `.grok/`, `.codex/` 폴더의 에이전트별 문서는 이 문서를 기본으로 삼고, 도구별 특이사항만 추가로 기술합니다.

## 1. 저장소 개요

- HTML·CSS·Vanilla JavaScript 학습 저장소입니다. 다른 프레임워크 비교·이식은 현재 범위 밖입니다.
- `study0.md`, `study1.md`, `study2.md`, ... 순서로 학습 진도가 진행됩니다. (숫자가 클수록 최신 진도)
- `practice/site/`, `final-project/`: 기존 정적 실습. `lessons/`: 단계별 실행 예제. `workbook/`, `server/`: 동일 JavaScript로 만든 게시판·문서 AI 실습입니다.

## 2. 작업 전 확인 사항

- 새 작업을 시작하기 전에 `studyN.md` 파일들을 번호 순서대로 확인하여 지금까지의 학습 진도와 맥락을 파악합니다.
- 실습 코드와 study 문서 설명이 일치하는지 확인합니다. 문서 갱신은 `python scripts/build_docs.py`로 코드 전문과 줄별 설명을 함께 동기화합니다.
- 새 studyN.md 문서를 추가/수정할 때는 이전 study 문서와 이어지는 흐름을 유지합니다.

## 3. 커밋 규칙

- 커밋 관련 규칙은 [COMMIT_GUIDE.md](./COMMIT_GUIDE.md) 문서를 따릅니다.

## 4. 언어 규칙

- 문서 내용, 커밋 설명: 한글
- 커밋 타입(prefix), 코드, 식별자, 파일명: 영어

## 5. 에이전트별 문서

- Claude: [.claude/CLAUDE.md](../.claude/CLAUDE.md)
- Grok: [.grok/GROK.md](../.grok/GROK.md)
- Codex: [.codex/AGENTS.md](../.codex/AGENTS.md)

## 6. 인수인계 원칙

- 작업을 마칠 때는 다음 에이전트/세션이 이어받을 수 있도록 변경 내용과 다음 단계 후보를 간단히 남깁니다.
- 불확실한 결정은 추측하지 말고 study 문서 내용을 근거로 삼습니다.
- 이 문서나 커밋 가이드에 없는 새로운 컨벤션이 필요해지면, 추측해서 각자 다르게 처리하지 말고 이 문서를 먼저 갱신합니다.

## 7. 현재 인수인계

- `study0~10 → studyMidpoint → study11~18 → studyFinal` 21개 문서와 대응 코드가 있습니다. 기존 정적 사이트·Todo를 유지합니다.
- `npm run docs`로 실제 소스 전문·줄별 설명·LF 정규화 해시를 재생성하고 `npm run check`로 일치를 검사합니다. 학습 본문은 `scripts/build_docs.py`에서 관리합니다.
- 검증 명령은 `npm test`, `npm run test:browser`, `npm run build`입니다. 상세 결과와 실제 미검증 경계는 `docs/verification.md`를 읽습니다.
- 다음 운영 검증은 Docker 엔진 기동 후 외부 DB 3종, 실제 SMTP/Stripe 테스트/OAuth/모델, 원격 배포입니다. 모의 모드를 실제 연결 완료로 표시하지 않습니다.
- 노션 반영·범위 제외 항목은 `docs/coverage.md`에 남깁니다. 노션 갱신은 문서·관련 코드 작업과 검증 후 수행합니다.
