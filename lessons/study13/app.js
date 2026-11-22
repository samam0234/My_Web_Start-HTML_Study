import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study13 · 외부 서비스 연결",
  "intro": "가입·로그인 후 메일·결제·OAuth·문서 저장을 호출합니다. 기본 mock 응답은 실제 발송·결제 성공이 아닙니다.",
  "input": {
    "email": "lesson@example.com",
    "password": "lesson-password-123",
    "nickname": "학습자",
    "filename": "lesson.md",
    "text": "HTML은 문서의 구조입니다."
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
      "label": "메일 접수",
      "path": "/mail",
      "method": "POST"
    },
    {
      "label": "작업 상태",
      "path": "/jobs"
    },
    {
      "label": "테스트 결제",
      "path": "/checkout",
      "method": "POST"
    },
    {
      "label": "OAuth 시작",
      "path": "/auth/github"
    },
    {
      "label": "문서 저장",
      "path": "/documents",
      "method": "POST",
      "fields": [
        "filename",
        "text"
      ]
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
