# K-MFDS FoodDB MCP Server (FoodNtrCpntDbInfo03 포크)

식품의약품안전처 식품영양성분DB를 MCP 도구로 조회하는 서버입니다.

[slicequeue/k-mfds-fooddb-mcp-server](https://github.com/slicequeue/k-mfds-fooddb-mcp-server)를 포크해 공공데이터포털의 `FoodNtrCpntDbInfo03` 서비스를 호출하도록 고쳤습니다.

> **npm에 배포하지 않았습니다.** `npx k-mfds-fooddb-mcp-server`를 실행하면 이 포크가 아니라 원작 1.0.7이 설치됩니다. 아래 방법으로 소스에서 설치하세요.

## 원작과 달라진 점

| 항목 | 원작 1.0.7 | 이 포크 |
|---|---|---|
| 호출 서비스 | `FoodNtrCpntDbInfo02` (HTTP) | `FoodNtrCpntDbInfo03` (HTTPS) |
| 영양성분 표 | 159개, `FoodNtrCpntDbInfo03` 명세와 141개 불일치 | 공식 명세 157개 |
| 쉼표가 있는 값 | `1,010.000`을 1로 읽음 | 1010으로 읽음 |
| `SERVING_SIZE` 표시 | "1회 섭취량" | "영양성분 기준량" (공식 정의: 영양성분함량기준량) |
| 추가 출력 | 없음 | 구분, 1회 섭취참고량, 식품중량 |
| 표에 없는 성분 코드 | 검색 전체 실패 | 코드명으로 표시 |
| 날짜 파라미터 설명 | `YYYYMMDD` (결과 0건) | `YYYY-MM-DD` |

`axios`와 MCP SDK도 최신 버전으로 올렸습니다.

표 불일치의 예를 들면, `AMT_NUM23`은 공식 명세에서 콜레스테롤(mg)인데 원작은 포화지방산(g)으로 표시합니다.

### 서비스를 바꾼 이유

이 포크를 만들 때 쓴 인증키로는 `FoodNtrCpntDbInfo02`가 403을 반환했고 `FoodNtrCpntDbInfo03`은 정상 동작했습니다. 공공데이터포털 페이지에도 `FoodNtrCpntDbInfo03`만 나옵니다.

`FoodNtrCpntDbInfo02`만 신청한 기존 키에서 어떻게 동작하는지는 확인하지 못했습니다. 이 포크는 `FoodNtrCpntDbInfo03`만 호출합니다.

## 설치

Node.js 18 이상이 필요합니다.

```bash
git clone https://github.com/Shawn-CAIO/k-mfds-fooddb-mcp-server.git
cd k-mfds-fooddb-mcp-server
npm ci --ignore-scripts
npm run build
```

## 인증키

1. [공공데이터포털 식품영양성분DB정보](https://www.data.go.kr/data/15127578/openapi.do)에서 활용신청을 합니다.
2. 마이페이지에서 **일반 인증키(Decoding)** 를 복사합니다.

서버가 키를 URL 인코딩하므로, Encoding 키를 넣으면 이중 인코딩되어 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`(403)가 납니다.

## MCP 클라이언트 설정

**Claude Code**

```bash
claude mcp add --transport stdio --scope user k-mfds-fooddb --env "GOV_API_KEY=디코딩_키" -- node /절대경로/k-mfds-fooddb-mcp-server/dist/index.js
```

**JSON 설정을 쓰는 클라이언트**

```json
{
  "mcpServers": {
    "k-mfds-fooddb": {
      "command": "node",
      "args": ["/절대경로/k-mfds-fooddb-mcp-server/dist/index.js"],
      "env": { "GOV_API_KEY": "디코딩_키" }
    }
  }
}
```

Claude Code에서만 테스트했습니다.

## 도구

### `searchFoodNutrition`

식품명, 제조사, 분류 등으로 영양성분을 검색합니다. `foodNameKr`, `makerName`, `foodCategory1Name`, `itemReportNo` 중 하나는 꼭 넣어야 합니다.

| 파라미터 | 설명 |
|---|---|
| `foodNameKr` | 식품명 (예: `신라면`) |
| `makerName` | 제조사명 (예: `농심`) |
| `foodCategory1Name` | 식품 대분류명 (예: `빵 및 과자류`) |
| `itemReportNo` | 품목제조보고번호 |
| `dbClassName` | `품목대표` 또는 `상용제품` |
| `researchYearMonthDate` | 데이터 생성일자 (`YYYY-MM-DD`) |
| `updateDate` | 데이터 수정일자 (`YYYY-MM-DD`) |
| `pageNo` | 페이지 번호 (기본값 1) |
| `numOfRows` | 한 페이지 결과 수 (기본값 10) |

요청 `{ "foodNameKr": "신라면건면사발", "makerName": "농심", "numOfRows": 1 }`의 실제 응답입니다.

```text
1. 신라면건면사발
- 구분: 가공식품
- 제조사: (주)농심
- 카테고리: 면류 > 국수
- 영양성분 기준량: 100g
- 1회 섭취참고량: 생·숙면 200g, 건면 100g, 당면 30g, 유탕면(봉지)120g, 유탕면(용기)80g
- 식품중량: 77.00g
- 영양성분: 에너지: 370kcal, 단백질: 9.09g, 지방: 5.71g, 탄수화물: 70.13g, 당류: 6.49g, 나트륨: 2117mg, 콜레스테롤: 6.49mg, 포화지방산: 1.82g, 트랜스지방산: 0g
- 품목제조보고번호: 2007014900270
- 데이터생성일: 2024-12-31

총 1개 중 1개 결과 (페이지 1/1)
```

### `getNutritionComponentTypes`

조회할 수 있는 영양성분 157개의 이름과 코드를 돌려줍니다. 입력값은 없습니다.

## 쓸 때 알아 둘 점

- **수치는 기준량 기준입니다.** 위 예시의 나트륨 2117mg은 100g 기준입니다. 제품 전체나 1회 섭취량 기준이 아닙니다.
- **검색은 포함 검색이고 관련도 정렬이 없습니다.** `사과`는 3,083건이 나오고 첫 결과가 사과파이입니다. 이름을 구체적으로 넣으세요.
- **원본 DB에 이상값이 있습니다.** 표본 777행 중 2행에서 불가능한 값을 봤습니다(예: 달걀말이 포화지방산 265g, 지방 전체는 5.33g). 서버는 값을 고치지 않고 그대로 보여 줍니다. 건강과 관련된 판단에는 원본 자료와 전문가 의견을 함께 확인하세요.

## 알려진 한계

- API 오류가 나도 MCP 응답에 `isError`가 붙지 않고, 일부 오류 메시지는 원인을 알기 어렵습니다.
- `npx tsc --noEmit`을 실행하면 `src/index.ts`에서 TS2589가 납니다. MCP SDK 업데이트 후 생긴 타입 검사 문제로, 빌드와 실행에는 영향이 없습니다.
- `npm audit`에 `zod` 3의 메모리 고갈 취약점이 나옵니다. 고치려면 호환성이 깨지는 메이저 업데이트가 필요해 그대로 두었습니다.

## 테스트

실제 API를 호출하는 테스트가 포함되어 있어 인증키가 필요합니다.

```bash
GOV_API_KEY=디코딩_키 npm test
```

## 유지보수

개인적으로 쓰려고 고친 포크이며 유지보수나 답변을 보장하지 않습니다. 공공데이터포털 API가 바뀌면 동작하지 않을 수 있습니다.

## 라이선스

[ISC](LICENSE). 원작자는 [slicequeue](https://github.com/slicequeue)입니다.
