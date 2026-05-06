const API_URL = 'https://script.google.com/macros/s/AKfycbzM7rN_1nxnVeu6B_mRZv48WoTD7w3C-JM1AskiHisbzrJLc80BgkNWnnTuXtpVK5SyjQ/exec'; 
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
  "A": ["1. 기획·조사", "2. 엔지니어링 설계", "3. 기능 요건·명세", "4. 개발·구현", "5. 검수·품질관리", "6. 작업장(기획부서)", "7. 작업장(개발부서)"],
  "B": ["1. 기획·조사", "2. 데이터 설계·구조", "3. 기능 요건·명세", "4. 개발·구현", "5. 연동·검증", "6. 작업장(기획부서)", "7. 작업장(개발부서)"],
  "C": ["1. 기획·조사", "2. UX·화면설계", "3. 기능 요건·명세", "4. 개발·구현", "5. 운영·배포·매뉴얼", "6. 작업장(기획부서)", "7. 작업장(개발부서)"],
  "D": ["1. 기획·조사", "2. 수치해석·알고리즘 설계", "3. 아키텍처·기술설계", "4. 개발·구현", "5. 검증·테스트", "6. 작업장(기획부서)", "7. 작업장(개발부서)"]
};

// 유형별/탭별 표준 폴더 체계 정의
const TYPE_HIERARCHY_MAP = {
  "A": { // 엔지니어링 솔루션형
    "설계": { "A. 기본이론": ["A-1. 기술 검토서", "A-2. 설계 지침"], "B. 엔지니어링 설계": ["B-1. 도면 파일", "B-2. 수량 산출서"], "C. 계산서": ["C-1. 구조 계산서", "C-2. 수리 계산서"] },
    "기획": { "A. 기획 개요": ["A-1. S/W 기획서"], "B. 자료조사": ["B-1. 관련 도면", "B-2. 관련 기준"] }
  },
  "B": { // GIS·데이터 플랫폼형
    "설계": { "A. 데이터 설계·구조": ["A-1. DB 설계도", "A-2. 데이터 스키마"], "B. 연동 규격": ["B-1. API 명세서", "B-2. 외부 연동 정의서"] },
    "기획": { "A. 기획 개요": ["A-1. 플랫폼 기획서"], "B. 공간정보조사": ["B-1. 수치지도", "B-2. 위성 데이터"] }
  },
  "C": { // 시각화·서비스형
    "UX·화면설계": { "A. UX·화면설계": ["A-1. 화면 설계서(SB)", "A-2. 사용자 시나리오"], "B. 프로토타입": ["B-1. 프로토타입 설계", "B-2. 디자인 가이드"] },
    "운영·배포·매뉴얼": { "A. 서비스 운영": ["A-1. 운영 가이드", "A-2. 장애 대응 매뉴얼"], "B. 배포/매뉴얼": ["B-1. 배포 매뉴얼", "B-2. 사용자 가이드"] },
    "기획": { "A. 기획 개요": ["A-1. 서비스 기획서"], "B. UI/UX 리서치": ["B-1. 벤치마킹", "B-2. 사용자 인터뷰"] }
  },
  "D": { // 그래픽·엔진형
    "수치해석": { "A. 수치해석 모델": ["A-1. 해석 알고리즘 정의", "A-2. 수치 데이터 모델링"], "B. 성능 분석": ["B-1. 엔진 부하 테스트", "B-2. 처리 속도 최적화"] },
    "아키텍처": { "A. 엔진 아키텍처": ["A-1. 렌더링 파이프라인 설계", "A-2. 시스템 구성도"], "B. 기술 명세": ["B-1. 기술 검토 명세서", "B-2. 모듈간 규격 정의"] },
    "기획": { "A. 기획 개요": ["A-1. 엔진 로드맵"], "B. 기술 리서치": ["B-1. 논문 분석", "B-2. 엔진 비교"] }
  }
};

