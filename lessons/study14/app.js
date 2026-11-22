import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study14 · OpenAPI·페이지네이션",
  "intro": "OpenAPI 3 문서와 page=1·limit=2 목록의 meta를 대조하세요. 잘못된 정렬은 400 오류를 반환합니다.",
  "input": {},
  "actions": [
    {
      "label": "OpenAPI 읽기",
      "kind": "schema"
    },
    {
      "label": "2개씩 목록",
      "path": "/posts?page=1&limit=2"
    },
    {
      "label": "잘못된 정렬",
      "path": "/posts?sort=invalid"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
