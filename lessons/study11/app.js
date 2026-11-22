import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study11 · DB 교체 확인",
  "intro": "서버를 중지하고 .env의 DB_DRIVER·DATABASE_URL을 바꾼 뒤 다시 시작하세요. 이 화면은 같은 API 계약으로 자료를 읽습니다. ORM 예제는 터미널에서 실행합니다.",
  "input": {},
  "actions": [
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
