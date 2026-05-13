const fs = require('fs');

const TYPE_HIERARCHY_MAP = {
  "A": {
    "1. 기획·기술 조사": { "A. S/W 기획": ["A-1. 제품 기획서", "A-2. 사업 계획서"], "B. 시장·기술 조사": ["B-1. 경쟁사 분석", "B-2. 관련 논문 및 특허"], "C. 요구사항 정의": ["C-1. 요구사항 명세서", "C-2. 사용자 인터뷰"] },
    "2. 엔지니어링 설계·이론": { "A. 설계 기준·규정": ["A-1. 국내외 설계 기준", "A-2. 적용 법규"], "B. 엔지니어링 기본 개념": ["B-1. 기본 이론서", "B-2. 개념 설계도"], "C. 구조해석·구조계산서": ["C-1. 해석 모델링", "C-2. 구조 계산서"] },
    "3. 기능 및 화면 구성": { "A. 요구사항 명세(추적)": ["A-1. 요구사항 추적 매트릭스"], "B. 기능 정의서": ["B-1. 기능 정의서", "B-2. 상태 다이어그램"], "C. UI·UX 설계": ["C-1. 스토리보드", "C-2. 화면 흐름도"] },
    "4. 개발·구현": { "A. 아키텍처, 상세 설계": ["A-1. 시스템 아키텍처도", "A-2. 상세 설계서"], "B. DB 설계": ["B-1. ERD", "B-2. 테이블 정의서"], "C. 소스 코드": ["C-1. Frontend 소스", "C-2. Backend 소스"], "D. 단위 테스트 결과서": ["D-1. 단위 테스트 리포트"], "E. 빌드·배포 가이드": ["E-1. 빌드 스크립트", "E-2. 배포 매뉴얼"] },
    "5. 검수·품질관리": { "A. 테스트 계획서": ["A-1. 통합 테스트 계획", "A-2. 인수 테스트 계획"], "B. 계산·검증 보고서": ["B-1. 해석 검증 보고서", "B-2. 성능 검증 결과"], "C. 사용자 테스트": ["C-1. UAT 시나리오", "C-2. UAT 결과서"], "D. 사용자 매뉴얼": ["D-1. 사용자 가이드", "D-2. 관리자 가이드"], "E. Release Note": ["E-1. 패치 노트", "E-2. 버전 릴리즈 노트"] }
  },
  "B": {
    "1. 기획·기술 조사": { "A. S/W 기획": ["A-1. 플랫폼 기획서", "A-2. 로드맵"], "B. 데이터 현황 조사": ["B-1. 공공 데이터 목록", "B-2. 수집 데이터 현황"], "C. 요구사항 정의": ["C-1. 데이터 요구사항 명세서"] },
    "2. 데이터 설계·구조": { "A. 데이터 모델링": ["A-1. 논리 모델", "A-2. 물리 모델"], "B. 데이터 프로세스 설계": ["B-1. ETL 파이프라인 설계", "B-2. 데이터 플로우"], "C. DB 스키마 설계": ["C-1. DDL 스크립트", "C-2. 인덱스 설계서"] },
    "3. 기능 및 화면 구성": { "A. 요구사항 명세(추적)": ["A-1. 요구사항 정의 및 추적표"], "B. 기능 정의·API 명세": ["B-1. 플랫폼 기능 정의서", "B-2. 데이터 API 명세서"], "C. UI·UX 설계": ["C-1. 대시보드 화면 설계서", "C-2. 포털 UI 설계"] },
    "4. 개발·구현": { "A. 아키텍처 설계": ["A-1. 클라우드 아키텍처", "A-2. 네트워크 구성도"], "B. DB 구현 스크립트": ["B-1. 초기 데이터 구축", "B-2. 마이그레이션 스크립트"], "C. API 개발 및 소스 코드": ["C-1. 데이터 API 소스", "C-2. 플랫폼 소스"], "D. 빌드·배포 환경 가이드": ["D-1. Docker/K8s 설정", "D-2. CI/CD 파이프라인"] },
    "5. 연동·검증": { "A. 데이터 품질 검사 절차서": ["A-1. 품질 검사 스크립트", "A-2. 정합성 검증 결과"], "B. 성능 테스트 계획 및 결과": ["B-1. 대용량 쿼리 테스트", "B-2. 부하 테스트 결과"], "C. 연동 테스트": ["C-1. 내외부 시스템 연동 결과", "C-2. 인터페이스 테스트"], "D. 운영 매뉴얼": ["D-1. 시스템 운영 매뉴얼", "D-2. 백업/복구 지침"] }
  },
  "C": {
    "1. 기획·기술 조사": { "A. S/W 기획": ["A-1. 서비스 기획서", "A-2. 사업 모델 정의"], "B. 유사 서비스 조사": ["B-1. 경쟁 서비스 분석", "B-2. 트렌드 리포트"], "C. BM 요구사항 정의": ["C-1. 비즈니스 요구사항 명세서"] },
    "2. UX·화면설계": { "A. UI·UX 목업": ["A-1. 와이어프레임", "A-2. 프로토타입"], "B. 디자인 시스템": ["B-1. 디자인 토큰", "B-2. 컴포넌트 라이브러리 가이드"], "C. 기능·화면 통합 정의": ["C-1. 화면 정의서(SB)", "C-2. 인터랙션 정의서"] },
    "3. API 명세": { "A. 사용자 시나리오": ["A-1. 유스케이스 정의", "A-2. 고객 여정 지도"], "B. API 명세": ["B-1. REST API 명세서", "B-2. GraphQL 스키마"], "C. 권한·인증·규칙 설계": ["C-1. 권한 매트릭스", "C-2. 보안 정책 정의서"] },
    "4. 개발·구현": { "A. Frontend 설계서": ["A-1. 상태 관리 아키텍처", "A-2. 라우팅 설계서"], "B. Backend 아키텍처": ["B-1. MSA 아키텍처 구성도", "B-2. 도메인 모델링"], "C. DB 설계": ["C-1. ERD 및 테이블 정의서"], "D. 소스 코드": ["D-1. 클라이언트 코드", "D-2. 서버 코드"] },
    "5. 운영·배포": { "A. 테스트 계획 및 결과": ["A-1. QA 테스트 케이스", "A-2. QA 결과 보고서"], "B. 사용자 테스트 결과": ["B-1. 베타 테스트 리포트"], "C. 사용자 매뉴얼&가이드": ["C-1. 사용자 매뉴얼", "C-2. FAQ/도움말 자료"], "D. 배포 이력": ["D-1. 릴리즈 노트", "D-2. 배포 점검표"], "E. 장애 대응 매뉴얼": ["E-1. 트러블슈팅 가이드", "E-2. 에스컬레이션 정책"] }
  },
  "D": {
    "1. 기획·기술 조사": { "A. S/W 기획": ["A-1. 엔진 개발 기획서", "A-2. 로드맵"], "B. 유사 기술·서비스 조사": ["B-1. 국내외 기술 동향", "B-2. 벤치마크 리포트"], "C. 요구사항 정의": ["C-1. 기술 요구사항 명세서"] },
    "2. 알고리즘·모델링": { "A. 통합 알고리즘 설계": ["A-1. 핵심 알고리즘 정의서", "A-2. 수식 전개도"], "B. 수치 해석 방법론": ["B-1. 해석 기법 정의서", "B-2. 성능 최적화 방안"], "C. 프로토타이핑/시뮬레이션": ["C-1. 시뮬레이션 결과 리포트", "C-2. PoC 결과서"] },
    "3. 아키텍처·기술 설계": { "A. 아키텍처, 모듈 구조": ["A-1. 코어 아키텍처 명세서", "A-2. 모듈간 종속성 다이어그램"], "B. 렌더링/데이터 파이프라인": ["B-1. 파이프라인 설계도", "B-2. 데이터 처리 흐름도"], "C. 기술 사양, 인터페이스": ["C-1. 내부 API 규격서", "C-2. 외부 연동 명세서"] },
    "4. 개발·구현": { "A. 상세 설계서": ["A-1. 클래스/모듈 상세 설계서", "A-2. 함수 정의서"], "B. API 설계": ["B-1. SDK API 명세서"], "C. 소스 코드": ["C-1. 엔진 코어 소스", "C-2. 유틸리티 소스"], "D. 샘플 코드·데모": ["D-1. 데모 프로젝트", "D-2. 튜토리얼 예제"], "E. 빌드·배포 환경 설정": ["E-1. CMake/Makefile 설정", "E-2. 패키징 스크립트"] },
    "5. 검증·테스트": { "A. 단위 테스트": ["A-1. 단위 테스트 코드", "A-2. 커버리지 리포트"], "B. 성능 검증": ["B-1. 벤치마크 테스트 결과", "B-2. 메모리/프로파일링 보고서"], "C. 통합 테스트 시나리오": ["C-1. 모듈 통합 테스트 계획서"], "D. 테스트 결과": ["D-1. 최종 검증 보고서", "D-2. 결함 추적 목록"] }
  }
};

