import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study7 · 인증·권한",
  "intro": "로그인 전 내 정보 401, 가입·로그인 후 200, 로그아웃 후 401을 확인하세요. 비밀번호는 학습용 새 계정에만 사용하세요.",
  "input": {
    "email": "lesson@example.com",
    "password": "lesson-password-123",
    "nickname": "학습자"
  },
  "actions": [
    {
      "label": "내 정보",
      "path": "/auth/me"
    },
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
      "label": "로그아웃",
      "path": "/auth/logout",
      "method": "POST"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
