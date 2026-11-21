# study16 · HTML·CSS·JavaScript — 운영·Docker·CI/CD·백업

## ① 목표 한 줄

검증·이미지 빌드·선택 자동 배포·로그·백업·복원 점검표를 만든다.

## ② 📖 이론

Docker 이미지는 실행 코드와 의존성을 고정하고 컨테이너 환경변수와 볼륨은 운영 설정과 데이터를 공급한다. 이미지 안에 .env와 DB를 넣지 않는다. node 사용자는 root가 아니며 /app/data만 쓰기 가능한 볼륨으로 연결한다. HOST=0.0.0.0은 컨테이너 안에서만 모든 인터페이스를 수신하고 호스트 포트는 루프백에 묶는다.

GitHub Actions는 push/PR에서 npm ci→check→test→Chromium→build→Docker build를 실행한다. 배포는 DEPLOY_ENABLED=true일 때만 GHCR에 커밋 SHA 이미지 태그를 올리고 SSH로 compose up을 수행한다. production 환경 승인·시크릿·known_hosts를 구성한 후 활성화한다. 기본 푸시는 검증 작업만 실행한다.

로그는 requestId·메소드·경로·상태·ms를 JSON으로 남긴다. /health는 생존, /api/metrics는 프로세스 uptime·메모리의 기초 관찰 지점이다. 운영 readiness에는 DB 조회·외부 의존성·포화 상태를 별도로 점검한다. 비밀·문서·비밀번호를 로그에 넣지 않는다.

SQLite 온라인 백업 API는 WAL과 일관성을 고려하여 사본을 만든다. 파일을 단순 복사하는 것보다 실행 중 DB 백업에 적합하다. 복원은 기존 DB에 덮어쓰지 않고 새 경로로 수행한 뒤 무결성을 검사하고 설정을 변경한다. 백업 완료와 복원 가능 여부는 다른 기준이다.

### 비유로 이해하기

이미지는 같은 물건을 담는 상자, 환경변수는 배송지 안내, 볼륨은 상자를 교체해도 남는 창고다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. .env를 만들고 docker compose up -d --build로 실행한다. Docker 엔진이 먼저 실행되어 있어야 한다.
2. docker compose ps와 docker compose logs app을 확인한다.
3. npm run backup 후 생성된 파일을 다른 위치에 보관한다.
4. npm run restore -- backups/선택파일.sqlite data/restored.sqlite로 새 경로에 복원한다.
5. 서버를 멈추고 SQLITE_PATH를 restored.sqlite로 바꾼 뒤 자료를 확인한다.
6. CI 시크릿과 원격 서버를 준비한 뒤에만 DEPLOY_ENABLED를 활성화한다.

### 운영·자동 배포 체크리스트

- [ ] Docker 엔진·이미지 빌드·비root 사용자·healthcheck를 확인했다.
- [ ] PUBLIC_ORIGIN·CORS_ORIGIN·DB·AI·SMTP 비밀을 서버에만 설정했다.
- [ ] 원격 `/opt/html-study`와 `.env`, Docker Compose, 영속 볼륨, HTTPS 프록시를 준비했다.
- [ ] GHCR 비공개 이미지라면 원격 서버에 pull 권한 로그인을 구성했다.
- [ ] Actions production 환경에 DEPLOY_HOST·DEPLOY_USER·DEPLOY_SSH_KEY·DEPLOY_KNOWN_HOSTS 시크릿을 설정했다.
- [ ] DEPLOY_ENABLED=true를 켜기 전에 이전 이미지 태그와 DB 백업·롤백 절차를 준비했다.
- [ ] 5xx 비율·p95·메모리·디스크·인증서 만료·백업 실패에 알림 기준을 세웠다.
- [ ] 실제 이미지 배포 후 /health와 로그인·CRUD·DB 유지 여부를 확인했다.

외부 DB 백업: PostgreSQL `pg_dump`/`pg_restore`, MariaDB `mariadb-dump`, MongoDB `mongodump`/`mongorestore`를 해당 버전 공식 문서에 맞춰 사용한다. 비밀번호를 명령 문자열·로그에 직접 적지 않는다.


