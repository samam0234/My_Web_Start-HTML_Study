import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study0 · 환경 확인",
  "intro": "npm run dev로 실행한 서버의 /health를 확인합니다. Node 버전은 터미널에서 node lessons/study0/hello.js로 확인하세요.",
  "input": {},
  "actions": [
    {
      "label": "서버 상태",
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
