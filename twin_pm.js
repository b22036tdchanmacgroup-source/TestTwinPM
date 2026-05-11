const API_URL = 'https://script.google.com/macros/s/AKfycby2KkMv5VENy07lmRaC4lnPdumG-PQzc78wlkN_sIagXFSHIBlUAfZ1mQCH9OEsxfUsrg/exec'; 
let allData = [];
let swGroups = {};
let currentSW = null;
let currentTab = null;
let currentSubCat = null;
let categoryOrder = [];
let swOrder = [];

document.addEventListener('DOMContentLoaded', () => {
  if (API_URL) {
    loadFromGoogleSheet();
  } else {
    allData = getSampleData();
    buildStructure();
    renderMainScreen();
    updateStatus(false);
  }
});

async function loadFromGoogleSheet() {
  showLoading(true);
  try {
    const resp = await fetch(API_URL);
    if (!resp.ok) throw new Error('Network error');
    allData = await resp.json();
    updateStatus(true);
    buildStructure();
    renderMainScreen();
  } catch (err) {
    allData = getSampleData();
    buildStructure();
    renderMainScreen();
    updateStatus(false);
  }
  showLoading(false);
}

function updateStatus(isLive) {
  const badge = document.getElementById('data-status-badge');
  const text = document.getElementById('data-status-text');
  badge.style.background = isLive ? '#00ff00' : '#ff4444';
  text.textContent = isLive ? 'LIVE' : 'SAMPLE DATA';
}

function getSampleData() {
  // Ensuring we have data for both Engineering (Left) and Management (Right)
  return [
    { depth1: '구조분야:BridgePlanner', depth2: '1.기획·조사', depth3: 'A.개요·일반사항', depth4: 'A-1 개요 및 일반사항', manager: '한이', filename: '01 [개요]개발이력_25.11.03.xlsx', author: '맥이', date: '2026.04.21', size: '80.5 KB', status: '승인' },
    { depth1: '구조분야:BridgePlanner', depth2: '1.기획·조사', depth3: 'A.개요·일반사항', depth4: 'A-1 개요 및 일반사항', manager: '한이', filename: '02 [일반사항] 교량설계 아이템 분류_24.06.14.xlsx', author: '맥이', date: '2026.04.21', size: '21.4 KB', status: '승인' },
    { depth1: '수리분야:RiverFlow', depth2: '1.기획·조사', depth3: 'A.개요·일반사항', depth4: 'A-1 개요 및 일반사항', manager: '김이', filename: '수리해석_가이드.pdf', author: '최이', date: '2026.04.22', size: '1.2 MB', status: '승인' },
    { depth1: '총괄기획:Migration Simulator', depth2: '1.현황분석', depth3: 'A.시스템분석', depth4: 'A-1 분석자료', manager: '박이', filename: '마이그레이션_전략_v1.0.docx', author: '이이', date: '2026.04.25', size: '45.2 KB', status: '진행' },
    { depth1: '기획실:ERP Migration', depth2: '1.현황분석', depth3: 'A.데이터분석', depth4: 'A-1 데이터맵', manager: '정이', filename: 'ERP_연동_정의서.xlsx', author: '권이', date: '2026.04.26', size: '92.1 KB', status: '승인' }
  ];
}

const FOLDER_TYPES = {
  "A": ["1. 기획·기술 조사", "2. 엔지니어링 설계·이론", "3. 기능 및 화면 구성", "4. 개발·구현", "5. 검수·품질관리", "6. 작업장(기획부서)", "7. 작업장(개발부서)"],
  "B": ["1. 기획·기술 조사", "2. 데이터 설계·구조", "3. 기능 및 화면 구성", "4. 개발·구현", "5. 연동·검증", "6. 작업장(기획부서)", "7. 작업장(개발부서)"],
  "C": ["1. 기획·기술 조사", "2. UX·화면설계", "3. API 명세", "4. 개발·구현", "5. 운영·배포", "6. 작업장(기획부서)", "7. 작업장(개발부서)"],
  "D": ["1. 기획·기술 조사", "2. 알고리즘·모델링", "3. 아키텍처·기술 설계", "4. 개발·구현", "5. 검증·테스트", "6. 작업장(기획부서)", "7. 작업장(개발부서)"]
};

