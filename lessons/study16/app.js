import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study16 · 운영 점검",
  "intro": "Docker 엔진 기동 후 docker compose up -d --build, 로그·영속 볼륨·백업을 문서 순서대로 확인하세요. 아래는 배포 서버의 HTTP 상태 점검이며 Docker 실행을 대신하지 않습니다.",
  "input": {},
  "actions": [
    {
      "label": "서버 상태",
      "kind": "health"
    },
    {
      "label": "프로세스 지표",
      "path": "/metrics"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
