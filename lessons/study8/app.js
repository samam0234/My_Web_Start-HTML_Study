import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study8 · 공통 모듈 재사용",
  "intro": "이 화면은 공통 api.js와 store.js를 import합니다. app.js는 설정, runner.js는 제출·오류·출력 수명을 맡습니다.",
  "input": {},
  "actions": [
    {
      "label": "상태 모듈 호출",
      "kind": "state"
    },
    {
      "label": "목록 조회",
      "path": "/posts"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