// 공통 단계별 폴더 체계
const COMMON_HIERARCHY = {
  "요건": { "A. 기능 요건": ["A-1. 요구사항 정의서"], "B. 인터페이스": ["B-1. API 명세서"] },
  "개발": { "A. 시스템 구성": ["A-1. 아키텍처 다이어그램"], "B. 소스코드": ["B-1. 프론트엔드", "B-2. 백엔드"] },
  "검수": { "A. 테스트": ["A-1. 테스트 시나리오", "A-2. 검증 결과서"], "B. 품질관리": ["B-1. 결함 리포트"] },
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
    catDiv.innerHTML = `<div class="sidebar-cat-title">${catKey}</div>`;

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
        <span class="sidebar-sub-name">${subKey}</span>
        <span class="sidebar-sub-count">${fileCount}</span>
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
  
  // Naming Rule: S/W약어_단계_문서성격/제목_V00_YYYYMMDD
  const namingPattern = /^[A-Z0-9]+_[가-힣A-Z0-9]+_[가-힣A-Z0-9/ ]+_V\d{2}_\d{8}(\..+)?$/;
  const namingViolations = data.filter(f => !namingPattern.test(f.filename));
  const namingConsistency = ((total - namingViolations.length) / total) * 100;

  // Consistency: Check if files in same depth3 have similar patterns
  const patterns = data.map(f => f.filename.split('_')[0]);
  const uniquePatterns = [...new Set(patterns)];
  const consistencyScore = total > 0 ? (1 - (uniquePatterns.length / total)) * 100 : 0;

  // Folder Structure Analysis
  const depth3Map = {};
  data.forEach(f => {
    depth3Map[f.depth3] = (depth3Map[f.depth3] || 0) + 1;
  });
  const depth3s = Object.keys(depth3Map);
  
  const recommendations = [];
  if (namingConsistency < 70) {
    recommendations.push({ type: 'crit', icon: '📝', title: '파일명 규칙 위반', text: '표준 네이밍 규칙(S/W약어_단계_제목_V00_날짜)을 준수하지 않는 파일이 다수 발견되었습니다. 일괄 수정이 필요합니다.' });
  }
  if (versionFiles === 0 && total > 5) {
    recommendations.push({ type: 'warn', icon: '🔄', title: '버전 관리 부재', text: '파일의 이력이 관리되지 않고 있습니다. 수정 시 "_V01", "_V02" 등의 접미사를 활용하여 버전을 분리하세요.' });
  }
  
  // Check for folder imbalance
  depth3s.forEach(d => {
    if (depth3Map[d] === 1) {
      recommendations.push({ type: 'warn', icon: '📂', title: '폴더 파편화', text: `"${d}" 폴더에 파일이 1개뿐입니다. 유사 카테고리와 통합하여 관리 효율을 높이는 것을 권장합니다.` });
    } else if (depth3Map[d] > 10) {
      recommendations.push({ type: 'warn', icon: '🗂️', title: '폴더 과밀화', text: `"${d}" 폴더에 파일이 너무 많습니다. 하위 카테고리(Depth4)를 세분화하여 분산 배치하세요.` });
    }
  });

  if (attachFiles === 0) {
     recommendations.push({ type: 'low', icon: '📎', title: '참조 자료 부족', text: '본 문서 외에 관련 기술 자료나 근거 문서(첨부)가 부족합니다. 연관 자료를 함께 배치하세요.' });
  }

  // Sizes
  const sizes = data.map(f => {
    const s = f.size || "0 KB";
    const val = parseFloat(s);
    if (s.includes('MB')) return val * 1024;
    return val;
  });
  const avgSize = sizes.reduce((a, b) => a + b, 0) / total;

  // Final score calculation
  const overallScore = (
    (namingConsistency * 0.4) + 
    (Math.min(100, (versionFiles/total * 100) * 2) * 0.2) + 
    (Math.min(100, (attachFiles/total * 100) * 2) * 0.1) + 
    (Math.min(100, consistencyScore + 40) * 0.3)
  ).toFixed(1);

  return {
    swName: currentSW,
    namingConsistency,
    versionRatio: (versionFiles / total) * 100,
    attachRatio: (attachFiles / total) * 100,
    folderClarity: Math.min(100, (depth3s.length / 5) * 100),
    internalConsistency: Math.min(100, consistencyScore + 50),
    avgSize: avgSize.toFixed(1),
    overallScore,
    recommendations: recommendations.slice(0, 4) // Show top 4
  };
}