const TITLES = {
  "A": "TYPE A : 엔지니어링 솔루션형 상세 구조",
  "B": "TYPE B : GIS·데이터 플랫폼형 상세 구조",
  "C": "TYPE C : 시각화·서비스형 상세 구조",
  "D": "TYPE D : 그래픽·엔진형 상세 구조"
};

const FOLDER_TREE_DATA = {};
for (let type of ["A", "B", "C", "D"]) {
  let tree = [];
  const map = TYPE_HIERARCHY_MAP[type];
  for (let depth2Name in map) {
    let highlight = depth2Name.includes("핵심") || depth2Name.includes("설계") || depth2Name.includes("UX") || depth2Name.includes("알고리즘") || depth2Name.includes("아키텍처");
    if(depth2Name === "데이터 설계·구조" || depth2Name === "엔지니어링 설계·이론" || depth2Name === "UX·화면설계" || depth2Name === "알고리즘·모델링" || depth2Name === "아키텍처·기술 설계") highlight = true;
    else highlight = false;

    let d2 = { depth: 1, name: depth2Name };
    if (highlight) d2.highlight = true;
    tree.push(d2);

    for (let depth3Name in map[depth2Name]) {
      let d3 = { depth: 2, name: depth3Name };
      if (highlight) d3.highlight = true;
      tree.push(d3);

      for (let depth4Name of map[depth2Name][depth3Name]) {
        tree.push({ depth: 3, name: depth4Name });
      }
    }
  }
  FOLDER_TREE_DATA[type] = { title: TITLES[type], tree: tree };
}

