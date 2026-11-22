import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "studyMidpoint · 중간 응용 실행",
  "intro": "기초 서버는 npm run midpoint로 실행하고 아래 기초 게시판에서 전체 화면 흐름을 실습하세요. 이 화면에서도 공통 목록 요청을 실행할 수 있습니다.",
  "input": {},
  "actions": [
    {
      "label": "목록 조회",
      "path": "/posts"
    }
  ],
  "links": [
    [
      "기초 게시판 열기",
      "/midpoint/"
    ]
  ]
});
