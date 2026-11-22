import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study18 · 문서 AI·SSE",
  "intro": "가입·로그인→문서 저장→질문 순서로 실행하세요. 기본값은 mock입니다. MCP 실습은 npm run mcp:client로 실행합니다.",
  "input": {
    "email": "lesson@example.com",
    "password": "lesson-password-123",
    "nickname": "학습자",
    "filename": "lesson.md",
    "text": "HTML은 문서의 구조입니다. CSS는 표현입니다.",
    "question": "HTML"
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
      "label": "문서 저장",
      "path": "/documents",
      "method": "POST",
      "fields": [
        "filename",
        "text"
      ]
    },
    {
      "label": "스트리밍 질문",
      "path": "/ai/chat/stream",
      "stream": true
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