let content = fs.readFileSync('twin_pm.js', 'utf8');

// Replace TYPE_HIERARCHY_MAP
const thmRegex = /const TYPE_HIERARCHY_MAP = \{[\s\S]*?\n\};\n/;
const thmStr = 'const TYPE_HIERARCHY_MAP = ' + JSON.stringify(TYPE_HIERARCHY_MAP, null, 2) + ';\n';
content = content.replace(thmRegex, thmStr);

// Replace FOLDER_TREE_DATA
const ftdRegex = /const FOLDER_TREE_DATA = \{[\s\S]*?\n\};\n/;

// Format FOLDER_TREE_DATA cleanly so it's readable
let ftdStr = "const FOLDER_TREE_DATA = {\n";
for (let type of ["A", "B", "C", "D"]) {
  ftdStr += `  ${type}: {\n    title: "${TITLES[type]}",\n    tree: [\n`;
  const tree = FOLDER_TREE_DATA[type].tree;
  let lines = [];
  for(let i=0; i<tree.length; i++) {
    let item = tree[i];
    let hl = item.highlight ? ', highlight: true' : '';
    lines.push(`      { depth: ${item.depth}, name: "${item.name}"${hl} }`);
  }
  ftdStr += lines.join(",\n") + "\n    ]\n  }" + (type === "D" ? "\n" : ",\n");
}
ftdStr += "};\n";

content = content.replace(ftdRegex, ftdStr);

fs.writeFileSync('twin_pm.js', content, 'utf8');
console.log('Successfully updated twin_pm.js!');
