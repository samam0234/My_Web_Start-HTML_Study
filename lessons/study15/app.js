import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study15 · 성능·캐시 관찰",
  "intro": "정적 CSS의 ETag·Cache-Control을 확인하세요. 20회 중앙값·p95 측정은 node lessons/study15/measure.js로 실행합니다.",
  "input": {},
  "actions": [
    {
      "label": "캐시 헤더 관찰",
      "kind": "cache"
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
