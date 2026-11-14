# Pixel Studio

16×16 픽셀 아트를 그리고, 내 작품으로 저장하거나 공개 갤러리에 공유하는 웹 앱입니다.

## 로컬 실행

Node.js 22.12 이상과 실행 중인 MySQL 서버가 필요합니다.

1. `server/.env`에 MySQL 접속 정보와 `JWT_SECRET`을 넣습니다. 새로 설정하는 경우 `server/.env.example`을 복사한 후 실제 값을 입력합니다. JWT 키는 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`로 생성할 수 있습니다.
2. 첫 번째 터미널에서 서버를 준비합니다. `npm run db:init`은 지정한 DB와 테이블이 없으면 생성하고, 기존 작품 테이블에 설명 열이 없으면 추가합니다. 실행 계정에 생성 및 변경 권한이 필요합니다.

   ```powershell
   cd server
   npm ci
   npm run db:init
   npm run dev
   ```

3. 두 번째 터미널에서 프로젝트 루트 기준으로 클라이언트를 실행합니다.

   ```powershell
   cd client
   npm ci
   npm run dev
   ```

4. Vite가 출력한 주소(기본 `http://localhost:5173`)를 엽니다. Vite는 `/api`를 `http://127.0.0.1:5000`으로 전달합니다. 서버의 `PORT`를 바꾸면 `client/vite.config.js`의 프록시 주소도 맞춥니다.

SQL 실습 DB를 그대로 연결했다면 평문 비밀번호로 만든 실습 계정 대신 앱에서 회원가입해 테스트하세요. 기존 작품의 짧은 픽셀 배열은 화면에서 빈 칸을 채워 표시합니다. 앱에서 저장하는 작품은 256칸으로 검증합니다.

## 과제 기능 확인

| 과제 항목 | 확인 방법 |
| --- | --- |
| 회원 가입과 조회 | 회원가입 후 로그인합니다. 마이페이지에서 아이디와 닉네임을 확인합니다. 신규 비밀번호는 서버에서 scrypt로 해시하며 기존 bcrypt 계정도 로그인할 수 있습니다. |
| 회원 수정과 삭제 | 마이페이지에서 닉네임을 바꿉니다. 탈퇴하면 해당 계정과 작품이 함께 삭제됩니다. |
| 작품 등록과 조회 | 에디터에서 그림을 그리고 게시 준비를 누릅니다. 전시 미리보기와 제목, 선택 설명, 공개 여부를 확인한 뒤 저장합니다. 공개 작품은 갤러리나 작품 링크에서, 비공개 작품은 소유자가 마이페이지에서 볼 수 있습니다. |
| 작품 수정과 삭제 | 마이페이지에서 저장한 그림을 다시 열고 수정하거나 삭제합니다. 서버는 로그인 계정과 작품 소유자가 일치할 때만 요청을 처리합니다. |
| JOIN 조회 | 공개 갤러리에서 작품과 제작자의 닉네임을 확인합니다. `artworks.user_id`와 `users.id`를 JOIN하므로 닉네임 변경은 갤러리에 반영됩니다. |

`client/src/pages`는 화면, `server/src/auth.js`는 회원 및 로그인 API, `server/src/artworks.js`는 작품 CRUD와 JOIN 조회를 담당합니다. 테이블 정의는 `server/sql/schema.sql`에 있습니다.

클라이언트 점검은 `client`에서 `npm run lint`와 `npm run build`로 실행합니다.