### `Dockerfile` 전체 코드

```text
FROM node:24.14.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /app/data && chown node:node /app/data
COPY --chown=node:node server ./server
COPY --chown=node:node workbook ./workbook
COPY --chown=node:node midpoint ./midpoint
COPY --chown=node:node lessons ./lessons
COPY --chown=node:node practice ./practice
COPY --chown=node:node final-project ./final-project
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.js"]
```

원본: [Dockerfile](Dockerfile) · SHA-256(LF 정규화): `f8c61243e90602b4f7cb925e9de2dee6c698dc3494c92055f31cf97d8f58b7e4`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 실행할 Node 기본 이미지를 고정한다. |
| 2 | 컨테이너 작업 경로를 설정한다. |
| 3 | 필요한 코드·lockfile만 이미지로 복사한다. |
| 4 | 의존성 설치와 실행 디렉터리 권한을 준비한다. |
| 5 | 필요한 코드·lockfile만 이미지로 복사한다. |
| 6 | 필요한 코드·lockfile만 이미지로 복사한다. |
| 7 | 필요한 코드·lockfile만 이미지로 복사한다. |
| 8 | 필요한 코드·lockfile만 이미지로 복사한다. |
| 9 | 필요한 코드·lockfile만 이미지로 복사한다. |
| 10 | 필요한 코드·lockfile만 이미지로 복사한다. |
| 11 | root 대신 node 계정으로 실행한다. |
| 12 | 운영 실행 설정을 주입한다. |
| 13 | 서비스 포트를 문서화한다. |
| 14 | 주기적으로 /health를 검사한다. |
| 15 | 컨테이너 시작 시 Node 서버를 실행한다. |


### `.dockerignore` 전체 코드

```text
.git
.env
.env.*
node_modules
data
backups
artifacts
dist
tests
```

원본: [.dockerignore](.dockerignore) · SHA-256(LF 정규화): `5a60df867f2f6be339d61c72f3e827d1384baa295fce522b6646afca891ef4b3`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 2 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 3 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 4 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 5 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 6 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 7 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 8 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 9 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |


### `compose.yaml` 전체 코드

```yaml
services:
  app:
    build: .
    ports: ["127.0.0.1:3000:3000"]
    env_file: .env
    environment:
      HOST: 0.0.0.0
    volumes: ["study-data:/app/data"]
    restart: unless-stopped
  postgres:
    image: postgres:17
    profiles: [databases]
    environment:
      POSTGRES_USER: study
      POSTGRES_PASSWORD: study
      POSTGRES_DB: study
    ports: ["127.0.0.1:5432:5432"]
    volumes: ["postgres-data:/var/lib/postgresql/data"]
  mariadb:
    image: mariadb:11.4
    profiles: [databases]
    environment:
      MARIADB_ROOT_PASSWORD: local-study-only
      MARIADB_USER: study
      MARIADB_PASSWORD: study
      MARIADB_DATABASE: study
    ports: ["127.0.0.1:3306:3306"]
    volumes: ["mariadb-data:/var/lib/mysql"]
  mongodb:
    image: mongo:8
    profiles: [databases]
    ports: ["127.0.0.1:27017:27017"]
    volumes: ["mongo-data:/data/db"]
volumes:
  study-data:
  postgres-data:
  mariadb-data:
  mongo-data:
```

