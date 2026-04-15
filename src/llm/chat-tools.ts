import { ChatCompletionTool } from 'openai/resources';

export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_news',
      description: '뉴스 제목으로 검색합니다. 검색어를 포함하는 뉴스 목록(id, title)을 반환합니다.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '검색할 제목 키워드' },
          semanticQuery: { type: 'string', description: '결과 필터링용 의미 검색 쿼리. 결과가 많을 때 이 문장과 의미적으로 가장 가까운 항목만 남김. 사용자 질문의 핵심 의도를 담은 구체적인 문장으로 작성.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: '뉴스 ID로 뉴스 상세 정보(제목, 부제, 날짜, 타입, 요약, 타임라인 등)를 가져옵니다.',
      parameters: {
        type: 'object',
        properties: {
          newsId: { type: 'number', description: '뉴스 ID' },
        },
        required: ['newsId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news_comments',
      description: '특정 뉴스의 특정 코멘트 타입(청와대, 행정부, 국민의힘, 더불어민주당 등)의 코멘트 목록을 가져옵니다. 코멘트 제목과 본문을 포함합니다.',
      parameters: {
        type: 'object',
        properties: {
          newsId: { type: 'number', description: '뉴스 ID' },
          commentType: { type: 'string', description: '코멘트 타입 (예: 청와대, 행정부, 국민의힘, 더불어민주당)' },
          semanticQuery: { type: 'string', description: '결과 필터링용 의미 검색 쿼리. 코멘트가 많을 때 이 문장과 가장 관련 높은 코멘트만 남김.' },
        },
        required: ['newsId', 'commentType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_news',
      description: '최근 발행된 뉴스 목록을 가져옵니다. 제목, 부제, 날짜, 뉴스타입을 포함합니다.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 개수 (기본 10)' },
          newsType: { type: 'string', description: '뉴스 타입 필터 (예: weekly, cabinet, bill 등). 생략하면 전체.' },
          semanticQuery: { type: 'string', description: '결과 필터링용 의미 검색 쿼리.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_comments',
      description: '최근 업데이트된 코멘트 목록을 가져옵니다. 제목, 코멘트타입, 날짜를 포함합니다.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 개수 (기본 20)' },
          commentType: { type: 'string', description: '코멘트 타입 필터. 생략하면 전체.' },
          semanticQuery: { type: 'string', description: '결과 필터링용 의미 검색 쿼리.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_law',
      description: '현행 법령의 조문 내용을 조회합니다. 법이 현재 뭐라고 되어있는지, 특정 조항이 뭔지 물을 때 사용.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '법령명 또는 키워드 (예: 상법, 형법)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_law_amendment',
      description: '법령 개정 조회. 날짜 있으면 해당 날짜의 개정 내용(신구조문 비교) 반환. 날짜 없으면 전체 개정 이력 목록 반환.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '법령명 또는 키워드' },
          date: { type: 'string', description: '개정일 (YYYYMMDD). 생략하면 전체 개정 이력 반환' },
          semanticQuery: { type: 'string', description: '결과 필터링용 의미 검색 쿼리. 개정 조문이 많을 때 관련 조문만 남김.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browse_laws',
      description: '법령 목록 조회. 날짜 범위, 소관부처, 제개정 종류 등으로 필터링. 법령명 없이도 "최근 한 달간 개정된 법" 같은 질문에 사용.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '법령명 검색어 (선택)' },
          ancYd: { type: 'string', description: '공포일자 범위 (YYYYMMDD~YYYYMMDD)' },
          efYd: { type: 'string', description: '시행일자 범위 (YYYYMMDD~YYYYMMDD)' },
          rrClsCd: { type: 'string', description: '제개정 종류 (300201=제정, 300202=일부개정, 300203=전부개정, 300204=폐지)' },
          sort: { type: 'string', description: '정렬 (ddes=공포일 내림차순, efdes=시행일 내림차순)' },
          limit: { type: 'number', description: '결과 수 (기본 20, 최대 100)' },
          semanticQuery: { type: 'string', description: '결과 필터링용 의미 검색 쿼리.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_bill_info',
      description: '국회 의안정보시스템에서 법안 상세 정보를 가져옵니다. 의안번호(BILL_NO)로 조회합니다. 제안자, 소관위원회, 진행상태, 투표결과 등을 반환합니다.',
      parameters: {
        type: 'object',
        properties: {
          billNo: { type: 'string', description: '의안번호 (예: 2200001)' },
        },
        required: ['billNo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_bill_votes',
      description: '법안의 정당별 투표 결과를 가져옵니다. 찬성/반대/기권/불참 수를 정당별로 반환합니다.',
      parameters: {
        type: 'object',
        properties: {
          billNo: { type: 'string', description: '의안번호' },
        },
        required: ['billNo'],
      },
    },
  },
];
