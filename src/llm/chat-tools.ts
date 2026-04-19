import { ChatCompletionTool } from 'openai/resources';

export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_news',
      description: '뉴스를 검색합니다. semanticQuery만 주면 전체 뉴스에서 의미 검색. query를 주면 제목 키워드 매칭 후 의미 검색. 넓은 주제는 semanticQuery만, 구체적 제목을 알면 query도 함께.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '제목 키워드 (선택). 생략하면 전체 뉴스 대상으로 semanticQuery 검색.' },
          semanticQuery: { type: 'string', description: '의미 검색 쿼리. 사용자 질문의 핵심 의도를 담은 구체적인 문장으로 작성. query 생략 시 필수.' },
        },
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
      name: 'get_news_section_comments',
      description: '특정 뉴스의 특정 코멘트 타입 섹션의 모든 코멘트(본문 포함)를 가져옵니다. 예: 뉴스 X의 청와대 코멘트 전부.',
      parameters: {
        type: 'object',
        properties: {
          newsId: { type: 'number', description: '뉴스 ID' },
          commentType: { type: 'string', description: '코멘트 타입 (예: 청와대, 행정부, 국민의힘, 더불어민주당)' },
          semanticQuery: { type: 'string', description: '결과 필터링용 의미 검색 쿼리.' },
        },
        required: ['newsId', 'commentType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_comment_body',
      description: '코멘트 ID 하나로 해당 코멘트 본문과 같은 섹션의 다른 코멘트 제목/날짜를 반환합니다. 사용자가 특정 코멘트를 보고 있거나 list_comment_titles에서 찾은 ID로 본문이 필요할 때 사용.',
      parameters: {
        type: 'object',
        properties: {
          commentId: { type: 'number', description: '코멘트 ID' },
        },
        required: ['commentId'],
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
      name: 'list_comment_titles',
      description: '코멘트 목록(제목/타입/날짜)을 가져옵니다. 본문은 없음 - 필요시 get_news_comments(commentId)로 조회. 기본 최근 100개. endDate만: 그 날짜 이전 최신순 100개. startDate만: 그 날짜 이후 오래된순 100개. 둘 다: 범위 내 최신순 100개.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '가져올 개수 (기본 100)' },
          commentType: { type: 'string', description: '코멘트 타입 필터. 생략하면 전체.' },
          startDate: { type: 'string', description: '시작 날짜 (YYYY-MM-DD, 포함).' },
          endDate: { type: 'string', description: '종료 날짜 (YYYY-MM-DD, 포함).' },
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
  {
    type: 'function',
    function: {
      name: 'get_stock_price',
      description: '주식/지수 가격을 조회합니다. 종목명(한글/영어) 또는 티커 심볼로 검색. 예: 삼성전자, AAPL, KOSPI, Tesla',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '종목명 또는 티커 심볼' },
          period: { type: 'string', description: '조회 기간 (기본 5d). 예: 1d, 5d, 1mo, 3mo, 6mo, 1y' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_market_summary',
      description: '주요 시장 지수(KOSPI, KOSDAQ, S&P 500, NASDAQ)의 현재 가격과 등락률을 한번에 조회합니다. "시장 어때", "오늘 증시" 같은 질문에 사용.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_economic_data',
      description: '한국은행 ECOS에서 경제 통계를 조회합니다. GDP, 물가(CPI), 기준금리, 환율, 통화량 등. 알려진 지표명을 쓰거나 통계코드를 직접 지정.',
      parameters: {
        type: 'object',
        properties: {
          indicator: {
            type: 'string',
            description: '조회할 지표. 알려진 이름: GDP, CPI, 기준금리, 환율(USD), 환율(JPY), 환율(EUR), 환율(CNY), 국고채3년, 국고채10년, 회사채, CD금리, 콜금리, M2, 생산자물가. 또는 ECOS 통계코드 직접 입력 (예: 200Y104).',
          },
          cycle: {
            type: 'string',
            description: '주기: A(연간), Q(분기), M(월간), D(일간). 생략하면 지표에 맞는 기본값 사용.',
          },
          startDate: {
            type: 'string',
            description: '시작 날짜. 연간: 2020, 분기: 2023Q1, 월간: 202301, 일간: 20260101. 생략 시 최근 데이터.',
          },
          endDate: {
            type: 'string',
            description: '종료 날짜. 형식은 startDate와 동일. 생략 시 최신.',
          },
          itemCode: {
            type: 'string',
            description: 'ECOS 항목코드. 알려진 지표 사용 시 자동 설정되므로 보통 생략.',
          },
        },
        required: ['indicator'],
      },
    },
  },
];