// 유형별/탭별 표준 폴더 체계 정의
const TYPE_HIERARCHY_MAP = {
  "A": {
    "1. 기획·기술 조사": {
      "A. S/W 기획": [
        "A-1. 제품 기획서",
        "A-2. 사업 계획서"
      ],
      "B. 시장·기술 조사": [
        "B-1. 경쟁사 분석",
        "B-2. 관련 논문 및 특허"
      ],
      "C. 요구사항 정의": [
        "C-1. 요구사항 명세서",
        "C-2. 사용자 인터뷰"
      ]
    },
    "2. 엔지니어링 설계·이론": {
      "A. 설계 기준·규정": [
        "A-1. 국내외 설계 기준",
        "A-2. 적용 법규"
      ],
      "B. 엔지니어링 기본 개념": [
        "B-1. 기본 이론서",
        "B-2. 개념 설계도"
      ],
      "C. 구조해석·구조계산서": [
        "C-1. 해석 모델링",
        "C-2. 구조 계산서"
      ]
    },
    "3. 기능 및 화면 구성": {
      "A. 요구사항 명세(추적)": [
        "A-1. 요구사항 추적 매트릭스"
      ],
      "B. 기능 정의서": [
        "B-1. 기능 정의서",
        "B-2. 상태 다이어그램"
      ],
      "C. UI·UX 설계": [
        "C-1. 스토리보드",
        "C-2. 화면 흐름도"
      ]
    },
    "4. 개발·구현": {
      "A. 아키텍처, 상세 설계": [
        "A-1. 시스템 아키텍처도",
        "A-2. 상세 설계서"
      ],
      "B. DB 설계": [
        "B-1. ERD",
        "B-2. 테이블 정의서"
      ],
      "C. 소스 코드": [
        "C-1. Frontend 소스",
        "C-2. Backend 소스"
      ],
      "D. 단위 테스트 결과서": [
        "D-1. 단위 테스트 리포트"
      ],
      "E. 빌드·배포 가이드": [
        "E-1. 빌드 스크립트",
        "E-2. 배포 매뉴얼"
      ]
    },
    "5. 검수·품질관리": {
      "A. 테스트 계획서": [
        "A-1. 통합 테스트 계획",
        "A-2. 인수 테스트 계획"
      ],
      "B. 계산·검증 보고서": [
        "B-1. 해석 검증 보고서",
        "B-2. 성능 검증 결과"
      ],
      "C. 사용자 테스트": [
        "C-1. UAT 시나리오",
        "C-2. UAT 결과서"
      ],
      "D. 사용자 매뉴얼": [
        "D-1. 사용자 가이드",
        "D-2. 관리자 가이드"
      ],
      "E. Release Note": [
        "E-1. 패치 노트",
        "E-2. 버전 릴리즈 노트"
      ]
    }
  },
  "B": {
    "1. 기획·기술 조사": {
      "A. S/W 기획": [
        "A-1. 플랫폼 기획서",
        "A-2. 로드맵"
      ],
      "B. 데이터 현황 조사": [
        "B-1. 공공 데이터 목록",
        "B-2. 수집 데이터 현황"
      ],
      "C. 요구사항 정의": [
        "C-1. 데이터 요구사항 명세서"
      ]
    },
    "2. 데이터 설계·구조": {
      "A. 데이터 모델링": [
        "A-1. 논리 모델",
        "A-2. 물리 모델"
      ],
      "B. 데이터 프로세스 설계": [
        "B-1. ETL 파이프라인 설계",
        "B-2. 데이터 플로우"
      ],
      "C. DB 스키마 설계": [
        "C-1. DDL 스크립트",
        "C-2. 인덱스 설계서"
      ]
    },
    "3. 기능 및 화면 구성": {
      "A. 요구사항 명세(추적)": [
        "A-1. 요구사항 정의 및 추적표"
      ],
      "B. 기능 정의·API 명세": [
        "B-1. 플랫폼 기능 정의서",
        "B-2. 데이터 API 명세서"
      ],
      "C. UI·UX 설계": [
        "C-1. 대시보드 화면 설계서",
        "C-2. 포털 UI 설계"
      ]
    },
    "4. 개발·구현": {
      "A. 아키텍처 설계": [
        "A-1. 클라우드 아키텍처",
        "A-2. 네트워크 구성도"
      ],
      "B. DB 구현 스크립트": [
        "B-1. 초기 데이터 구축",
        "B-2. 마이그레이션 스크립트"
      ],
      "C. API 개발 및 소스 코드": [
        "C-1. 데이터 API 소스",
        "C-2. 플랫폼 소스"
      ],
      "D. 빌드·배포 환경 가이드": [
        "D-1. Docker/K8s 설정",
        "D-2. CI/CD 파이프라인"
      ]
    },
    "5. 연동·검증": {
      "A. 데이터 품질 검사 절차서": [
        "A-1. 품질 검사 스크립트",
        "A-2. 정합성 검증 결과"
      ],
      "B. 성능 테스트 계획 및 결과": [
        "B-1. 대용량 쿼리 테스트",
        "B-2. 부하 테스트 결과"
      ],
      "C. 연동 테스트": [
        "C-1. 내외부 시스템 연동 결과",
        "C-2. 인터페이스 테스트"
      ],
      "D. 운영 매뉴얼": [
        "D-1. 시스템 운영 매뉴얼",
        "D-2. 백업/복구 지침"
      ]
    }
  },
  "C": {
    "1. 기획·기술 조사": {
      "A. S/W 기획": [
        "A-1. 서비스 기획서",
        "A-2. 사업 모델 정의"
      ],
      "B. 유사 서비스 조사": [
        "B-1. 경쟁 서비스 분석",
        "B-2. 트렌드 리포트"
      ],
      "C. BM 요구사항 정의": [
        "C-1. 비즈니스 요구사항 명세서"
      ]
    },
    "2. UX·화면설계": {
      "A. UI·UX 목업": [
        "A-1. 와이어프레임",
        "A-2. 프로토타입"
      ],
      "B. 디자인 시스템": [
        "B-1. 디자인 토큰",
        "B-2. 컴포넌트 라이브러리 가이드"
      ],
      "C. 기능·화면 통합 정의": [
        "C-1. 화면 정의서(SB)",
        "C-2. 인터랙션 정의서"
      ]
    },
    "3. API 명세": {
      "A. 사용자 시나리오": [
        "A-1. 유스케이스 정의",
        "A-2. 고객 여정 지도"
      ],
      "B. API 명세": [
        "B-1. REST API 명세서",
        "B-2. GraphQL 스키마"
      ],
      "C. 권한·인증·규칙 설계": [
        "C-1. 권한 매트릭스",
        "C-2. 보안 정책 정의서"
      ]
    },
    "4. 개발·구현": {
      "A. Frontend 설계서": [
        "A-1. 상태 관리 아키텍처",
        "A-2. 라우팅 설계서"
      ],
      "B. Backend 아키텍처": [
        "B-1. MSA 아키텍처 구성도",
        "B-2. 도메인 모델링"
      ],
      "C. DB 설계": [
        "C-1. ERD 및 테이블 정의서"
      ],
      "D. 소스 코드": [
        "D-1. 클라이언트 코드",
        "D-2. 서버 코드"
      ]
    },
    "5. 운영·배포": {
      "A. 테스트 계획 및 결과": [
        "A-1. QA 테스트 케이스",
        "A-2. QA 결과 보고서"
      ],
      "B. 사용자 테스트 결과": [
        "B-1. 베타 테스트 리포트"
      ],
      "C. 사용자 매뉴얼&가이드": [
        "C-1. 사용자 매뉴얼",
        "C-2. FAQ/도움말 자료"
      ],
      "D. 배포 이력": [
        "D-1. 릴리즈 노트",
        "D-2. 배포 점검표"
      ],
      "E. 장애 대응 매뉴얼": [
        "E-1. 트러블슈팅 가이드",
        "E-2. 에스컬레이션 정책"
      ]
    }
  },
  "D": {
    "1. 기획·기술 조사": {
      "A. S/W 기획": [
        "A-1. 엔진 개발 기획서",
        "A-2. 로드맵"
      ],
      "B. 유사 기술·서비스 조사": [
        "B-1. 국내외 기술 동향",
        "B-2. 벤치마크 리포트"
      ],
      "C. 요구사항 정의": [
        "C-1. 기술 요구사항 명세서"
      ]
    },
    "2. 알고리즘·모델링": {
      "A. 통합 알고리즘 설계": [
        "A-1. 핵심 알고리즘 정의서",
        "A-2. 수식 전개도"
      ],
      "B. 수치 해석 방법론": [
        "B-1. 해석 기법 정의서",
        "B-2. 성능 최적화 방안"
      ],
      "C. 프로토타이핑/시뮬레이션": [
        "C-1. 시뮬레이션 결과 리포트",
        "C-2. PoC 결과서"
      ]
    },
    "3. 아키텍처·기술 설계": {
      "A. 아키텍처, 모듈 구조": [
        "A-1. 코어 아키텍처 명세서",
        "A-2. 모듈간 종속성 다이어그램"
      ],
      "B. 렌더링/데이터 파이프라인": [
        "B-1. 파이프라인 설계도",
        "B-2. 데이터 처리 흐름도"
      ],
      "C. 기술 사양, 인터페이스": [
        "C-1. 내부 API 규격서",
        "C-2. 외부 연동 명세서"
      ]
    },
    "4. 개발·구현": {
      "A. 상세 설계서": [
        "A-1. 클래스/모듈 상세 설계서",
        "A-2. 함수 정의서"
      ],
      "B. API 설계": [
        "B-1. SDK API 명세서"
      ],
      "C. 소스 코드": [
        "C-1. 엔진 코어 소스",
        "C-2. 유틸리티 소스"
      ],
      "D. 샘플 코드·데모": [
        "D-1. 데모 프로젝트",
        "D-2. 튜토리얼 예제"
      ],
      "E. 빌드·배포 환경 설정": [
        "E-1. CMake/Makefile 설정",
        "E-2. 패키징 스크립트"
      ]
    },
    "5. 검증·테스트": {
      "A. 단위 테스트": [
        "A-1. 단위 테스트 코드",
        "A-2. 커버리지 리포트"
      ],
      "B. 성능 검증": [
        "B-1. 벤치마크 테스트 결과",
        "B-2. 메모리/프로파일링 보고서"
      ],
      "C. 통합 테스트 시나리오": [
        "C-1. 모듈 통합 테스트 계획서"
      ],
      "D. 테스트 결과": [
        "D-1. 최종 검증 보고서",
        "D-2. 결함 추적 목록"
      ]
    }
  }
};

// 공통 단계별 폴더 체계
const COMMON_HIERARCHY = {
  "기능": { "A. 기능 요건": ["A-1. 요구사항 정의서"], "B. 화면 구성": ["B-1. UI 설계서"] },
  "요건": { "A. 기능 요건": ["A-1. 요구사항 정의서"], "B. 인터페이스": ["B-1. API 명세서"] },
  "개발": { "A. 시스템 구성": ["A-1. 아키텍처 다이어그램"], "B. 소스코드": ["B-1. 프론트엔드", "B-2. 백엔드"] },
  "검수": { "A. 테스트": ["A-1. 테스트 시나리오", "A-2. 검증 결과서"], "B. 품질관리": ["B-1. 결함 리포트"] },
  "검증": { "A. 테스트": ["A-1. 테스트 시나리오", "A-2. 검증 결과서"], "B. 품질관리": ["B-1. 결함 리포트"] },
  "운영": { "A. 운영 관리": ["A-1. 패치 노트", "A-2. 장애 로그"] }
};

const DEFAULT_SIDEBAR = { "A. 일반사항": ["A-1. 개요 및 기준"], "Z. 기타": ["Z-1. 참고 자료"] };

const SW_CONFIG = {
  "HmEG(HmDraw)": "D", "EG-BIM Modeler": "D", "EG-BIM Drawer": "D", "StrAna": "D",
  "천지인": "B", "GAIA": "B", "KNGIL": "B", "Survey Planner": "B", "GIS Mapper": "B", "Cadaster": "B",
  "BridgePlanner": "A", "DRZainer": "A", "NodularZainer": "A", "AbutZainer": "A", "PierZainer": "A", "BoxZainer": "A", "WallZainer": "A", "TunnelZainer": "A", "CulvertZainer": "A",
  "WayPrimal": "A", "WayConfirm": "A", "WayDraw": "C", "WayShop": "C", "TOVA": "C", "WatchBIM": "C", "Twin Highway": "A", "Roadway": "A",
  "LifeLine-Water": "A", "강우강도산정 프로그램": "A", "IPIPES": "A",
  "bCMf": "C", "GSIM": "C", "CCP": "C", "Domainer": "B", "단가/공정 solution": "A"
};