function renderValidationReport(m) {
  const container = document.getElementById('guide-validation-view');
  const scoreVal = parseFloat(m.overallScore);
  const scoreClass = scoreVal > 85 ? 'good' : (scoreVal > 60 ? 'warn' : 'crit');
  const scoreDisplay = (scoreVal / 20).toFixed(1); 

  let recHtml = '';
  if (m.recommendations.length > 0) {
    recHtml = m.recommendations.map(r => `
      <div class="action-item ${r.type}">
        <span class="action-icon">${r.icon}</span>
        <div>
          <div style="font-weight:700; color:#333;">${r.title}</div>
          <div style="color:#666;">${r.text}</div>
        </div>
      </div>
    `).join('');
  } else {
    recHtml = '<div class="action-item good">✨ 모든 구조적 규칙을 완벽하게 준수하고 있습니다!</div>';
  }

  container.innerHTML = `
    <div class="validation-report-container">
      <div class="report-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          <div class="report-title" style="margin-right: 15px;">${m.swName} 품질 리포트</div>
          <div class="report-score-box">
            <span class="report-score-value score-val ${scoreClass}">${scoreDisplay}</span>
            <span class="report-score-total">/ 5.0</span>
          </div>
        </div>
        <button class="panel-close-btn" onclick="closeValidation()">×</button>
      </div>

      <div class="report-section">
        <div class="insight-tag">SUMMARY</div>
        <div style="font-size:13px; line-height:1.6; color:#444;">
           현재 ${m.swName}의 관리 지수는 <strong>${scoreVal}%</strong>입니다. 
           ${scoreVal > 85 ? '구조적 완성도가 매우 높으며 표준을 잘 따르고 있습니다.' : (scoreVal > 60 ? '전반적으로 양호하나 일부 구조적 보완이 권장됩니다.' : '데이터 관리 체계의 대대적인 정비가 시급합니다.')}
        </div>
      </div>

      <div class="report-section">
        <div class="section-title">📊 정량 지표 분석</div>
        ${renderMetric('네이밍 규칙', m.namingConsistency, '표준 명명법 준수율')}
        ${renderMetric('구조 체계성', m.folderClarity, '카테고리 분산 적정성')}
        ${renderMetric('버전 관리', m.versionRatio, '이력 관리 비중')}
        ${renderMetric('데이터 밀도', m.internalConsistency, '패턴 일관성')}
      </div>

      <div class="report-section" style="background:#fff;">
        <div class="section-title">🔧 권장 조치 사항</div>
        <div class="action-list">
          ${recHtml}
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
      { depth: 1, name: "1. 기획·조사" },
      { depth: 2, name: "A. 기획 개요" }, { depth: 3, name: "A-1. S/W 기획서" },
      { depth: 2, name: "B. 자료조사" }, { depth: 3, name: "B-1. 관련 도면" }, { depth: 3, name: "B-2. 관련 기준" },
      { depth: 1, name: "2. 엔지니어링 설계 (핵심)", highlight: true },
      { depth: 2, name: "A. 기본이론" }, { depth: 3, name: "A-1. 기술 검토서" }, { depth: 3, name: "A-2. 설계 지침" },
      { depth: 2, name: "B. 엔지니어링 설계 (핵심)", highlight: true }, { depth: 3, name: "B-1. 도면 파일" }, { depth: 3, name: "B-2. 수량 산출서" },
      { depth: 2, name: "C. 계산서" }, { depth: 3, name: "C-1. 구조 계산서" }, { depth: 3, name: "C-2. 수리 계산서" },
      { depth: 1, name: "3. 기능 요건·명세" },
      { depth: 2, name: "A. 기능 요건" }, { depth: 3, name: "A-1. 요구사항 정의서" },
      { depth: 2, name: "B. 인터페이스" }, { depth: 3, name: "B-1. API 명세서" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. 시스템 구성" }, { depth: 3, name: "A-1. 아키텍처 다이어그램" },
      { depth: 2, name: "B. 소스코드" }, { depth: 3, name: "B-1. 프론트엔드" }, { depth: 3, name: "B-2. 백엔드" },
      { depth: 1, name: "5. 검수·품질관리" },
      { depth: 2, name: "A. 테스트" }, { depth: 3, name: "A-1. 테스트 시나리오" }, { depth: 3, name: "A-2. 검증 결과서" },
      { depth: 2, name: "B. 품질관리" }, { depth: 3, name: "B-1. 결함 리포트" }
    ]
  },
  B: {
    title: "TYPE B : GIS·데이터 플랫폼형 상세 구조",
    tree: [
      { depth: 1, name: "1. 기획·조사" },
      { depth: 2, name: "A. 기획 개요" }, { depth: 3, name: "A-1. 플랫폼 기획서" },
      { depth: 2, name: "B. 공간정보조사" }, { depth: 3, name: "B-1. 수치지도" }, { depth: 3, name: "B-2. 위성 데이터" },
      { depth: 1, name: "2. 데이터 설계·구조 (핵심)", highlight: true },
      { depth: 2, name: "A. 데이터 설계·구조 (핵심)", highlight: true }, { depth: 3, name: "A-1. DB 설계도" }, { depth: 3, name: "A-2. 데이터 스키마" },
      { depth: 2, name: "B. 연동 규격" }, { depth: 3, name: "B-1. API 명세서" }, { depth: 3, name: "B-2. 외부 연동 정의서" },
      { depth: 1, name: "3. 기능 요건·명세" },
      { depth: 2, name: "A. 기능 요건" }, { depth: 3, name: "A-1. 요구사항 정의서" },
      { depth: 2, name: "B. 인터페이스" }, { depth: 3, name: "B-1. API 명세서" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. 시스템 구성" }, { depth: 3, name: "A-1. 아키텍처 다이어그램" },
      { depth: 2, name: "B. 소스코드" }, { depth: 3, name: "B-1. 프론트엔드" }, { depth: 3, name: "B-2. 백엔드" },
      { depth: 1, name: "5. 연동·검증" },
      { depth: 2, name: "A. 테스트" }, { depth: 3, name: "A-1. 테스트 시나리오" }, { depth: 3, name: "A-2. 검증 결과서" }
    ]
  },
  C: {
    title: "TYPE C : 시각화·서비스형 상세 구조",
    tree: [
      { depth: 1, name: "1. 기획·조사" },
      { depth: 2, name: "A. 기획 개요" }, { depth: 3, name: "A-1. 서비스 기획서" },
      { depth: 2, name: "B. UI/UX 리서치" }, { depth: 3, name: "B-1. 벤치마킹" }, { depth: 3, name: "B-2. 사용자 인터뷰" },
      { depth: 1, name: "2. UX·화면설계 (핵심)", highlight: true },
      { depth: 2, name: "A. UX·화면설계 (핵심)", highlight: true }, { depth: 3, name: "A-1. 화면 설계서(SB)" }, { depth: 3, name: "A-2. 사용자 시나리오" },
      { depth: 2, name: "B. 프로토타입" }, { depth: 3, name: "B-1. 프로토타입 설계" }, { depth: 3, name: "B-2. 디자인 가이드" },
      { depth: 1, name: "3. 기능 요건·명세" },
      { depth: 2, name: "A. 기능 요건" }, { depth: 3, name: "A-1. 요구사항 정의서" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. 시스템 구성" }, { depth: 3, name: "A-1. 아키텍처 다이어그램" },
      { depth: 1, name: "5. 운영·배포·매뉴얼" },
      { depth: 2, name: "A. 서비스 운영" }, { depth: 3, name: "A-1. 운영 가이드" }, { depth: 3, name: "A-2. 장애 대응 매뉴얼" },
      { depth: 2, name: "B. 배포/매뉴얼" }, { depth: 3, name: "B-1. 배포 매뉴얼" }, { depth: 3, name: "B-2. 사용자 가이드" }
    ]
  },
  D: {
    title: "TYPE D : 그래픽·엔진형 상세 구조",
    tree: [
      { depth: 1, name: "1. 기획·조사" },
      { depth: 2, name: "A. 기획 개요" }, { depth: 3, name: "A-1. 엔진 로드맵" },
      { depth: 2, name: "B. 기술 리서치" }, { depth: 3, name: "B-1. 논문 분석" }, { depth: 3, name: "B-2. 엔진 비교" },
      { depth: 1, name: "2. 수치해석·알고리즘 설계 (핵심)", highlight: true },
      { depth: 2, name: "A. 수치해석 모델 (핵심)", highlight: true }, { depth: 3, name: "A-1. 해석 알고리즘 정의" }, { depth: 3, name: "A-2. 수치 데이터 모델링" },
      { depth: 2, name: "B. 성능 분석" }, { depth: 3, name: "B-1. 엔진 부하 테스트" }, { depth: 3, name: "B-2. 처리 속도 최적화" },
      { depth: 1, name: "3. 아키텍처·기술설계 (핵심)", highlight: true },
      { depth: 2, name: "A. 엔진 아키텍처 (핵심)", highlight: true }, { depth: 3, name: "A-1. 렌더링 파이프라인 설계" }, { depth: 3, name: "A-2. 시스템 구성도" },
      { depth: 2, name: "B. 기술 명세" }, { depth: 3, name: "B-1. 기술 검토 명세서" }, { depth: 3, name: "B-2. 모듈간 규격 정의" },
      { depth: 1, name: "4. 개발·구현" },
      { depth: 2, name: "A. 시스템 구성" }, { depth: 3, name: "A-1. 아키텍처 다이어그램" },
      { depth: 1, name: "5. 검증·테스트" },
      { depth: 2, name: "A. 테스트" }, { depth: 3, name: "A-1. 테스트 시나리오" }, { depth: 3, name: "A-2. 검증 결과서" }
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