원본: [compose.yaml](compose.yaml) · SHA-256(LF 정규화): `f0f8555c91d19ac89efd4af2ac782820bdfe6c097460b2ba276af4fe32d4f996`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | YAML 설정에서 services 항목의 실행 조건·값·하위 단계를 선언한다. |
| 2 | YAML 설정에서 app 항목의 실행 조건·값·하위 단계를 선언한다. |
| 3 | YAML 설정에서 build 항목의 실행 조건·값·하위 단계를 선언한다. |
| 4 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 5 | YAML 설정에서 env_file 항목의 실행 조건·값·하위 단계를 선언한다. |
| 6 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 7 | YAML 설정에서 HOST 항목의 실행 조건·값·하위 단계를 선언한다. |
| 8 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 9 | YAML 설정에서 restart 항목의 실행 조건·값·하위 단계를 선언한다. |
| 10 | YAML 설정에서 postgres 항목의 실행 조건·값·하위 단계를 선언한다. |
| 11 | YAML 설정에서 image 항목의 실행 조건·값·하위 단계를 선언한다. |
| 12 | YAML 설정에서 profiles 항목의 실행 조건·값·하위 단계를 선언한다. |
| 13 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 14 | YAML 설정에서 POSTGRES_USER 항목의 실행 조건·값·하위 단계를 선언한다. |
| 15 | YAML 설정에서 POSTGRES_PASSWORD 항목의 실행 조건·값·하위 단계를 선언한다. |
| 16 | YAML 설정에서 POSTGRES_DB 항목의 실행 조건·값·하위 단계를 선언한다. |
| 17 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 18 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 19 | YAML 설정에서 mariadb 항목의 실행 조건·값·하위 단계를 선언한다. |
| 20 | YAML 설정에서 image 항목의 실행 조건·값·하위 단계를 선언한다. |
| 21 | YAML 설정에서 profiles 항목의 실행 조건·값·하위 단계를 선언한다. |
| 22 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 23 | YAML 설정에서 MARIADB_ROOT_PASSWORD 항목의 실행 조건·값·하위 단계를 선언한다. |
| 24 | YAML 설정에서 MARIADB_USER 항목의 실행 조건·값·하위 단계를 선언한다. |
| 25 | YAML 설정에서 MARIADB_PASSWORD 항목의 실행 조건·값·하위 단계를 선언한다. |
| 26 | YAML 설정에서 MARIADB_DATABASE 항목의 실행 조건·값·하위 단계를 선언한다. |
| 27 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 28 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 29 | YAML 설정에서 mongodb 항목의 실행 조건·값·하위 단계를 선언한다. |
| 30 | YAML 설정에서 image 항목의 실행 조건·값·하위 단계를 선언한다. |
| 31 | YAML 설정에서 profiles 항목의 실행 조건·값·하위 단계를 선언한다. |
| 32 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 33 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 34 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 35 | YAML 설정에서 study-data 항목의 실행 조건·값·하위 단계를 선언한다. |
| 36 | YAML 설정에서 postgres-data 항목의 실행 조건·값·하위 단계를 선언한다. |
| 37 | YAML 설정에서 mariadb-data 항목의 실행 조건·값·하위 단계를 선언한다. |
| 38 | YAML 설정에서 mongo-data 항목의 실행 조건·값·하위 단계를 선언한다. |


### `.github/workflows/ci.yml` 전체 코드

```yaml
name: 학습 검증과 선택 배포
on:
  push:
    branches: [main, master]
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.14.0
          cache: npm
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:browser
      - run: npm run build
      - run: docker build -t study:check .
  deploy:
    needs: verify
    if: github.event_name != 'pull_request' && vars.DEPLOY_ENABLED == 'true'
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: 이미지 게시와 SSH 배포
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        run: |
          set -euo pipefail
          image="ghcr.io/${GITHUB_REPOSITORY,,}:${GITHUB_SHA}"
          printf '%s' "$GH_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
          docker build -t "$image" .
          docker push "$image"
          mkdir -p ~/.ssh
          chmod 700 ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts
          scp ops/compose.production.yaml "$DEPLOY_USER@$DEPLOY_HOST:/opt/html-study/compose.yaml"
          ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd /opt/html-study && STUDY_IMAGE='$image' docker compose pull && STUDY_IMAGE='$image' docker compose up -d --wait"
```