function buildStructure() {
  swGroups = {};
  categoryOrder = [];
  swOrder = [];
  
  allData.forEach(row => {
    let rawSw = row.depth1 || '기타';
    let category = '기타';
    let swName = rawSw;

    if (rawSw.includes(':')) {
      const parts = rawSw.split(':');
      category = parts[0].trim();
      swName = parts[1].trim();
    } else if (rawSw.includes('분야')) {
      category = rawSw.split('분야')[0].trim();
    }
    
    category = category.replace(/[\[\]]/g, '');
    row._swName = swName;

    if (!categoryOrder.includes(category)) {
      categoryOrder.push(category);
    }
    if (!swOrder.includes(swName)) {
      swOrder.push(swName);
    }

    // S/W 그룹이 처음 발견될 때 초기화 및 표준 구조 생성
    if (!swGroups[swName]) {
      const type = SW_CONFIG[swName] || "A";
      swGroups[swName] = { category: category, manager: row.manager || '-', type: type, tabs: {} };

      const d2Tabs = FOLDER_TYPES[type] || FOLDER_TYPES["A"];
      d2Tabs.forEach(tabName => {
        swGroups[swName].tabs[tabName] = {};
        
        // 작업장 폴더는 비워둠
        if (tabName.includes("작업장")) return;

        // 유형별/공통 레이아웃 선택
        let matchedLayout = null;
        for (let key in TYPE_HIERARCHY_MAP[type]) {
          if (tabName.includes(key)) { matchedLayout = TYPE_HIERARCHY_MAP[type][key]; break; }
        }
        if (!matchedLayout) {
          for (let key in COMMON_HIERARCHY) {
            if (tabName.includes(key)) { matchedLayout = COMMON_HIERARCHY[key]; break; }
          }
        }
        if (!matchedLayout) matchedLayout = DEFAULT_SIDEBAR;

        // 3, 4단계 구조 초기화
        Object.keys(matchedLayout).forEach(d3Name => {
          swGroups[swName].tabs[tabName][d3Name] = {};
          matchedLayout[d3Name].forEach(d4Name => {
            swGroups[swName].tabs[tabName][d3Name][d4Name] = [];
          });
        });
      });
    } else {
      // 기존에 생성된 경우 카테고리나 매니저 정보 업데이트 (필요 시)
      if (swGroups[swName].category === '기타' && category !== '기타') {
        swGroups[swName].category = category;
      }
      if (row.manager && row.manager !== '-') {
        swGroups[swName].manager = row.manager;
      }
    }

    const tab = row.depth2 || '기본';
    if (tab === '8. 기본' || tab === '기본') return;
    
    if (!swGroups[swName].tabs[tab]) {
      swGroups[swName].tabs[tab] = {};
    }
    
    const cat = row.depth3 || '기타';
    if (!swGroups[swName].tabs[tab][cat]) {
      swGroups[swName].tabs[tab][cat] = {};
    }
    
    const sub = row.depth4 || '목록';
    if (!swGroups[swName].tabs[tab][cat][sub]) {
      swGroups[swName].tabs[tab][cat][sub] = [];
    }
    
    swGroups[swName].tabs[tab][cat][sub].push(row);
  });
}


function renderMainScreen() {
  const leftContainer = document.getElementById('sw-cards-left');
  const rightContainer = document.getElementById('sw-cards-right');
  
  leftContainer.innerHTML = '';
  // We don't clear right side anymore because it's "Fixed" as per user request
  // But we will add dynamic right-side items if they are "Planning" related
  
  const folderIcon = `<svg viewBox="0 0 16 14"><path d="M14 2H8L6.6.6A1 1 0 0 0 5.9 0H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>`;
  
  // Group by category for left side
  const categories = {};
  Object.keys(swGroups).forEach(swName => {
    const group = swGroups[swName];
    const cat = group.category;
    
    // Fixed right side items: items belonging to Planning Office
    if (cat.includes('기획') || cat.includes('기획실') || cat.includes('총괄')) {
      // These will be rendered specially or kept as is
      return;
    }

    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(swName);
  });

  const sortedCategories = Object.keys(categories).sort((a, b) => {
    let idxA = categoryOrder.indexOf(a);
    let idxB = categoryOrder.indexOf(b);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });

  sortedCategories.forEach(cat => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'category-group';
    
    const label = document.createElement('div');
    label.className = 'category-label';
    label.innerHTML = cat.replace('(', '<br>(');

    const cardsCont = document.createElement('div');
    cardsCont.className = 'category-cards';
    
    const sortedSwNames = categories[cat].sort((a, b) => {
      let idxA = swOrder.indexOf(a);
      let idxB = swOrder.indexOf(b);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });

    sortedSwNames.forEach(swName => {
      const card = document.createElement('div');
      card.className = 'sw-card';
      card.onclick = () => openDetail(swName);
      
      const managerName = swGroups[swName].manager && swGroups[swName].manager !== '-' ? swGroups[swName].manager : '';
      const managerHtml = managerName ? `<span class="sw-card-manager">${managerName}</span>` : '';

      card.innerHTML = `
        <div class="sw-card-left">
          <span class="sw-card-name" style="font-size:13px;">${swName}</span>
        </div>
        ${managerHtml}
      `;
      cardsCont.appendChild(card);
    });
    
    groupDiv.appendChild(label);
    groupDiv.appendChild(cardsCont);
    leftContainer.appendChild(groupDiv);
  });
}


function openDetail(swKey) {
  currentSW = swKey ? swKey.trim() : "";
  const swInfo = swGroups[currentSW];
  document.getElementById('top-sw-name').textContent = swKey;

  // 가이드 뷰 초기화 (기본 가이드 화면으로)
  document.getElementById('guide-default-view').style.display = 'block';
  const valView = document.getElementById('guide-validation-view');
  if (valView) valView.style.display = 'none';
  const typeView = document.getElementById('guide-folder-type-view');
  if (typeView) typeView.style.display = 'none';
  
  const tabContainer = document.getElementById('detail-tabs');
  tabContainer.innerHTML = '';
  
  // Use standard tab order from FOLDER_TYPES
  const standardTabs = FOLDER_TYPES[swInfo.type] || FOLDER_TYPES["A"];
  let tabKeys = [...standardTabs];
  
  // Add any extra tabs from data that are not in standard list
  Object.keys(swInfo.tabs).forEach(tk => {
    if (!tabKeys.includes(tk) && tk !== '8. 기본' && tk !== '기본') tabKeys.push(tk);
  });

  const folderIcon = `<svg class="tab-icon" viewBox="0 0 16 14"><path d="M14 2H8L6.6.6A1 1 0 0 0 5.9 0H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>`;

  tabKeys.forEach((tabKey, i) => {
    const tab = document.createElement('div');
    tab.className = 'detail-tab' + (i === 0 ? ' active' : '');
    tab.dataset.tab = tabKey;
    tab.onclick = () => selectTab(tabKey);
    // Display tab name, removing numeric prefix if standard
    const displayName = tabKey.replace(/^\d+\.\s*/, '');
    tab.innerHTML = `${folderIcon} <span>${i + 1}. ${displayName}</span>`;
    tabContainer.appendChild(tab);
  });

  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('detail-screen').style.display = 'flex';
  
  setTimeout(checkTabOverflow, 50);

  if (tabKeys.length > 0) {
    selectTab(tabKeys[0]);
  }
}

