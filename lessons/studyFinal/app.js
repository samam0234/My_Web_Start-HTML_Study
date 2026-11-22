import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "studyFinal · 최종 서비스 점검",
  "intro": "npm run dev로 심화 서버를 실행하세요. 아래 전체 서비스에서 가입·CRUD·문서 AI를 순서대로 확인하고 이 화면의 서버·API 검사를 함께 수행합니다.",
  "input": {},
  "actions": [
    {
      "label": "서버 상태",
      "kind": "health"
    },
    {
      "label": "목록 조회",
      "path": "/posts"
    },
    {
      "label": "API 계약",
      "kind": "schema"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