원본: [.github/workflows/ci.yml](.github/workflows/ci.yml) · SHA-256(LF 정규화): `cf6354745062e9ea50401c17f079929031a47197280a6d79b1a3fc17ba3a14c1`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | YAML 설정에서 name 항목의 실행 조건·값·하위 단계를 선언한다. |
| 2 | YAML 설정에서 on 항목의 실행 조건·값·하위 단계를 선언한다. |
| 3 | YAML 설정에서 push 항목의 실행 조건·값·하위 단계를 선언한다. |
| 4 | YAML 설정에서 branches 항목의 실행 조건·값·하위 단계를 선언한다. |
| 5 | YAML 설정에서 pull_request 항목의 실행 조건·값·하위 단계를 선언한다. |
| 6 | YAML 설정에서 workflow_dispatch 항목의 실행 조건·값·하위 단계를 선언한다. |
| 7 | YAML 설정에서 permissions 항목의 실행 조건·값·하위 단계를 선언한다. |
| 8 | YAML 설정에서 contents 항목의 실행 조건·값·하위 단계를 선언한다. |
| 9 | YAML 설정에서 jobs 항목의 실행 조건·값·하위 단계를 선언한다. |
| 10 | YAML 설정에서 verify 항목의 실행 조건·값·하위 단계를 선언한다. |
| 11 | YAML 설정에서 runs-on 항목의 실행 조건·값·하위 단계를 선언한다. |
| 12 | YAML 설정에서 steps 항목의 실행 조건·값·하위 단계를 선언한다. |
| 13 | YAML 설정에서 uses 항목의 실행 조건·값·하위 단계를 선언한다. |
| 14 | YAML 설정에서 uses 항목의 실행 조건·값·하위 단계를 선언한다. |
| 15 | YAML 설정에서 with 항목의 실행 조건·값·하위 단계를 선언한다. |
| 16 | YAML 설정에서 node-version 항목의 실행 조건·값·하위 단계를 선언한다. |
| 17 | YAML 설정에서 cache 항목의 실행 조건·값·하위 단계를 선언한다. |
| 18 | YAML 설정에서 uses 항목의 실행 조건·값·하위 단계를 선언한다. |
| 19 | YAML 설정에서 with 항목의 실행 조건·값·하위 단계를 선언한다. |
| 20 | YAML 설정에서 python-version 항목의 실행 조건·값·하위 단계를 선언한다. |
| 21 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 22 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 23 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 24 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 25 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 26 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 27 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 28 | YAML 설정에서 deploy 항목의 실행 조건·값·하위 단계를 선언한다. |
| 29 | YAML 설정에서 needs 항목의 실행 조건·값·하위 단계를 선언한다. |
| 30 | YAML 설정에서 if 항목의 실행 조건·값·하위 단계를 선언한다. |
| 31 | YAML 설정에서 runs-on 항목의 실행 조건·값·하위 단계를 선언한다. |
| 32 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 33 | YAML 설정에서 permissions 항목의 실행 조건·값·하위 단계를 선언한다. |
| 34 | YAML 설정에서 contents 항목의 실행 조건·값·하위 단계를 선언한다. |
| 35 | YAML 설정에서 packages 항목의 실행 조건·값·하위 단계를 선언한다. |
| 36 | YAML 설정에서 steps 항목의 실행 조건·값·하위 단계를 선언한다. |
| 37 | YAML 설정에서 uses 항목의 실행 조건·값·하위 단계를 선언한다. |
| 38 | YAML 설정에서 name 항목의 실행 조건·값·하위 단계를 선언한다. |
| 39 | YAML 설정에서 env 항목의 실행 조건·값·하위 단계를 선언한다. |
| 40 | YAML 설정에서 GH_TOKEN 항목의 실행 조건·값·하위 단계를 선언한다. |
| 41 | YAML 설정에서 SSH_KEY 항목의 실행 조건·값·하위 단계를 선언한다. |
| 42 | YAML 설정에서 KNOWN_HOSTS 항목의 실행 조건·값·하위 단계를 선언한다. |
| 43 | YAML 설정에서 DEPLOY_HOST 항목의 실행 조건·값·하위 단계를 선언한다. |
| 44 | YAML 설정에서 DEPLOY_USER 항목의 실행 조건·값·하위 단계를 선언한다. |
| 45 | YAML 설정에서 run 항목의 실행 조건·값·하위 단계를 선언한다. |
| 46 | YAML 설정에서 set -euo pipefail 항목의 실행 조건·값·하위 단계를 선언한다. |
| 47 | YAML 설정에서 image="ghcr.io/${GITHUB_REPOSITORY,,} 항목의 실행 조건·값·하위 단계를 선언한다. |
| 48 | YAML 설정에서 printf '%s' "$GH_TOKEN" &#124; docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin 항목의 실행 조건·값·하위 단계를 선언한다. |
| 49 | YAML 설정에서 docker build -t "$image" . 항목의 실행 조건·값·하위 단계를 선언한다. |
| 50 | YAML 설정에서 docker push "$image" 항목의 실행 조건·값·하위 단계를 선언한다. |
| 51 | YAML 설정에서 mkdir -p ~/.ssh 항목의 실행 조건·값·하위 단계를 선언한다. |
| 52 | YAML 설정에서 chmod 700 ~/.ssh 항목의 실행 조건·값·하위 단계를 선언한다. |
| 53 | YAML 설정에서 printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519 항목의 실행 조건·값·하위 단계를 선언한다. |
| 54 | YAML 설정에서 chmod 600 ~/.ssh/id_ed25519 항목의 실행 조건·값·하위 단계를 선언한다. |
| 55 | YAML 설정에서 printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts 항목의 실행 조건·값·하위 단계를 선언한다. |
| 56 | YAML 설정에서 scp ops/compose.production.yaml "$DEPLOY_USER@$DEPLOY_HOST 항목의 실행 조건·값·하위 단계를 선언한다. |
| 57 | YAML 설정에서 ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd /opt/html-study && STUDY_IMAGE='$image' docker compose pull && STUDY_IMAGE='$image' docker compose up -d --wait" 항목의 실행 조건·값·하위 단계를 선언한다. |


