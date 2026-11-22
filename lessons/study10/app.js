import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study10 · 배포 후 점검",
  "intro": "npm run build 후 정적 파일을 확인하세요. API 서버 배포에서는 /health와 실제 목록 조회를 둘 다 확인해야 합니다.",
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
      "label": "정적 캐시 헤더",
      "kind": "cache"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