function selectTab(tabKey) {
  currentTab = tabKey;
  const swInfo = swGroups[currentSW];
  const categories = swInfo.tabs[tabKey];
  const type = swInfo.type;
  
  const getPrefix = (str) => {
    const m = str.match(/^([A-Z](-\d+)?)(?=\.|\s|$)/);
    return m ? m[1] : str;
  };

  // Find matching sidebar layout based on type and tab name
  let sideLayout = null;
  if (tabKey.includes("작업장")) {
    sideLayout = {}; 
  } else {
    for (let key in TYPE_HIERARCHY_MAP[type]) {
      if (tabKey.includes(key)) { sideLayout = TYPE_HIERARCHY_MAP[type][key]; break; }
    }
    if (!sideLayout) {
      for (let key in COMMON_HIERARCHY) {
        if (tabKey.includes(key)) { sideLayout = COMMON_HIERARCHY[key]; break; }
      }
    }
    if (!sideLayout) sideLayout = DEFAULT_SIDEBAR;
  }

  document.getElementById('sidebar-sw-title').textContent = tabKey;

  document.querySelectorAll('.detail-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabKey);
  });

  const sidebar = document.getElementById('sidebar-content-area');
  sidebar.innerHTML = '';
  
  // 1. Merge Depth 3 (Categories) - Override default if prefix matches
  const catMap = {}; // prefix -> { title, defaultTitle }
  Object.keys(sideLayout).forEach(k => { 
    const p = getPrefix(k);
    catMap[p] = { title: k, defaultTitle: k }; 
  });
  Object.keys(categories).forEach(k => {
    const p = getPrefix(k);
    if (catMap[p]) {
      catMap[p].title = k; 
    } else {
      catMap[p] = { title: k, defaultTitle: null };
    }
  });

  const sortedCatPrefixes = Object.keys(catMap).sort();

  sortedCatPrefixes.forEach((prefix, ci) => {
    const catEntry = catMap[prefix];
    const catKey = catEntry.title;
    const defaultCatKey = catEntry.defaultTitle;

    const catDiv = document.createElement('div');
    catDiv.className = 'sidebar-category';
    catDiv.innerHTML = `
      <div class="sidebar-cat-title" style="display:flex; justify-content:space-between; align-items:center;">
        <span>${catKey}</span>
        <span class="edit-icon" onclick="editCategoryName(this, '${catKey.replace(/'/g, "\\'")}', 'depth3'); event.stopPropagation();" title="수정">✎</span>
      </div>`;

    // 2. Merge Depth 4 (Sub-categories) - Override default if prefix matches
    const subMap = {}; // prefix -> subTitle
    const defaultSubs = defaultCatKey ? (sideLayout[defaultCatKey] || []) : [];
    defaultSubs.forEach(k => { subMap[getPrefix(k)] = k; });
    
    const actualSubData = categories[catKey] || {};
    Object.keys(actualSubData).forEach(k => { subMap[getPrefix(k)] = k; });
    
    const sortedSubPrefixes = Object.keys(subMap).sort();
    
    sortedSubPrefixes.forEach((subPrefix, si) => {
      const subKey = subMap[subPrefix];
      const fileCount = countMainFiles(actualSubData[subKey]);
      const sub = document.createElement('div');
      sub.className = 'sidebar-sub' + (ci === 0 && si === 0 ? ' active' : '');
      sub.dataset.cat = catKey;
      sub.dataset.sub = subKey;
      sub.onclick = () => selectSubCategory(catKey, subKey);
      sub.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span>
            <span class="sidebar-sub-name">${subKey}</span>
            <span class="edit-icon" onclick="editCategoryName(this, '${subKey.replace(/'/g, "\\'")}', 'depth4'); event.stopPropagation();" title="수정">✎</span>
          </span>
          <span class="sidebar-sub-count">${fileCount}</span>
        </div>
      `;
      catDiv.appendChild(sub);
    });

    sidebar.appendChild(catDiv);
  });

  // Initial selection
  if (sortedCatPrefixes.length > 0) {
    const firstCatPrefix = sortedCatPrefixes[0];
    const firstCatKey = catMap[firstCatPrefix].title;
    const subMap = {};
    const defaultCatKey = catMap[firstCatPrefix].defaultTitle;
    const defaultSubs = defaultCatKey ? (sideLayout[defaultCatKey] || []) : [];
    defaultSubs.forEach(k => { subMap[getPrefix(k)] = k; });
    Object.keys(categories[firstCatKey] || {}).forEach(k => { subMap[getPrefix(k)] = k; });
    
    const sortedSubPrefixes = Object.keys(subMap).sort();
    if (sortedSubPrefixes.length > 0) {
      selectSubCategory(firstCatKey, subMap[sortedSubPrefixes[0]]);
    } else {
      renderEmptyTable();
    }
  } else {
    renderEmptyTable();
  }
}

function renderEmptyTable() {
  const tbody = document.getElementById('file-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:100px 0; color:#999; font-size:14px;">해당 단계에 등록된 파일이 없습니다.</td></tr>';
}

function countMainFiles(files) {
  if (Array.isArray(files)) {
    // Return total count of documents in this folder
    return files.length;
  }
  return 0;
}

window.editCategoryName = async function(element, oldName, depthLevel) {
  const parent = element.parentElement;
  
  if(parent.querySelector('input')) return; // 이미 수정중
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldName;
  input.className = 'edit-cat-input';
  
  const saveBtn = document.createElement('button');
  saveBtn.innerHTML = '✔';
  saveBtn.className = 'edit-cat-save';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.innerHTML = '✖';
  cancelBtn.className = 'edit-cat-cancel';
  
  const originalHtml = parent.innerHTML;
  parent.innerHTML = '';
  parent.appendChild(input);
  parent.appendChild(saveBtn);
  parent.appendChild(cancelBtn);
  
  input.focus();

  const restore = () => {
    parent.innerHTML = originalHtml;
  };

  const saveChange = async () => {
    const newName = input.value.trim();
    if (!newName) {
      restore();
      return;
    }
    if (newName === oldName) {
      restore();
      return;
    }
    
    showLoading(true);
    try {
      const payload = {
        action: 'update_category',
        swName: currentSW,
        depth2: currentTab,
        oldName: oldName,
        newName: newName,
        depthLevel: depthLevel
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if(result.status === 'success') {
        // Update local memory data
        allData.forEach(row => {
          if(row._swName === currentSW && row.depth2 === currentTab && row[depthLevel] === oldName) {
            row[depthLevel] = newName;
          }
        });
        buildStructure();
        selectTab(currentTab);
      } else {
        alert('수정 실패: ' + (result.message || '알 수 없는 오류'));
        restore();
      }
    } catch (err) {
      alert('통신 오류: ' + err.message);
      restore();
    } finally {
      showLoading(false);
    }
  };

  saveBtn.onclick = (e) => { e.stopPropagation(); saveChange(); };
  cancelBtn.onclick = (e) => { e.stopPropagation(); restore(); };
  input.onkeypress = (e) => { if(e.key === 'Enter') { e.stopPropagation(); saveChange(); } };
  input.onclick = (e) => e.stopPropagation();
};

function selectSubCategory(catKey, subKey) {
  currentSubCat = subKey;

  document.querySelectorAll('.sidebar-sub').forEach(s => {
    const match = (s.dataset.cat === catKey && s.dataset.sub === subKey);
    s.classList.toggle('active', match);
  });

  const group = swGroups[currentSW];
  const files = group.tabs[currentTab][catKey][subKey] || [];

  const tbody = document.getElementById('file-tbody');
  tbody.innerHTML = '';

  const setLastIndices = {};
  let tempSetId = 0;
  files.forEach((f, i) => {
    const isSub = f.filename.includes('_version') || f.filename.includes('버전') || f.filename.includes('_attachment') || f.filename.includes('첨부');
    if (!isSub) tempSetId = i;
    setLastIndices[tempSetId] = i;
  });

  let currentSetId = 0;
  files.forEach((file, idx) => {
    const isVersion = file.filename.includes('_version') || file.filename.includes('버전');
    const isAttach = file.filename.includes('_attachment') || file.filename.includes('첨부');
    const isSub = isVersion || isAttach;

    if (!isSub) currentSetId = idx;

    const tr = document.createElement('tr');
    tr.dataset.setId = currentSetId;
    if (!isSub) tr.classList.add('main-file-row', 'set-first');
    if (setLastIndices[currentSetId] === idx) tr.classList.add('set-last');

    tr.onclick = () => {
      document.querySelectorAll('#file-tbody tr').forEach(r => r.classList.remove('file-set-active'));
      document.querySelectorAll(`#file-tbody tr[data-set-id="${tr.dataset.setId}"]`).forEach(r => r.classList.add('file-set-active'));
    };
    
    let displayName = file.filename.replace('_version', '').replace('_attachment', '');
    let iconColor = "#999999";
    let ext = displayName.split('.').pop().toLowerCase();
    
    if (ext === 'hwp') iconColor = "#2196F3";
    else if (ext === 'pptx' || ext === 'ppt') iconColor = "#F44336";
    else if (ext === 'xlsx' || ext === 'xls') iconColor = "#4CAF50";
    else if (ext === 'pdf') iconColor = "#E91E63";
    
    let icon = `<svg class="file-row-icon" viewBox="0 0 16 16" fill="none"><path d="M4 2H10L14 6V14C14 14.5523 13.5523 15 13 15H4C3.44772 15 3 14.5523 3 14V3C3 2.44772 3.44772 2 4 2Z" fill="${iconColor}11" stroke="${iconColor}" stroke-width="1.2"/></svg>`;
    let prefix = '';
    let badge = '';

    if (isAttach) {
      icon = ''; 
      prefix = `<span class="indent-icon">└</span>`;
      badge = '<span class="badge-attach badge-attachment">첨부</span>';
    } else if (isVersion) {
      icon = ''; 
      prefix = `<span class="indent-icon">└</span>`;
      badge = '<span class="badge-attach badge-version">버전</span>';
    }

    const formattedDate = file.date.replace('T', ' ').substring(2, 16);

    const statusClass = file.status === '열람가능' ? 'status-available' : '';
    const hasMemo = Math.random() > 0.6;
    const memoIcon = hasMemo ? `<svg class="memo-icon has-memo" viewBox="0 0 16 16"><path d="M4 2h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm5 1H4v10h8V6H9V3zM5 5h2v1H5V5zm0 2h6v1H5V7zm0 2h6v1H5V9z"/></svg>` : `<svg class="memo-icon" viewBox="0 0 16 16"><path d="M4 2h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm5 1H4v10h8V6H9V3z"/></svg>`;

    tr.innerHTML = `
      <td><div class="file-icon">${prefix}${icon}${badge}<span style="color:#333; font-size:13px;">${displayName}</span></div></td>
      <td>${file.author}</td>
      <td>${file.author}</td>
      <td>${formattedDate}</td>
      <td>${file.size}</td>
      <td><span class="status-badge ${statusClass}">${file.status}</span></td>
      <td>${memoIcon}</td>
    `;
    tbody.appendChild(tr);

  });


}

