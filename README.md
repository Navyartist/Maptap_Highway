# Maptap Highway

비운전자들의 도로 파악을 위한 공공데이터 활용 톨게이트 영업소 지도입니다. 추후 휴게소 위치, 지도 API를 추가할 예정입니다. 감사해요!
hello, Maptap Highway is a visualization map page for Korean highway toll gates. next up: planning to add location for rest areas and a map API. Thank you!

Deployment Link: https://maptap-highway.pages.dev/

---

## 로컬 개발 환경 설정

### 1. 사전 준비

- [공공데이터포털](https://www.data.go.kr)에서 **한국도로공사 도로 위치정보 API** 키 발급

### 2. 저장소 클론

```bash
git clone https://github.com/Navyartist/Maptap_Highway.git
cd Maptap_Highway
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 API 키를 입력합니다.

```
ROAD_API_KEY=발급받은_API키
```

> `.env` 파일은 `.gitignore`에 추가해 API 키가 외부에 노출되지 않도록 주의하세요.

### 5. 데이터 생성

```bash
node -e "require('dotenv').config(); require('./fetch_data.js')"
```

실행 후 프로젝트 루트에 `data.json`이 생성됩니다.

### 6. 로컬 서버 실행

`data.json`을 `fetch`로 불러오기 때문에 로컬 서버를 통해 실행할 수 있습니다.

**VS Code**: Live Server 확장 설치 후 `index.html`에서 우클릭 → `Open with Live Server`

**터미널**:
```bash
npx serve .
```
