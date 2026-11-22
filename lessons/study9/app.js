import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study9 · 브라우저 단위 검사",
  "intro": "실제 상태 모듈의 구독·구독 해제·복제 격리를 검사합니다. 요청·서버 검사는 루트에서 npm test를 실행하세요.",
  "input": {},
  "actions": [
    {
      "label": "단위 검사 실행",
      "kind": "tests"
    },
    {
      "label": "요청 상태 확인",
      "kind": "health"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
