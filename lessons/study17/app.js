import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study17 · 실시간 알림",
  "intro": "알림 연결 후 다른 탭 /workbook/에서 글을 변경하세요. 개인 문서가 아닌 공개 변경 id만 받습니다.",
  "input": {},
  "actions": [
    {
      "label": "알림 연결",
      "kind": "socket"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
