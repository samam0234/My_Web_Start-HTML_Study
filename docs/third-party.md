# 라이브러리 출처와 라이선스

study12의 vendor 파일은 npm lockfile에 고정한 라이브러리에서 `npm run vendor`로 재생성한다. 직접 작성한 원본은 demo.js, HTML, scripts/vendor.js다. 배포된 라이브러리의 내부 코드를 학습자가 직접 작성하는 코드로 표시하지 않는다.

| 패키지 | 용도 | 공식 출처 | 라이선스 |
|---|---|---|---|
| bootstrap | UI CSS | https://github.com/twbs/bootstrap | MIT |
| nanostores | 프레임워크 독립 상태 저장소 | https://github.com/nanostores/nanostores | MIT |
| just-validate | 브라우저 폼 검증 | https://github.com/horprogs/Just-validate | MIT |

원문 라이선스는 lessons/study12/vendor/*.LICENSE.txt에 함께 보관한다. 번들·CSS의 저작권 주석을 유지한다. 서버·DB·AI·MCP 패키지의 버전과 전체 의존성은 package-lock.json, 라이선스는 설치된 각 패키지의 LICENSE를 확인한다.