### `ops/compose.production.yaml` 전체 코드

```yaml
services:
  app:
    image: ${STUDY_IMAGE:?배포할 이미지 태그 필요}
    env_file: .env
    environment:
      HOST: 0.0.0.0
      NODE_ENV: production
    ports: ["127.0.0.1:3000:3000"]
    volumes: ["study-data:/app/data"]
    restart: unless-stopped
volumes:
  study-data:
```

원본: [ops/compose.production.yaml](ops/compose.production.yaml) · SHA-256(LF 정규화): `f4254b7789ac4a3e3d541226ccb7b8282366f3f2388098d78dddac03642cc8a0`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | YAML 설정에서 services 항목의 실행 조건·값·하위 단계를 선언한다. |
| 2 | YAML 설정에서 app 항목의 실행 조건·값·하위 단계를 선언한다. |
| 3 | YAML 설정에서 image 항목의 실행 조건·값·하위 단계를 선언한다. |
| 4 | YAML 설정에서 env_file 항목의 실행 조건·값·하위 단계를 선언한다. |
| 5 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 6 | YAML 설정에서 HOST 항목의 실행 조건·값·하위 단계를 선언한다. |
| 7 | YAML 설정에서 NODE_ENV 항목의 실행 조건·값·하위 단계를 선언한다. |
| 8 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 9 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 10 | YAML 설정에서 restart 항목의 실행 조건·값·하위 단계를 선언한다. |
| 11 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 12 | YAML 설정에서 study-data 항목의 실행 조건·값·하위 단계를 선언한다. |


### `scripts/backup.js` 전체 코드

