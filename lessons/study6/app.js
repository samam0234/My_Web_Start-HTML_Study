import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study6 · DB·API CRUD",
  "intro": "가입·로그인 후 등록→상세→JSON 변경→수정→삭제를 순서대로 실행하세요. 생성 id는 이 탭에 보관합니다.",
  "input": {
    "email": "lesson@example.com",
    "password": "lesson-password-123",
    "nickname": "학습자",
    "title": "첫 글",
    "body": "SQLite에 저장합니다.",
    "tags": [
      "study6"
    ]
  },
  "actions": [
    {
      "label": "회원가입",
      "path": "/auth/signup",
      "method": "POST",
      "fields": [
        "email",
        "password",
        "nickname"
      ]
    },
    {
      "label": "로그인",
      "path": "/auth/login",
      "method": "POST",
      "fields": [
        "email",
        "password"
      ]
    },
    {
      "label": "목록 조회",
      "path": "/posts"
    },
    {
      "label": "등록",
      "path": "/posts",
      "method": "POST",
      "fields": [
        "title",
        "body",
        "tags"
      ]
    },
    {
      "label": "상세",
      "path": "/posts/{id}"
    },
    {
      "label": "수정",
      "path": "/posts/{id}",
      "method": "PATCH",
      "fields": [
        "title",
        "body",
        "tags"
      ]
    },
    {
      "label": "삭제",
      "path": "/posts/{id}",
      "method": "DELETE"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