function goHome() {
  document.getElementById('detail-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'flex';
}

function scrollTabs(dir) {
  const container = document.getElementById('detail-tabs');
  container.scrollBy({ left: dir * 200, behavior: 'smooth' });
}

function checkTabOverflow() {
  const container = document.getElementById('detail-tabs');
  const btns = document.querySelectorAll('.tab-nav-btn');
  const hasOverflow = container.scrollWidth > container.clientWidth;
  btns.forEach(btn => btn.style.display = hasOverflow ? 'flex' : 'none');
}

window.addEventListener('resize', checkTabOverflow);

function showLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
}

/* ===== QUALITY VALIDATION LOGIC ===== */
function runValidation() {
  if (!currentSW) return;
  
  // Switch View
  document.getElementById('guide-default-view').style.display = 'none';
  document.getElementById('guide-validation-view').style.display = 'block';
  const folderTypeView = document.getElementById('guide-folder-type-view');
  if (folderTypeView) folderTypeView.style.display = 'none';

  // Filter data for the current SW, EXCLUDING ignored tabs ('기본', '8. 기본')
  const swData = allData.filter(row => {
    const isTargetSW = row._swName === currentSW;
    const tab = row.depth2 || '기본';
    const isIgnoredTab = (tab === '8. 기본' || tab === '기본');
    return isTargetSW && !isIgnoredTab;
  });

  if (swData.length === 0) {
    renderEmptyReport();
    return;
  }

  const metrics = calculateMetrics(swData);
  renderValidationReport(metrics);
}

function closeValidation() {
  document.getElementById('guide-default-view').style.display = 'block';
  document.getElementById('guide-validation-view').style.display = 'none';
  const folderTypeView = document.getElementById('guide-folder-type-view');
  if (folderTypeView) folderTypeView.style.display = 'none';
}

function calculateMetrics(data) {
  const total = data.length;
  const versionFiles = data.filter(f => f.filename.includes('_version') || f.filename.includes('버전')).length;
  const attachFiles = data.filter(f => f.filename.includes('_attachment') || f.filename.includes('첨부')).length;
  
  const namingPattern = /^[A-Z0-9]+_[가-힣A-Z0-9]+_[가-힣A-Z0-9/ ]+_V\d{2}_\d{8}(\..+)?$/;
  const namingViolations = data.filter(f => !namingPattern.test(f.filename));
  const namingConsistency = total > 0 ? ((total - namingViolations.length) / total) * 100 : 0;

  const patterns = data.map(f => f.filename.split('_')[0]);
  const uniquePatterns = [...new Set(patterns)];
  const consistencyScore = total > 0 ? (1 - (uniquePatterns.length / total)) * 100 : 0;

  const recommendations = [];

  const depth4Map = {};
  const depth3Map = {};
  const type = SW_CONFIG[currentSW] || "A";
  const standardLayout = TYPE_HIERARCHY_MAP[type] || {};

  let anomalies = 0;
  const loggedAnomalies = new Set();

  data.forEach(f => {
    const d2 = f.depth2 || '';
    const d3 = f.depth3 || '';
    const d4 = f.depth4 || '';
    const key4 = d2 + "|||" + d3 + "|||" + d4;
    const key3 = d2 + "|||" + d3;
    
    depth4Map[key4] = (depth4Map[key4] || 0) + 1;
    depth3Map[key3] = (depth3Map[key3] || 0) + 1;

    const d2Name = d2.replace(/^\d+\.\s*/, '');
    const layout = standardLayout[d2Name] || standardLayout[d2] || null;
    
    // 1. 해당 depth2 레이아웃 내에 아예 존재하지 않는 depth3 카테고리 (임의 생성된 대분류)
    if (layout && d3 && d3 !== '기타' && !layout[d3]) {
      const msg = `"${d2}" 하위에 사전 정의되지 않은 비표준 카테고리 "${d3}"가 존재합니다.`;
      if(!loggedAnomalies.has(msg)) {
        loggedAnomalies.add(msg);
        anomalies++;
        if (recommendations.length < 5) {
          recommendations.push({ type: 'crit', icon: '⚠️', title: '비표준 구조 검출', text: msg });
        }
      }
    }

    // 2. Prefix 불일치 검사: "A. 설계" 폴더에 "C-1. 산출물"이 들어있는 경우 (구조 오류)
    if (d3 && d4) {
      const d3PrefixMatch = d3.match(/^([A-Z])\./);
      const d4PrefixMatch = d4.match(/^([A-Z])-\d+/);
      
      if (d3PrefixMatch && d4PrefixMatch) {
        if (d3PrefixMatch[1] !== d4PrefixMatch[1]) {
          const msg = `"${d3}" 폴더에 분류 기호가 불일치하는 하위 폴더 "${d4}"가 포함되어 있습니다. 폴더 이동을 권장합니다.`;
          if(!loggedAnomalies.has(msg)) {
            loggedAnomalies.add(msg);
            anomalies++;
            if (recommendations.length < 5) {
              recommendations.push({ type: 'crit', icon: '⚠️', title: '분류 기호 오류', text: msg });
            }
          }
        }
      }
    }
  });

  Object.keys(depth4Map).forEach(k => {
    const parts = k.split("|||");
    const d2 = parts[0];
    const d3 = parts[1];
    const d4 = parts[2];
    if (depth4Map[k] > 35) {
      recommendations.push({ type: 'warn', icon: '🗂️', title: '폴더 과밀화', text: `"${d2} - ${d3} - ${d4}" 폴더에 파일이 너무 많습니다(${depth4Map[k]}개). 하위 폴더 분산 배치를 권장합니다.` });
    }
  });

  Object.keys(depth3Map).forEach(k => {
    const parts = k.split("|||");
    const d2 = parts[0];
    const d3 = parts[1];
    if (depth3Map[k] === 1) {
      recommendations.push({ type: 'warn', icon: '📂', title: '폴더 파편화', text: `"${d2} - ${d3}" 폴더에 파일이 1개뿐입니다. 관리 효율을 위해 통합을 검토하세요.` });
    }
  });

  const hasKeyword = (kws) => data.some(f => kws.some(kw => f.filename.includes(kw) || (f.depth4 && f.depth4.includes(kw))));
  
  const spReqs = [
    { name: '프로젝트 계획', kws: ['계획서', '위험', '일정'], met: false },
    { name: '요구사항 관리', kws: ['추적', '명세', 'RTM', '요구사항 정의서', '요구사항'], met: false },
    { name: '형상/품질 관리', kws: ['형상', '버전 관리', 'QA', '품질'], met: false }
  ];
  const gsReqs = [
    { name: '사용자 문서', kws: ['매뉴얼', '가이드', '설명서'], met: false },
    { name: '신뢰성/성능', kws: ['성능', '부하', '테스트 결과'], met: false },
    { name: '기능 적합성', kws: ['테스트 케이스', 'TC', '결함', '조치'], met: false }
  ];
  const isoReqs = [
    { name: '시스템 설계', kws: ['아키텍처', '구조도', '인터페이스', 'API', '설계서', 'UI 정의서'], met: false },
    { name: '구현/통합', kws: ['통합 테스트', '리뷰', '단위 테스트'], met: false },
    { name: '유지보수', kws: ['운영 매뉴얼', '배포', '패치'], met: false }
  ];

  [spReqs, gsReqs, isoReqs].forEach(reqGroup => {
    reqGroup.forEach(req => {
      req.met = hasKeyword(req.kws);
    });
  });

  const spScore = (spReqs.filter(r => r.met).length / spReqs.length) * 100;
  const gsScore = (gsReqs.filter(r => r.met).length / gsReqs.length) * 100;
  const isoScore = (isoReqs.filter(r => r.met).length / isoReqs.length) * 100;

  const certRecommendations = [];
  const addCertWarning = (reqGroup, certName) => {
    reqGroup.forEach(req => {
      if (!req.met) {
        certRecommendations.push({ type: 'crit', title: `[${certName}] 필수 문서 누락`, text: `'${req.name}'(관련 키워드: ${req.kws.join(', ')}) 문서를 찾을 수 없습니다.` });
      }
    });
  };

  addCertWarning(gsReqs, 'GS인증');
  addCertWarning(spReqs, 'SP인증');
  addCertWarning(isoReqs, 'ISO12207');

  if (namingViolations.length > 0) {
    const sampleFiles = namingViolations.slice(0, 2).map(f => f.filename).join(', ');
    const extraCount = namingViolations.length > 2 ? ` 외 ${namingViolations.length - 2}건` : '';
    recommendations.push({ 
      type: 'warn', 
      title: '파일명 규칙 위반', 
      text: `표준 네이밍 규칙(S/W약어_단계_제목_V00_날짜) 정합도: ${namingConsistency.toFixed(1)}%. 보완 요구 대상: ${sampleFiles}${extraCount}` 
    });
  }

  const overallScore = (
    (namingConsistency * 0.2) + 
    (Math.min(100, (versionFiles/total * 100) * 2) * 0.1) + 
    (Math.min(100, consistencyScore + 40) * 0.1) +
    (spScore * 0.2) +
    (gsScore * 0.2) +
    (isoScore * 0.2)
  ).toFixed(1);

  return {
    swName: currentSW,
    namingConsistency,
    versionRatio: (versionFiles / total) * 100,
    folderClarity: Math.min(100, (Object.keys(depth3Map).length / 5) * 100),
    internalConsistency: Math.min(100, consistencyScore + 50),
    overallScore,
    spScore, gsScore, isoScore,
    recommendations: recommendations,
    certRecommendations: certRecommendations
  };
}