```javascript
import { backup, DatabaseSync } from 'node:sqlite';
import { mkdir } from 'node:fs/promises';

if ((process.env.DB_DRIVER || 'sqlite') !== 'sqlite') throw new Error('외부 DB는 전용 백업 명령을 사용하세요.');
await mkdir('backups', { recursive: true });
const db = new DatabaseSync(process.env.SQLITE_PATH || 'data/study.sqlite');
const path = `backups/study-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
try { await backup(db, path); console.log(`백업: ${path}`); }
finally { db.close(); }
```

원본: [scripts/backup.js](scripts/backup.js) · SHA-256(LF 정규화): `10a75c4b7215c793ff021e6de6bd53d61b69659bbac9a0d9fa2a137c5ad7a62a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if ((process.env.DB_DRIVER // 'sqlite') !== 'sqlite') throw new Error('외부 DB는 전용 백업 명령을 사용하세요.'); |
| 5 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mkdir('backups', { recursive: true }); |
| 6 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | `path`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: try { await backup(db, path); console.log(`백업: ${path}`); } |
| 9 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |


### `scripts/restore.js` 전체 코드

```javascript
import { DatabaseSync } from 'node:sqlite';
import { copyFile, mkdir, access, constants } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

// 실행 중인 DB에 덮어쓰지 않는다. 새 경로로 복원하고 환경변수를 바꾼다.
const source = process.argv[2];
const target = process.argv[3];
if (!source || !target || resolve(source) === resolve(target)) throw new Error('사용법: npm run restore -- backups/원본.sqlite data/복원.sqlite');
try { await access(target); throw new Error('대상 파일이 이미 있습니다. 새 경로를 사용하세요.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const db = new DatabaseSync(source, { readOnly: true });
try { if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('백업 파일 무결성 실패'); }
finally { db.close(); }
await mkdir(dirname(target), { recursive: true });
await copyFile(source, target, constants.COPYFILE_EXCL);
console.log(`복원 완료: SQLITE_PATH=${target} 로 변경한 뒤 서버를 재시작하세요.`);
```

원본: [scripts/restore.js](scripts/restore.js) · SHA-256(LF 정규화): `633d7245a5b1841b3070f68fa5109616276831261799b37c1ad2886aafed4e5f`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | 실행 중인 DB에 덮어쓰지 않는다. 새 경로로 복원하고 환경변수를 바꾼다. |
| 6 | `source`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | `target`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!source // !target // resolve(source) === resolve(target)) throw new Error('사용법: npm run restore -- backup |
| 9 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: try { await access(target); throw new Error('대상 파일이 이미 있습니다. 새 경로를 사용하세요.'); } |
| 10 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 11 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 12 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 13 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 14 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mkdir(dirname(target), { recursive: true }); |
| 15 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await copyFile(source, target, constants.COPYFILE_EXCL); |
| 16 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |


## ④ 🔗 연동 포인트

Git push → CI 검사 → 이미지 SHA 태그 → 선택 GHCR/SSH 배포 → reverse proxy HTTPS → 영속 볼륨 → 백업·복원으로 이어진다. 다음 단계에서는 연결을 유지하는 실시간 알림과 파일 작업을 운영 조건 안에서 확장한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| Docker named pipe 없음 | Docker Desktop 엔진 미실행 | Docker Desktop 시작 후 docker info |
| 이미지 pull 권한 없음 | 원격 GHCR 로그인 누락 | 배포 서버에서 읽기 권한 계정 로그인 |
| 복원 대상이 존재함 | 기존 DB 덮어쓰기 방지 | 새 대상 경로로 복원 |

## ⑥ 직접 해보기

1. 백업을 새 경로로 복원하고 실제 게시글을 조회한다.
2. 잘못된 DB 설정으로 /health와 실제 API 차이를 기록한다.
3. 이전 SHA 이미지로 롤백하는 명령과 DB 호환성 조건을 적는다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] Docker·Actions·로그·모니터링·백업 체크리스트를 수행한다
- [ ] 운영 시크릿·known_hosts·영속 볼륨을 분리한다
- [ ] 백업 사본의 무결성과 새 경로 복원을 확인한다
- [ ] 실제 배포·컨테이너 실행 여부를 검증 기록에 구분한다

## ⑧ 다음 단계 연결

[study17.md](study17.md)에서 실시간 알림·파일 처리·확장로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