window.toggleCertRisks = function() {
  const el = document.getElementById('cert-risks-container');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
};

function renderValidationReport(m) {
  const container = document.getElementById('guide-validation-view');
  
  // 패널 컨테이너 자체가 부모 영역(우측 패널)을 꽉 채우도록 설정
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.maxHeight = '100%';
  container.style.overflow = 'hidden';

  const scoreVal = parseFloat(m.overallScore);
  const scoreClass = scoreVal > 85 ? 'good' : (scoreVal > 60 ? 'warn' : 'crit');
  const scoreDisplay = (scoreVal / 20).toFixed(1); 

  let recHtml = '';
  if (m.recommendations.length > 0) {
    recHtml = m.recommendations.map(r => {
      const cleanTitle = r.title.replace(/[🚨⚠️🗂️📂📝]/g, '').replace(/\[.*\]\s*/g, (match) => match).trim();
      return `
      <div class="action-item ${r.type}" style="display:flex; align-items:flex-start; margin-bottom:10px; padding:12px; border-radius:6px; background:#f9f9f9; border:1px solid #eee;">
        <div style="flex:1;">
          <div style="font-weight:700; color:#333; margin-bottom:4px;">${cleanTitle}</div>
          <div style="color:#666; font-size:13px; line-height:1.4;">${r.text}</div>
        </div>
      </div>
    `}).join('');
  } else {
    recHtml = '<div class="action-item good" style="padding:12px; border-radius:6px;">모든 구조적 요구사항을 완벽하게 준수하고 있습니다.</div>';
  }

  container.innerHTML = `
    <div class="validation-report-container" style="display:flex; flex-direction:column; height:100%; max-height:100%;">
      <!-- 상단 헤더 영역 (고정) -->
      <div class="report-header" style="flex-shrink:0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eaeaea; padding-bottom: 15px; margin-bottom: 15px;">
        <div style="display: flex; align-items: center;">
          <div class="report-title" style="margin-right: 15px; font-size:18px; font-weight:800;">${m.swName} 품질 및 인증 리포트</div>
          <div class="report-score-box">
            <span class="report-score-value score-val ${scoreClass}">${scoreDisplay}</span>
            <span class="report-score-total">/ 5.0</span>
          </div>
        </div>
        <button class="panel-close-btn" onclick="closeValidation()">×</button>
      </div>

      <!-- 하단 내용 영역 (스크롤) -->
      <div class="report-body" style="flex:1; overflow-y:auto; padding-right:10px; padding-bottom:30px;">
        <div class="report-section">
          <div class="insight-tag">SUMMARY</div>
          <div style="font-size:13px; line-height:1.6; color:#444;">
             현재 관리 지수는 <strong>${scoreVal}%</strong>이며, 파일명 규칙 및 폴더 구조 정합성을 점검했습니다. 
             추가로 <strong>GS 인증, SP 인증, ISO/IEC 12207</strong>의 필수 산출물 등록 현황을 기반으로 프로세스 무결성을 시뮬레이션했습니다.
          </div>
        </div>

        <div class="report-section" style="display:flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex:1; min-width:200px;">
              <div class="section-title">구조 및 정합성 지표</div>
              ${renderMetric('네이밍 규칙', m.namingConsistency, '표준 명명법 준수율')}
              ${renderMetric('구조 체계성', m.folderClarity, '표준 체계/분산 적정성')}
              ${renderMetric('데이터 밀도', m.internalConsistency, '산출물 패턴 일관성')}
          </div>
          <div style="flex:1; min-width:200px;">
              <div class="section-title" style="cursor:pointer; color:#0056b3; text-decoration:underline;" onclick="toggleCertRisks()" title="클릭하여 상세 인증 결함 확인">인증 준비도 (Readiness)</div>
              ${renderMetric('SP 인증 (프로세스 역량)', m.spScore, '요구사항/형상 관리 기반')}
              ${renderMetric('GS 인증 (제품 품질)', m.gsScore, '성능/테스트 매뉴얼 기반')}
              ${renderMetric('ISO 12207 (생명주기)', m.isoScore, '아키텍처/테스트 기반')}
          </div>
        </div>

        <div class="report-section" style="background:#fff;">
          <div class="section-title">식별된 리스크 및 권고 사항</div>
          <div class="action-list">
            ${recHtml}
          </div>
          
          <div id="cert-risks-container" style="display:none; margin-top:20px; border-top:1px dashed #ccc; padding-top:15px;">
            <div class="section-title" style="color:#dc3545;">인증 결함 상세 보고서</div>
            <div class="action-list">
              ${
                m.certRecommendations.length > 0 
                ? m.certRecommendations.map(r => `
                    <div class="action-item ${r.type}" style="display:flex; align-items:flex-start; margin-bottom:10px; padding:12px; border-radius:6px; background:#fff5f5; border-left:3px solid #dc3545;">
                      <div style="flex:1;">
                        <div style="font-weight:700; color:#dc3545; margin-bottom:4px;">${r.title.replace(/[🚨⚠️🗂️📂📝]/g, '').trim()}</div>
                        <div style="color:#666; font-size:13px; line-height:1.4;">${r.text}</div>
                      </div>
                    </div>
                  `).join('')
                : '<div class="action-item good" style="padding:12px; border-radius:6px; background:#f4fdf5; border-left:3px solid #28a745;">모든 인증의 필수 산출물이 완비되었습니다.</div>'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMetric(label, value, desc) {
  return `
    <div class="metric-item">
      <div class="metric-label-row">
        <span>${label}</span>
        <span>${value.toFixed(0)}%</span>
      </div>
      <div class="metric-bar-bg">
        <div class="metric-bar-fill" style="width: ${value}%"></div>
      </div>
      <div style="font-size:10px; color:#999; margin-top:2px;">${desc}</div>
    </div>
  `;
}

function renderEmptyReport() {
  const container = document.getElementById('guide-validation-view');
  container.innerHTML = `
    <div class="validation-report-container">
      <div class="report-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="report-title">데이터 없음</div>
        <button class="panel-close-btn" onclick="closeValidation()">×</button>
      </div>
      <div class="report-summary-box">
        해당 S/W에 대한 분석 데이터가 충분하지 않습니다.
      </div>
    </div>
  `;
}

// ===== FOLDER TYPE GUIDE LOGIC =====
const FOLDER_TREE_DATA = {
  A: {
    title: "TYPE A : 엔지니어링 솔루션형 상세 구조",
    tree: [
      { depth: 1, name: "1. 기획·기술 조사" },
      { depth: 2, name: "A. S/W 기획" },
      { depth: 3, name: "A-1. 제품 기획서" },
      { depth: 3, name: "A-2. 사업 계획서" },
      { depth: 2, name: "B. 시장·기술 조사" },
      { depth: 3, name: "B-1. 경쟁사 분석" },
      { depth: 3, name: "B-2. 관련 논문 및 특허" },
      { depth: 2, name: "C. 요구사항 정의" },
      { depth: 3, name: "C-1. 요구사항 명세서" },
      { depth: 3, name: "C-2. 사용자 인터뷰" },
      { depth: 1, name: "2. 엔지니어링 설계·이론" },
      { depth: 2, name: "A. 설계 기준·규정" },
      { depth: 3, name: "A-1. 국내외 설계 기준" },
      { depth: 3, name: "A-2. 적용 법규" },
      { depth: 2, name: "B. 엔지니어링 기본 개념" },
      { depth: 3, name: "B-1. 기본 이론서" },
      { depth: 3, name: "B-2. 개념 설계도" },
      { depth: 2, name: "C. 구조해석·구조계산서" },
      { depth: 3, name: "C-1. 해석 모델링" },
      { depth: 3, name: "C-2. 구조 계산서" },
      { depth: 1, name: "3. 기능 및 화면 구성" },
      { depth: 2, name: "A. 요구사항 명세(추적)" },
      { depth: 3, name: "A-1. 요구사항 추적 매트릭스" },
      { depth: 2, name: "B. 기능 정의서" },
      { depth: 3, name: "B-1. 기능 정의서" },
      { depth: 3, name: "B-2. 상태 다이어그램" },
      { depth: 2, name: "C. UI·UX 설계" },
      { depth: 3, name: "C-1. 스토리보드" },
      { depth: 3, name: "C-2. 화면 흐름도" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. 아키텍처, 상세 설계" },
      { depth: 3, name: "A-1. 시스템 아키텍처도" },
      { depth: 3, name: "A-2. 상세 설계서" },
      { depth: 2, name: "B. DB 설계" },
      { depth: 3, name: "B-1. ERD" },
      { depth: 3, name: "B-2. 테이블 정의서" },
      { depth: 2, name: "C. 소스 코드" },
      { depth: 3, name: "C-1. Frontend 소스" },
      { depth: 3, name: "C-2. Backend 소스" },
      { depth: 2, name: "D. 단위 테스트 결과서" },
      { depth: 3, name: "D-1. 단위 테스트 리포트" },
      { depth: 2, name: "E. 빌드·배포 가이드" },
      { depth: 3, name: "E-1. 빌드 스크립트" },
      { depth: 3, name: "E-2. 배포 매뉴얼" },
      { depth: 1, name: "5. 검수·품질관리" },
      { depth: 2, name: "A. 테스트 계획서" },
      { depth: 3, name: "A-1. 통합 테스트 계획" },
      { depth: 3, name: "A-2. 인수 테스트 계획" },
      { depth: 2, name: "B. 계산·검증 보고서" },
      { depth: 3, name: "B-1. 해석 검증 보고서" },
      { depth: 3, name: "B-2. 성능 검증 결과" },
      { depth: 2, name: "C. 사용자 테스트" },
      { depth: 3, name: "C-1. UAT 시나리오" },
      { depth: 3, name: "C-2. UAT 결과서" },
      { depth: 2, name: "D. 사용자 매뉴얼" },
      { depth: 3, name: "D-1. 사용자 가이드" },
      { depth: 3, name: "D-2. 관리자 가이드" },
      { depth: 2, name: "E. Release Note" },
      { depth: 3, name: "E-1. 패치 노트" },
      { depth: 3, name: "E-2. 버전 릴리즈 노트" }
    ]
  },
  B: {
    title: "TYPE B : GIS·데이터 플랫폼형 상세 구조",
    tree: [
      { depth: 1, name: "1. 기획·기술 조사" },
      { depth: 2, name: "A. S/W 기획" },
      { depth: 3, name: "A-1. 플랫폼 기획서" },
      { depth: 3, name: "A-2. 로드맵" },
      { depth: 2, name: "B. 데이터 현황 조사" },
      { depth: 3, name: "B-1. 공공 데이터 목록" },
      { depth: 3, name: "B-2. 수집 데이터 현황" },
      { depth: 2, name: "C. 요구사항 정의" },
      { depth: 3, name: "C-1. 데이터 요구사항 명세서" },
      { depth: 1, name: "2. 데이터 설계·구조" },
      { depth: 2, name: "A. 데이터 모델링" },
      { depth: 3, name: "A-1. 논리 모델" },
      { depth: 3, name: "A-2. 물리 모델" },
      { depth: 2, name: "B. 데이터 프로세스 설계" },
      { depth: 3, name: "B-1. ETL 파이프라인 설계" },
      { depth: 3, name: "B-2. 데이터 플로우" },
      { depth: 2, name: "C. DB 스키마 설계" },
      { depth: 3, name: "C-1. DDL 스크립트" },
      { depth: 3, name: "C-2. 인덱스 설계서" },
      { depth: 1, name: "3. 기능 및 화면 구성" },
      { depth: 2, name: "A. 요구사항 명세(추적)" },
      { depth: 3, name: "A-1. 요구사항 정의 및 추적표" },
      { depth: 2, name: "B. 기능 정의·API 명세" },
      { depth: 3, name: "B-1. 플랫폼 기능 정의서" },
      { depth: 3, name: "B-2. 데이터 API 명세서" },
      { depth: 2, name: "C. UI·UX 설계" },
      { depth: 3, name: "C-1. 대시보드 화면 설계서" },
      { depth: 3, name: "C-2. 포털 UI 설계" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. 아키텍처 설계" },
      { depth: 3, name: "A-1. 클라우드 아키텍처" },
      { depth: 3, name: "A-2. 네트워크 구성도" },
      { depth: 2, name: "B. DB 구현 스크립트" },
      { depth: 3, name: "B-1. 초기 데이터 구축" },
      { depth: 3, name: "B-2. 마이그레이션 스크립트" },
      { depth: 2, name: "C. API 개발 및 소스 코드" },
      { depth: 3, name: "C-1. 데이터 API 소스" },
      { depth: 3, name: "C-2. 플랫폼 소스" },
      { depth: 2, name: "D. 빌드·배포 환경 가이드" },
      { depth: 3, name: "D-1. Docker/K8s 설정" },
      { depth: 3, name: "D-2. CI/CD 파이프라인" },
      { depth: 1, name: "5. 연동·검증" },
      { depth: 2, name: "A. 데이터 품질 검사 절차서" },
      { depth: 3, name: "A-1. 품질 검사 스크립트" },
      { depth: 3, name: "A-2. 정합성 검증 결과" },
      { depth: 2, name: "B. 성능 테스트 계획 및 결과" },
      { depth: 3, name: "B-1. 대용량 쿼리 테스트" },
      { depth: 3, name: "B-2. 부하 테스트 결과" },
      { depth: 2, name: "C. 연동 테스트" },
      { depth: 3, name: "C-1. 내외부 시스템 연동 결과" },
      { depth: 3, name: "C-2. 인터페이스 테스트" },
      { depth: 2, name: "D. 운영 매뉴얼" },
      { depth: 3, name: "D-1. 시스템 운영 매뉴얼" },
      { depth: 3, name: "D-2. 백업/복구 지침" }
    ]
  },
  C: {
    title: "TYPE C : 시각화·서비스형 상세 구조",
    tree: [
      { depth: 1, name: "1. 기획·기술 조사" },
      { depth: 2, name: "A. S/W 기획" },
      { depth: 3, name: "A-1. 서비스 기획서" },
      { depth: 3, name: "A-2. 사업 모델 정의" },
      { depth: 2, name: "B. 유사 서비스 조사" },
      { depth: 3, name: "B-1. 경쟁 서비스 분석" },
      { depth: 3, name: "B-2. 트렌드 리포트" },
      { depth: 2, name: "C. BM 요구사항 정의" },
      { depth: 3, name: "C-1. 비즈니스 요구사항 명세서" },
      { depth: 1, name: "2. UX·화면설계" },
      { depth: 2, name: "A. UI·UX 목업" },
      { depth: 3, name: "A-1. 와이어프레임" },
      { depth: 3, name: "A-2. 프로토타입" },
      { depth: 2, name: "B. 디자인 시스템" },
      { depth: 3, name: "B-1. 디자인 토큰" },
      { depth: 3, name: "B-2. 컴포넌트 라이브러리 가이드" },
      { depth: 2, name: "C. 기능·화면 통합 정의" },
      { depth: 3, name: "C-1. 화면 정의서(SB)" },
      { depth: 3, name: "C-2. 인터랙션 정의서" },
      { depth: 1, name: "3. API 명세" },
      { depth: 2, name: "A. 사용자 시나리오" },
      { depth: 3, name: "A-1. 유스케이스 정의" },
      { depth: 3, name: "A-2. 고객 여정 지도" },
      { depth: 2, name: "B. API 명세" },
      { depth: 3, name: "B-1. REST API 명세서" },
      { depth: 3, name: "B-2. GraphQL 스키마" },
      { depth: 2, name: "C. 권한·인증·규칙 설계" },
      { depth: 3, name: "C-1. 권한 매트릭스" },
      { depth: 3, name: "C-2. 보안 정책 정의서" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. Frontend 설계서" },
      { depth: 3, name: "A-1. 상태 관리 아키텍처" },
      { depth: 3, name: "A-2. 라우팅 설계서" },
      { depth: 2, name: "B. Backend 아키텍처" },
      { depth: 3, name: "B-1. MSA 아키텍처 구성도" },
      { depth: 3, name: "B-2. 도메인 모델링" },
      { depth: 2, name: "C. DB 설계" },
      { depth: 3, name: "C-1. ERD 및 테이블 정의서" },
      { depth: 2, name: "D. 소스 코드" },
      { depth: 3, name: "D-1. 클라이언트 코드" },
      { depth: 3, name: "D-2. 서버 코드" },
      { depth: 1, name: "5. 운영·배포" },
      { depth: 2, name: "A. 테스트 계획 및 결과" },
      { depth: 3, name: "A-1. QA 테스트 케이스" },
      { depth: 3, name: "A-2. QA 결과 보고서" },
      { depth: 2, name: "B. 사용자 테스트 결과" },
      { depth: 3, name: "B-1. 베타 테스트 리포트" },
      { depth: 2, name: "C. 사용자 매뉴얼&가이드" },
      { depth: 3, name: "C-1. 사용자 매뉴얼" },
      { depth: 3, name: "C-2. FAQ/도움말 자료" },
      { depth: 2, name: "D. 배포 이력" },
      { depth: 3, name: "D-1. 릴리즈 노트" },
      { depth: 3, name: "D-2. 배포 점검표" },
      { depth: 2, name: "E. 장애 대응 매뉴얼" },
      { depth: 3, name: "E-1. 트러블슈팅 가이드" },
      { depth: 3, name: "E-2. 에스컬레이션 정책" }
    ]
  },
  D: {
    title: "TYPE D : 그래픽·엔진형 상세 구조",
    tree: [
      { depth: 1, name: "1. 기획·기술 조사" },
      { depth: 2, name: "A. S/W 기획" },
      { depth: 3, name: "A-1. 엔진 개발 기획서" },
      { depth: 3, name: "A-2. 로드맵" },
      { depth: 2, name: "B. 유사 기술·서비스 조사" },
      { depth: 3, name: "B-1. 국내외 기술 동향" },
      { depth: 3, name: "B-2. 벤치마크 리포트" },
      { depth: 2, name: "C. 요구사항 정의" },
      { depth: 3, name: "C-1. 기술 요구사항 명세서" },
      { depth: 1, name: "2. 알고리즘·모델링" },
      { depth: 2, name: "A. 통합 알고리즘 설계" },
      { depth: 3, name: "A-1. 핵심 알고리즘 정의서" },
      { depth: 3, name: "A-2. 수식 전개도" },
      { depth: 2, name: "B. 수치 해석 방법론" },
      { depth: 3, name: "B-1. 해석 기법 정의서" },
      { depth: 3, name: "B-2. 성능 최적화 방안" },
      { depth: 2, name: "C. 프로토타이핑/시뮬레이션" },
      { depth: 3, name: "C-1. 시뮬레이션 결과 리포트" },
      { depth: 3, name: "C-2. PoC 결과서" },
      { depth: 1, name: "3. 아키텍처·기술 설계" },
      { depth: 2, name: "A. 아키텍처, 모듈 구조" },
      { depth: 3, name: "A-1. 코어 아키텍처 명세서" },
      { depth: 3, name: "A-2. 모듈간 종속성 다이어그램" },
      { depth: 2, name: "B. 렌더링/데이터 파이프라인" },
      { depth: 3, name: "B-1. 파이프라인 설계도" },
      { depth: 3, name: "B-2. 데이터 처리 흐름도" },
      { depth: 2, name: "C. 기술 사양, 인터페이스" },
      { depth: 3, name: "C-1. 내부 API 규격서" },
      { depth: 3, name: "C-2. 외부 연동 명세서" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. 상세 설계서" },
      { depth: 3, name: "A-1. 클래스/모듈 상세 설계서" },
      { depth: 3, name: "A-2. 함수 정의서" },
      { depth: 2, name: "B. API 설계" },
      { depth: 3, name: "B-1. SDK API 명세서" },
      { depth: 2, name: "C. 소스 코드" },
      { depth: 3, name: "C-1. 엔진 코어 소스" },
      { depth: 3, name: "C-2. 유틸리티 소스" },
      { depth: 2, name: "D. 샘플 코드·데모" },
      { depth: 3, name: "D-1. 데모 프로젝트" },
      { depth: 3, name: "D-2. 튜토리얼 예제" },
      { depth: 2, name: "E. 빌드·배포 환경 설정" },
      { depth: 3, name: "E-1. CMake/Makefile 설정" },
      { depth: 3, name: "E-2. 패키징 스크립트" },
      { depth: 1, name: "5. 검증·테스트" },
      { depth: 2, name: "A. 단위 테스트" },
      { depth: 3, name: "A-1. 단위 테스트 코드" },
      { depth: 3, name: "A-2. 커버리지 리포트" },
      { depth: 2, name: "B. 성능 검증" },
      { depth: 3, name: "B-1. 벤치마크 테스트 결과" },
      { depth: 3, name: "B-2. 메모리/프로파일링 보고서" },
      { depth: 2, name: "C. 통합 테스트 시나리오" },
      { depth: 3, name: "C-1. 모듈 통합 테스트 계획서" },
      { depth: 2, name: "D. 테스트 결과" },
      { depth: 3, name: "D-1. 최종 검증 보고서" },
      { depth: 3, name: "D-2. 결함 추적 목록" }
    ]
  }
};

function showFolderTypeGuide() {
  document.getElementById('guide-default-view').style.display = 'none';
  const valView = document.getElementById('guide-validation-view');
  if(valView) valView.style.display = 'none';
  
  const folderTypeView = document.getElementById('guide-folder-type-view');
  if(folderTypeView) {
    folderTypeView.style.display = 'block';
  }
  
  const treeDisplay = document.getElementById('folder-tree-display');
  if(treeDisplay) {
    treeDisplay.style.display = 'none';
  }

  // 모든 카드의 active 클래스 제거
  document.querySelectorAll('.type-card').forEach(card => card.classList.remove('active'));

  // 현재 SW 유형 강조
  let swType = null;
  if (currentSW) {
    const trimmedKey = currentSW.trim();
    if (swGroups[trimmedKey]) {
      swType = swGroups[trimmedKey].type;
    } else if (SW_CONFIG[trimmedKey]) {
      swType = SW_CONFIG[trimmedKey];
    }
  }

  if (swType) {
    const targetCard = document.querySelector(`.type-card.type-${swType.toLowerCase()}`);
    if (targetCard) targetCard.classList.add('active');
  }
}

function showFolderTree(type) {
  const data = FOLDER_TREE_DATA[type];
  if(!data) return;
  
  const treeDisplay = document.getElementById('folder-tree-display');
  const treeTitle = document.getElementById('tree-title');
  const treeContent = document.getElementById('tree-content');
  
  treeTitle.innerText = data.title;
  
  let html = '';
  data.tree.forEach(item => {
    let classes = `tree-depth-${item.depth}`;
    if (item.highlight) classes += ' tree-highlight';
    html += `<div class="${classes}">${item.name}</div>`;
  });
  
  treeContent.innerHTML = html;
  treeDisplay.style.display = 'block';
}

function closeFolderTree() {
  const treeDisplay = document.getElementById('folder-tree-display');
  if(treeDisplay) treeDisplay.style.display = 'none';
}

function closeFolderTypeGuide() {
  document.getElementById('guide-folder-type-view').style.display = 'none';
  document.getElementById('guide-default-view').style.display = 'block';
}
