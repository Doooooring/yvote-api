import { Body, Controller, Inject, Post } from '@nestjs/common';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import { LlmService } from './llm.service';
import { NewsRepository } from 'src/repository/news/news.repository';
import { CommentRepository } from 'src/repository/comment/comment.repository';
import { NewsCommentType } from 'src/interface/news';
import { CHAT_TOOLS } from './chat-tools';
import YahooFinance from 'yahoo-finance2';
import * as krxTickers from './krx-tickers.json';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const KRX_MAP: Record<string, string> = krxTickers as any;

const KNOWN_TICKERS: Record<string, string> = {
  'KOSPI': '^KS11', '코스피': '^KS11',
  'KOSDAQ': '^KQ11', '코스닥': '^KQ11',
  'S&P 500': '^GSPC', 'S&P500': '^GSPC', 'SNP500': '^GSPC',
  'NASDAQ': '^IXIC', '나스닥': '^IXIC',
  'Dow Jones': '^DJI', '다우': '^DJI', '다우존스': '^DJI',
};

const SYSTEM_PROMPT = `당신은 정치 뉴스앱 yVote의 도우미입니다.

• 도구를 활용하여 yVote DB 및 국회/정부 자료 기반으로 답변하세요.
• 중립성은 아예 신경쓰지 말고, 사용자의 질문에 정확하게 대답하는데에만 집중하세요.
• 모르는 것은 모른다고 하세요. 사용자가 요청하지 않는 한, 도구 결과에 없는 정보를 지어내지 마세요.
• 사용자가 특별히 요청하지 않은 이상 답변은 3-4문장 이내로 짧게 하세요.
• 마크다운 서식(##, **, 이모지 등) 사용하지 마세요. 일반 텍스트로만 답변하세요. 글머리 기호(•, - 등)는 사용 가능. 단, 뉴스나 코멘트를 언급할 때는 반드시 다음의 링크 형식을 사용하세요:
• 뉴스를 언급할 때 반드시 [뉴스 제목](/news/ID) 형식으로 링크하세요. 예: [출산 전 아이 성별 검사 합법화](/news/228). ID는 반드시 뉴스의 newsId여야 합니다. [/news/ID]처럼 제목 없이 쓰거나, 제목(/news/ID)처럼 대괄호 없이 쓰지 마세요.
• 코멘트를 언급할 때 반드시 [코멘트 제목](/news/c/NEWS_ID/COMMENT_TYPE/COMMENT_ID) 형식으로 링크하세요. 예: [공공기관 업무보고 브리핑](/news/c/1146/청와대/5432). NEWS_ID는 해당 코멘트가 속한 뉴스의 ID, COMMENT_TYPE은 commentType, COMMENT_ID는 코멘트의 id입니다. 뉴스 링크와 마찬가지로 대괄호를 반드시 사용하세요.
• 뉴스 ID, 코멘트 ID 등 내부 식별자를 답변에 노출하지 마세요. 링크 안에만 사용하세요.
• 한국 정치 관련내용 아니어도 웬만하면 물어본거에 답하고, 정치 얘기만 해달라는 듯이 첨언하지 마세요.
• "현재 화면 정보"에 "사용자의 최근 행동"이 포함될 수 있습니다. 여기에는 사용자가 앱에서 클릭하거나 이동한 내용이 표시됩니다. 사용자가 "이거 뭐야", "요약해줘" 등 맥락 의존적 질문을 하면 최근 행동에 나온 뉴스 ID나 코멘트 ID를 활용하여 도구로 조회하세요. 사용자에게 "뭘 눌렀는지 알려주세요"라고 되묻지 마세요.

DB 구조:
• 이 서비스에서 뉴스라 함은, 특정 주제에 관한 Comment(자료)들과 그에 대한 메타데이터(제목, 날짜, 뉴스타입 등)를 모두 포함하는 개념입니다. 뉴스 하나가 여러 개의 commentType, 그 아래 원문 자료(공식 브리핑 및 정당 논평)들을 가질 수 있습니다. 별도의 뉴스로 존재하는 경우는 서비스의 뉴스 선정 기준에 부합하는 주제입니다. 그에 해당하지 않는 자료들은 해당 시기의 weekly 뉴스 안에 코멘트로 포함되어 있을 수 있습니다. 각 newstype별 뉴스는 다음의 기준으로 선정됩니다:
- 본회의 최종 표결 및 공포 과정에서 정부/여당과 야당의 입장이 달랐던 경우는 bill(법률) 뉴스로 존재.
- 대중에게 공개된 모든 국무회의 자료는 cabinet(국무회의) 뉴스(예: "제15회 임시국무회의")로 존재.
- 해외 정상 또는 정상급 인사와의 외교 관련 뉴스는 diplomat(정상외교) 뉴스로 존재.
- 반대 의견이 명확히 존재한 시행령 관련 뉴스는 executive(시행령) 뉴스로 존재.
- 매달 헌법재판소가 선정한 주요 결정은 constitution(헌재) 뉴스로 존재.
- 대통령 또는 정부의 공식 기조가 선명하게 드러나고 후속 조치들이 비중 있게 다뤄지는 주제는 govern(행정) 뉴스로 존재. 정부 부처별 업무보고 또한 이 형태로 존재.
- 선거 관련 뉴스는 election(선거) 뉴스로 존재. 예산안 및 추경 예산안은 budget(예산) 뉴스로 존재. 특검 관련 뉴스는 specialcounsel(특검) 뉴스로 존재. 북한 관련 뉴스는 northkorea(북한) 뉴스로 존재. 국정조사 관련 뉴스는 investigation(국조) 뉴스로 존재.
- 기타 분류하기 어렵지만 여야의 공방이 높은 강도로 지속된 주제는 debate(논평) 뉴스로 존재.
- 이외 모든 자료는 전부 weekly(주간) 뉴스(제목 예: "2026년 4월 2주차") 안에 포함. weekly 뉴스는 매주 월-일요일 단위로 발행. 특정 주제에 관련된 뉴스나 자료가 부실한 것 같다면 해당 시기의 weekly 뉴스 코멘트를 검색해야 함.
• News의 메타데이터: id, title, subTitle, date, newsType, state(0=발행,1=대기,2=미발행), timeline, agendaList, speechContent, summary or summaries(코멘트별 요약), commentTypes(해당 뉴스에 어떤 코멘트 타입이 있는지)
• Comment(코멘트): 각 뉴스에 대한 청와대/행정부/정당 등의 공식 입장·브리핑·논평 자료. commentType별로 분류되어있음.
• commentType : 입법부(개정안 관련 내용 등 국회 공식 자료), 청와대(대통령 공식 자료, 윤석열 정부 시기 외 전체), 대통령실(윤석열 정부 시기 2022.5.10~2025.12.29만), 행정부(국무총리 및 부처별 공식 자료), 헌법재판소(판결문), 국민의힘, 더불어민주당, 기타(군소 정당 등). 과거 정당명도 시대별로 별도 commentType로 존재 — 한나라당(~2012.2), 새누리당(2012.2~2017.2), 자유한국당(2017.2~2020.2), 미래통합당(2020.2~2020.9)는 국민의힘 lineage; 통합민주당(~2008.7), 민주당(2008.7~2011.12, 2013.5~2014.3), 민주통합당(2011.12~2013.5), 새정치민주연합(2014.3~2015.12)는 더불어민주당 lineage.
• 제21대 국회 임기 : 2020년 5월 30일 ~ 2024년 5월 29일
• 윤석열 대통령 임기 : 2022년 5월 10일 ~ 2025년 4월 4일 (탄핵)
• 제22대 국회 임기 : 2024년 5월 30일 ~ 2028년 5월 29일
• 이재명 대통령 임기 : 2025년 6월 4일 ~ (임기 중)

도구 사용 전략:
• 한 번에 1~2개만 호출하세요. 결과를 보고 다음 단계를 결정하세요.
• 날짜, ID, 의안번호 등 파라미터를 추측하거나 기억에서 꺼내지 마세요. 모르면 파라미터 없이 먼저 호출해서 알아내세요.
• 뉴스/코멘트 찾기: 넓은 주제면 search_news(semanticQuery)로 의미 검색. 구체적 제목을 알면 search_news(query+semanticQuery). 키워드 검색 결과 없으면 semanticQuery만으로 재시도.
• 뉴스를 찾은 뒤: get_news로 메타데이터만 보고 끝내지 마세요. 사용자가 내용을 물으면 반드시 get_news_section_comments로 코멘트(공식 자료)도 조회하세요. 뉴스의 실질적 내용은 코멘트에 있습니다.
• 화면 정보에 "코멘트{ID}"가 보이면 사용자가 해당 코멘트를 보고 있는 것입니다. get_comment_body(commentId)로 본문과 같은 섹션의 다른 코멘트 제목을 한 번에 가져옵니다.
• list_comment_titles로 코멘트 ID를 찾은 뒤 본문이 필요하면 get_comment_body(commentId)를 호출하세요.
• 법령 질문 → get_law_amendment(query)로 이력 먼저 확인 → 날짜 확인 → get_law_amendment(query, date)로 상세 조회

의미 검색 필터링(semanticQuery):
• 도구 결과가 클 때, semanticQuery 문장과 의미적으로 가장 가까운 항목 20개만 남기는 필터가 자동 적용됩니다.
• semanticQuery를 직접 지정하면 그 문장 기준으로 필터링합니다. 생략하면 검색 키워드+사용자 질문이 자동 사용됩니다.
• 사용자가 특정 주제를 물을 때, semanticQuery에 해당 주제를 구체적으로 서술하세요. 예: 사용자가 "최근 교육 관련 법 개정 뭐 있어?"라고 물으면 semanticQuery를 "초중등교육 고등교육 학교 교원 학생 교육과정 관련 법률 개정"처럼 의도를 풀어서 작성.
• 전체 목록이 필요하면 semanticQuery를 생략하세요.`;

const MAX_TOOL_ROUNDS = 5;

@LogRequests()
@Controller('chat')
export class ChatController {
  constructor(
    @Inject(LlmService)
    private readonly llmService: LlmService,
    @Inject(NewsRepository)
    private readonly newsRepository: NewsRepository,
    @Inject(CommentRepository)
    private readonly commentRepository: CommentRepository,
  ) {}

  @Post('/')
  @RespInterceptor
  async chat(
    @Body()
    body: {
      messages: { role: 'user' | 'assistant'; text: string }[];
      model?: 'grok' | 'gpt' | 'claude';
      context?: string;
    },
  ) {
    const { messages, model = 'gpt', context } = body;
    const modelId = model === 'claude' ? 'claude-haiku-4-5-20251001'
      : model === 'gpt' ? 'gpt-5-nano'
      : 'grok-4-1-fast-reasoning';

    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\n현재 화면 정보:\n${context}`
      : SYSTEM_PROMPT;

    const formatted: any[] = [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
    ];

    // Agent loop with tool calling
    try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await this.llmService.chatWithTools(
        formatted,
        modelId,
        CHAT_TOOLS,
      );

      const choice = completion.choices?.[0];
      if (!choice) return '응답을 받지 못했습니다.';

      const msg = choice.message;

      const toolNames = msg.tool_calls?.map((t: any) => `${t.function.name}(${t.function.arguments.slice(0, 50)})`) || [];
      console.log(`[Chat] Round ${round}: tools=[${toolNames.join(', ')}] content=${msg.content?.slice(0, 80) || 'none'}`);
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        formatted.push(msg);

        const userQuery = messages[messages.length - 1]?.text || '';
        for (const toolCall of msg.tool_calls) {
          const toolArgs = JSON.parse(toolCall.function.arguments);
          const result = await this.executeTool(
            toolCall.function.name,
            toolArgs,
          );
          const filterTerms = toolArgs.semanticQuery
            || [toolArgs.query, toolArgs.lawName, toolArgs.keyword, userQuery]
              .filter(Boolean).join(' ');
          const filtered = await this.semanticFilter(result, filterTerms);
          formatted.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: filtered,
          });
        }
        continue;
      }

      return msg.content || '응답을 받지 못했습니다.';
    }

    // If we exhausted rounds, return whatever we have
    const last = await this.llmService.getOpenAI(formatted, modelId);
    return last || '응답을 받지 못했습니다.';
    } catch (e) {
      console.error('[Chat] Error:', e);
      throw e;
    }
  }

  private async semanticFilter(result: any, query: string): Promise<string> {
    if (!query) return JSON.stringify(result, null, 0);

    const resultStr = JSON.stringify(result, null, 0);
    if (resultStr.length < 5000) return resultStr;

    try {
      // Extract text chunks from the result
      const chunks: { index: number; text: string; item: any; arrayKey: string }[] = [];

      const extract = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach((item, i) => {
            const text = typeof item === 'string' ? item
              : JSON.stringify(item, null, 0);
            if (text.length > 20) {
              chunks.push({ index: i, text: text.slice(0, 2000), item, arrayKey: '_root' });
            }
          });
        } else if (obj && typeof obj === 'object') {
          for (const key of Object.keys(obj)) {
            if (Array.isArray(obj[key]) && obj[key].length > 3) {
              obj[key].forEach((item: any, i: number) => {
                const text = typeof item === 'string' ? item
                  : JSON.stringify(item, null, 0);
                if (text.length > 20) {
                  chunks.push({ index: i, text: text.slice(0, 2000), item, arrayKey: key });
                }
              });
            }
          }
        }
      };

      extract(result);

      if (chunks.length === 0) return resultStr;

      // Embed in batches of 500
      const allEmbeddings: number[][] = [];
      const queryAndTexts = [query, ...chunks.map(c => c.text)];
      for (let i = 0; i < queryAndTexts.length; i += 500) {
        const batch = queryAndTexts.slice(i, i + 500);
        const batchEmb = await this.llmService.getEmbeddings(batch);
        allEmbeddings.push(...batchEmb);
      }
      const embeddings = allEmbeddings;
      const queryEmb = embeddings[0];

      // Score and rank
      const scored = chunks.map((c, i) => {
        const docEmb = embeddings[i + 1];
        let dot = 0, normQ = 0, normD = 0;
        for (let j = 0; j < queryEmb.length; j++) {
          dot += queryEmb[j] * docEmb[j];
          normQ += queryEmb[j] * queryEmb[j];
          normD += docEmb[j] * docEmb[j];
        }
        return { ...c, similarity: dot / (Math.sqrt(normQ) * Math.sqrt(normD)) };
      });

      scored.sort((a, b) => b.similarity - a.similarity);
      const topItems = scored.slice(0, 20).map(s => s.item);

      if (Array.isArray(result)) return JSON.stringify(topItems, null, 0);

      const filtered = { ...result };
      const targetKey = chunks[0]?.arrayKey;
      if (targetKey && targetKey !== '_root' && filtered[targetKey]) {
        filtered[targetKey] = topItems;
      } else {
        for (const key of Object.keys(filtered)) {
          if (Array.isArray(filtered[key]) && filtered[key].length > 3) {
            filtered[key] = topItems;
            break;
          }
        }
      }
      return JSON.stringify(filtered, null, 0);
    } catch (e) {
      // Fallback: send compact index (titles/numbers only) instead of full data
      const compactify = (obj: any): any => {
        if (Array.isArray(obj) && obj.length > 20) {
          return obj.map((item: any) => {
            if (typeof item === 'object' && item !== null) {
              const compact: any = {};
              for (const key of Object.keys(item)) {
                const val = item[key];
                if (typeof val === 'string' && val.length > 100) {
                  compact[key] = val.slice(0, 50) + '...';
                } else if (typeof val !== 'object') {
                  compact[key] = val;
                }
              }
              return compact;
            }
            return typeof item === 'string' ? item.slice(0, 50) : item;
          });
        }
        if (obj && typeof obj === 'object') {
          const out: any = {};
          for (const key of Object.keys(obj)) {
            out[key] = compactify(obj[key]);
          }
          return out;
        }
        return obj;
      };
      return JSON.stringify(compactify(result), null, 0);
    }
  }

  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'search_news': {
        const result = args.query
          ? await this.newsRepository.getNewsTitles(args.query)
          : await this.newsRepository.getAllNewsTitles();
        return (result || []).map((n) => ({
          id: n.id,
          title: n.title,
          subTitle: n.subTitle || '',
        }));
      }

      case 'get_news': {
        let news;
        try {
          news = await this.newsRepository.getNewsInView(args.newsId);
        } catch {
          return { error: 'news not found', newsId: args.newsId };
        }
        if (!news) return { error: 'news not found', newsId: args.newsId };
        if (String(news.state) === '2') return { error: 'news not found', newsId: args.newsId };

        const countRows = await this.commentRepository.getCommentCountsByNewsId(args.newsId);
        const commentCounts = countRows.map((r) => ({
          commentType: r.commentType,
          count: Number(r.count),
        }));
        const commentTypes = commentCounts.map((c) => c.commentType);

        const result: any = {
          id: news.id,
          title: news.title,
          subTitle: news.subTitle,
          date: news.date,
          newsType: news.newsType,
          state: news.state,
          summary: news.summary,
          proDebate: news.proDebate,
          conDebate: news.conDebate,
          detail: news.detail,
          keywords: news.keywords,
          timeline: news.timeline,
          summaries: news.summaries?.map((s: any) => ({
            commentType: s.commentType,
            summary: s.summary,
          })),
          commentTypes,
          commentCounts,
        };

        return result;
      }

      case 'get_news_section_comments': {
        let newsCheck;
        try {
          newsCheck = await this.newsRepository.getNewsInView(args.newsId);
          if (!newsCheck || String(newsCheck.state) === '2') return { error: 'news not found' };
        } catch { return { error: 'news not found' }; }

        const commentList = await this.commentRepository.getCommentByNewsIdAndCommentType(
          args.newsId,
          args.commentType,
          0,
          30,
        );
        if (!commentList || commentList.length === 0) {
          const available = (newsCheck?.comments as unknown as string[]) || [];
          return { error: 'no comments found', available };
        }
        return {
          newsId: args.newsId,
          newsTitle: newsCheck.title,
          comments: commentList.map((c: any) => ({
            id: c.id,
            title: c.title,
            comment: c.comment || '',
            date: c.date,
          })),
        };
      }

      case 'get_comment_body': {
        const single = await this.commentRepository.getCommentByCommentId(args.commentId);
        if (!single) return { error: 'comment not found', commentId: args.commentId };
        const newsId = (single as any).news?.id;
        if (!newsId) return { error: 'comment has no news linkage', commentId: args.commentId };
        let newsCheck;
        try {
          newsCheck = await this.newsRepository.getNewsInView(newsId);
          if (!newsCheck || String(newsCheck.state) === '2') return { error: 'news not found' };
        } catch { return { error: 'news not found' }; }
        const siblings = await this.commentRepository.getCommentByNewsIdAndCommentType(
          newsId, single.commentType as NewsCommentType, 0, 30,
        );
        return {
          comment: { id: single.id, title: single.title, comment: single.comment || '', date: single.date, commentType: single.commentType, newsId, newsTitle: newsCheck.title },
          otherComments: (siblings || [])
            .filter((c: any) => c.id !== single.id)
            .map((c: any) => ({ id: c.id, title: c.title, date: c.date })),
        };
      }

      case 'get_recent_news': {
        const limit = args.limit || 10;
        const previews = await this.newsRepository.getNewsPreviews(
          0,
          limit * 2,
          { state: '0' as any, newsType: args.newsType },
        );
        const items = previews || [];
        return items.slice(0, limit).map((n: any) => ({
          id: n.id,
          title: n.title,
          subTitle: n.subTitle,
          date: n.date,
          newsType: n.newsType,
        }));
      }

      case 'list_comment_titles': {
        const limit = args.limit || 100;
        const option: any = {};
        if (args.commentType) option.type = args.commentType;
        if (args.startDate) option.startDate = args.startDate;
        if (args.endDate) option.endDate = args.endDate;
        option.order = args.startDate && !args.endDate ? 'ASC' : 'DESC';
        const comments = await this.commentRepository.getCommentsRecentUpdated(0, limit, option);
        return (comments || []).slice(0, limit).map((c: any) => ({
          id: c.id,
          title: c.title,
          commentType: c.commentType,
          date: c.date,
          newsId: c.news?.id,
          newsTitle: c.news?.title,
        }));
      }

      case 'get_current_law': {
        try {
          const apiKey = process.env.OPEN_LAW_API_KEY || '';
          const query = args.query.trim();

          const searchUrl = `https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=law&type=JSON&query=${encodeURIComponent(query)}&display=100`;
          const searchResp = await fetch(searchUrl);
          const searchData = await searchResp.json();
          const allLaws = searchData?.LawSearch?.law || [];
          const lawList = Array.isArray(allLaws) ? allLaws : [allLaws];
          const exact = lawList.filter((l: any) => (l['법령명한글'] || '').trim() === query);
          const matched = exact.length > 0 ? exact : lawList.filter((l: any) => (l['법령명한글'] || '').includes(query));

          if (matched.length === 0) return { error: 'no matching law found', query };

          const law = matched[0];
          const mst = law['법령일련번호'];
          const lawUrl = `https://www.law.go.kr/DRF/lawService.do?OC=${apiKey}&target=law&MST=${mst}&type=JSON`;
          const lawResp = await fetch(lawUrl);
          const lawData = await lawResp.json();
          const articles = lawData?.['법령']?.['조문']?.['조문단위'] || [];
          const artList = Array.isArray(articles) ? articles : [articles];

          const buildContent = (a: any) => {
            let text = (a['조문내용'] || '').replace(/<[^>]+>/g, '').trim();
            const paragraphs = a['항'];
            if (paragraphs) {
              const pList = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
              const pTexts = pList.map((p: any) => (p['항내용'] || '').replace(/<[^>]+>/g, '').trim()).filter(Boolean);
              if (pTexts.length > 0) text += '\n' + pTexts.join('\n');
            }
            return text;
          };

          return {
            name: law['법령명한글'],
            mst,
            type: law['법령구분명'],
            department: law['소관부처명'],
            promulgateDate: law['공포일자'],
            enforceDate: law['시행일자'],
            totalArticles: artList.length,
            articles: artList.map((a: any) => ({
              number: a['조문번호'] || '',
              title: (a['조문제목'] || '').trim(),
              content: buildContent(a),
            })).filter((a: any) => a.content && a.content.length > 5),
          };
        } catch (e) {
          return { error: `current law lookup failed: ${e}` };
        }
      }

      case 'get_law_amendment': {
        try {
          const apiKey = process.env.OPEN_LAW_API_KEY || '';
          const query = args.query.trim();

          // First find the law to get its MST/ID
          const searchUrl = `https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=law&type=JSON&query=${encodeURIComponent(query)}&display=100`;
          const searchResp = await fetch(searchUrl);
          const searchData = await searchResp.json();
          const allLaws = searchData?.LawSearch?.law || [];
          const lawList = Array.isArray(allLaws) ? allLaws : [allLaws];
          const exact = lawList.filter((l: any) => (l['법령명한글'] || '').trim() === query);
          const matched = exact.length > 0 ? exact : lawList.filter((l: any) => (l['법령명한글'] || '').includes(query));

          if (matched.length === 0) return { error: 'no matching law found', query };

          const law = matched[0];

          // No date: return full amendment history from 부칙
          if (!args.date) {
            const mst = law['법령일련번호'];
            const lawUrl = `https://www.law.go.kr/DRF/lawService.do?OC=${apiKey}&target=law&MST=${mst}&type=JSON`;
            const lawResp = await fetch(lawUrl);
            const lawData = await lawResp.json();
            const appendices = lawData?.['법령']?.['부칙']?.['부칙단위'] || [];
            const appList = Array.isArray(appendices) ? appendices : [appendices];
            return {
              name: law['법령명한글'],
              totalAmendments: appList.length,
              history: appList.map((a: any) => ({
                date: a['부칙공포일자'],
              })).sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
            };
          }

          // With date: find amendment MST via lsHstInf + old/new comparison
          const amendments: any[] = [];
          for (let page = 1; page <= 5; page++) {
            const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=lsHstInf&type=JSON&regDt=${args.date}&display=100&page=${page}`;
            const resp = await fetch(url);
            const data = await resp.json();
            const searchResult = data?.[Object.keys(data)[0]] || {};
            const laws = searchResult?.law || [];
            const list = Array.isArray(laws) ? laws : laws ? [laws] : [];
            if (list.length === 0) break;
            for (const l of list) {
              const name = l['법령명한글'] || '';
              if (name.includes(query) || query.includes(name)) {
                amendments.push({
                  name,
                  mst: l['법령일련번호'],
                  promulgateDate: l['공포일자'],
                  enforceDate: l['시행일자'],
                  amendType: l['제개정구분명'],
                  status: l['현행연혁코드'],
                });
              }
            }
          }

          if (amendments.length === 0) return { error: 'no amendments found for this date', query, date: args.date };

          const targetAmendment = amendments.find((a: any) => a.promulgateDate === args.date) || amendments[0];

          // Fetch article-level changes via lsJoHstInf
          const joUrl = `https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=lsJoHstInf&type=JSON&regDt=${args.date}`;
          const joResp = await fetch(joUrl);
          const joData = await joResp.json();
          const joLaws = joData?.LawSearch?.law || [];
          const joList = Array.isArray(joLaws) ? joLaws : joLaws ? [joLaws] : [];
          const matchingJo = joList.find((l: any) => {
            const name = l?.['법령정보']?.['법령명한글'] || '';
            return name.includes(query) || query.includes(name);
          });
          let changedArticles: any[] = [];
          if (matchingJo) {
            const joInfo = matchingJo['조문정보']?.jo || [];
            const arts = Array.isArray(joInfo) ? joInfo : [joInfo];
            changedArticles = arts.map((j: any) => ({
              articleNo: j['조문번호'],
              changeType: j['변경사유'],
              amendDate: j['조문개정일'],
              enforceDate: j['조문시행일'],
            }));
          }

          // Fetch old/new comparison
          const onUrl = `https://www.law.go.kr/DRF/lawService.do?OC=${apiKey}&target=oldAndNew&MST=${targetAmendment.mst}&type=JSON`;
          const onResp = await fetch(onUrl);
          const onData = await onResp.json();
          const srv = onData?.OldAndNewService || {};

          const parseArticles = (list: any) => {
            if (!list?.조문) return [];
            const arts = Array.isArray(list.조문) ? list.조문 : [list.조문];
            return arts.map((a: any) => (a.content || '').replace(/<[^>]+>/g, '').trim());
          };

          return {
            amendments,
            changedArticles,
            comparison: {
              mst: targetAmendment.mst,
              oldArticles: parseArticles(srv['구조문목록']),
              newArticles: parseArticles(srv['신조문목록']),
            },
          };
        } catch (e) {
          return { error: `law amendment lookup failed: ${e}` };
        }
      }

      case 'browse_laws': {
        try {
          const apiKey = process.env.OPEN_LAW_API_KEY || '';
          const limit = args.limit || 20;
          let params = `OC=${apiKey}&target=law&type=JSON&display=${limit}`;
          if (args.query) params += `&query=${encodeURIComponent(args.query)}`;
          if (args.ancYd) params += `&ancYd=${args.ancYd}`;
          if (args.efYd) params += `&efYd=${args.efYd}`;
          if (args.rrClsCd) params += `&rrClsCd=${args.rrClsCd}`;
          if (args.sort) params += `&sort=${args.sort}`;

          const url = `https://www.law.go.kr/DRF/lawSearch.do?${params}`;
          const resp = await fetch(url);
          const data = await resp.json();
          const searchResult = data?.LawSearch || {};
          const laws = searchResult?.law || [];
          const list = Array.isArray(laws) ? laws : laws ? [laws] : [];

          return {
            total: searchResult.totalCnt,
            laws: list.map((l: any) => ({
              name: l['법령명한글'],
              abbreviation: l['법령약칭명'],
              mst: l['법령일련번호'],
              type: l['법령구분명'],
              department: l['소관부처명'],
              promulgateDate: l['공포일자'],
              enforceDate: l['시행일자'],
              amendType: l['제개정구분명'],
            })),
          };
        } catch (e) {
          return { error: `browse laws failed: ${e}` };
        }
      }

      case 'get_bill_info': {
        try {
          const apiKey = '82b20bdd65a648c6b72fa5a0c5cc34dd';
          const base = 'https://open.assembly.go.kr/portal/openapi';
          // Get bill intro
          const introUrl = `${base}/BPMBILLSUMMARY?KEY=${apiKey}&Type=json&BILL_NO=${args.billNo}`;
          const introResp = await fetch(introUrl);
          const introData = await introResp.json();
          const introRows = introData?.BPMBILLSUMMARY?.[1]?.row || [];
          const intro = introRows[0] || {};

          // Get bill main info
          const age = intro.AGE || '22';
          const mainUrl = `${base}/nwbpacrgavhjryiph?KEY=${apiKey}&Type=json&AGE=${age}&BILL_NO=${args.billNo}&pIndex=1&pSize=10`;
          const mainResp = await fetch(mainUrl);
          const mainData = await mainResp.json();
          const mainRows = mainData?.nwbpacrgavhjryiph?.[1]?.row || [];
          const main = mainRows[0] || {};

          return {
            billName: intro.BILL_NAME || main.BILL_NAME,
            summary: intro.SUMMARY,
            proposer: main.PROPOSER,
            committee: main.CURR_COMMITTEE,
            voteResult: main.PROC_RESULT,
            totalVotes: main.VOTE_TCNT,
            forVotes: main.YES_TCNT,
            againstVotes: main.NO_TCNT,
            abstainVotes: main.ABSTAIN_TCNT,
            proposeDate: main.PROPOSE_DT,
            committeeDate: main.CMT_PRESENT_DT,
            plenaryDate: main.PLENARY_PRESENT_DT,
            promulgateDate: main.ANNOUNCE_DT,
          };
        } catch (e) {
          return { error: `bill info failed: ${e}` };
        }
      }

      case 'get_bill_votes': {
        try {
          const apiKey = '82b20bdd65a648c6b72fa5a0c5cc34dd';
          const base = 'https://open.assembly.go.kr/portal/openapi';
          // First get BILL_ID from intro
          const introUrl = `${base}/BPMBILLSUMMARY?KEY=${apiKey}&Type=json&BILL_NO=${args.billNo}`;
          const introResp = await fetch(introUrl);
          const introData = await introResp.json();
          const introRows = introData?.BPMBILLSUMMARY?.[1]?.row || [];
          const intro = introRows[0] || {};
          const billId = `PRC_${args.billNo.slice(2)}`;
          const age = intro.AGE || '22';

          const voteUrl = `${base}/nojepdqqaweusdfbi?KEY=${apiKey}&Type=json&AGE=${age}&BILL_ID=${billId}&pIndex=1&pSize=400`;
          const voteResp = await fetch(voteUrl);
          const voteData = await voteResp.json();
          const voteRows = voteData?.nojepdqqaweusdfbi?.[1]?.row || [];

          const byParty: Record<string, any> = {};
          for (const row of voteRows) {
            const party = row.POLY_NM || '무소속';
            if (!byParty[party]) byParty[party] = { party, for: 0, against: 0, abstain: 0, absent: 0 };
            const result = row.RESULT_VOTE_MOD;
            if (result === '찬성') byParty[party].for++;
            else if (result === '반대') byParty[party].against++;
            else if (result === '기권') byParty[party].abstain++;
            else byParty[party].absent++;
          }
          return Object.values(byParty);
        } catch (e) {
          return { error: `bill votes failed: ${e}` };
        }
      }

      case 'get_stock_price': {
        try {
          const query = (args.query || '').trim();
          const period = args.period || '5d';
          let symbol = KNOWN_TICKERS[query] || KRX_MAP[query];

          if (!symbol) {
            try {
              const search = await yf.search(query);
              symbol = (search.quotes?.[0] as any)?.symbol;
            } catch { /* search failed, try as raw symbol */ }
          }
          if (!symbol) symbol = query;

          const quote = await yf.quote(symbol);

          const periodDays: Record<string, number> = { '1d': 2, '5d': 7, '1mo': 35, '3mo': 100, '6mo': 200, '1y': 370 };
          const days = periodDays[period] || 7;
          const now = new Date();
          const from = new Date(now);
          from.setDate(from.getDate() - days);

          let prices: any[] = [];
          try {
            const hist = await yf.chart(symbol, { period1: from, period2: now });
            prices = (hist.quotes || [])
              .filter((q: any) => q.close != null)
              .map((q: any) => ({
                date: new Date(q.date).toISOString().slice(0, 10),
                open: q.open != null ? Math.round(q.open * 100) / 100 : null,
                high: q.high != null ? Math.round(q.high * 100) / 100 : null,
                low: q.low != null ? Math.round(q.low * 100) / 100 : null,
                close: Math.round(q.close * 100) / 100,
                volume: q.volume || 0,
              }));
          } catch { /* history fetch failed, quote is enough */ }

          return {
            name: quote.shortName || quote.longName || query,
            symbol,
            currency: quote.currency || 'USD',
            price: quote.regularMarketPrice,
            change: Math.round((quote.regularMarketChange || 0) * 100) / 100,
            changePct: Math.round((quote.regularMarketChangePercent || 0) * 100) / 100,
            previousClose: quote.regularMarketPreviousClose,
            history: prices.slice(-20),
          };
        } catch (e) {
          return { error: `stock price lookup failed: ${e}` };
        }
      }

      case 'get_market_summary': {
        try {
          const symbols = ['^KS11', '^KQ11', '^GSPC', '^IXIC'];
          const names = ['KOSPI', 'KOSDAQ', 'S&P 500', 'NASDAQ'];
          const quotes = await Promise.all(symbols.map(s => yf.quote(s)));
          return quotes.map((q, i) => ({
            name: names[i],
            symbol: symbols[i],
            price: q.regularMarketPrice,
            change: Math.round((q.regularMarketChange || 0) * 100) / 100,
            changePct: Math.round((q.regularMarketChangePercent || 0) * 100) / 100,
            previousClose: q.regularMarketPreviousClose,
          }));
        } catch (e) {
          return { error: `market summary failed: ${e}` };
        }
      }

      case 'get_economic_data': {
        try {
          const ecosKey = process.env.BOK_ECOS_API_KEY || '';
          const indicator = (args.indicator || '').trim();

          const ECOS_INDICATORS: Record<string, { code: string; item: string; cycle: string }> = {
            'GDP': { code: '200Y104', item: '1400', cycle: 'Q' },
            'CPI': { code: '901Y009', item: '0', cycle: 'M' },
            '물가': { code: '901Y009', item: '0', cycle: 'M' },
            '소비자물가': { code: '901Y009', item: '0', cycle: 'M' },
            '기준금리': { code: '722Y001', item: '0101000', cycle: 'M' },
            '환율': { code: '731Y001', item: '0000001', cycle: 'D' },
            '환율(USD)': { code: '731Y001', item: '0000001', cycle: 'D' },
            '달러': { code: '731Y001', item: '0000001', cycle: 'D' },
            '환율(JPY)': { code: '731Y001', item: '0000002', cycle: 'D' },
            '엔화': { code: '731Y001', item: '0000002', cycle: 'D' },
            '환율(EUR)': { code: '731Y001', item: '0000003', cycle: 'D' },
            '유로': { code: '731Y001', item: '0000003', cycle: 'D' },
            '환율(CNY)': { code: '731Y001', item: '0000053', cycle: 'D' },
            '위안': { code: '731Y001', item: '0000053', cycle: 'D' },
            '국고채3년': { code: '817Y002', item: '010200000', cycle: 'D' },
            '국고채10년': { code: '817Y002', item: '010210000', cycle: 'D' },
            '회사채': { code: '817Y002', item: '010300000', cycle: 'D' },
            'CD금리': { code: '817Y002', item: '010502000', cycle: 'D' },
            '콜금리': { code: '817Y002', item: '010101000', cycle: 'D' },
            'M2': { code: '101Y018', item: '0', cycle: 'M' },
            '통화량': { code: '101Y018', item: '0', cycle: 'M' },
            '생산자물가': { code: '404Y014', item: '0', cycle: 'M' },
          };

          const known = ECOS_INDICATORS[indicator];
          const statCode = known?.code || indicator;
          const itemCode = args.itemCode || known?.item || '0';
          const cycle = args.cycle || known?.cycle || 'Q';

          const now = new Date();
          let startDate = args.startDate;
          let endDate = args.endDate;
          if (!endDate) {
            if (cycle === 'A') endDate = String(now.getFullYear());
            else if (cycle === 'Q') endDate = `${now.getFullYear()}Q${Math.ceil((now.getMonth() + 1) / 3)}`;
            else if (cycle === 'M') endDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
            else endDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
          }
          if (!startDate) {
            if (cycle === 'A') startDate = String(now.getFullYear() - 10);
            else if (cycle === 'Q') startDate = `${now.getFullYear() - 3}Q1`;
            else if (cycle === 'M') startDate = `${now.getFullYear() - 2}01`;
            else {
              const d = new Date(now);
              d.setDate(d.getDate() - 30);
              startDate = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
            }
          }

          const url = `https://ecos.bok.or.kr/api/StatisticSearch/${ecosKey}/json/kr/1/100/${statCode}/${cycle}/${startDate}/${endDate}/${itemCode}`;
          const resp = await fetch(url);
          const data = await resp.json();

          if (data?.RESULT?.CODE) {
            return { error: data.RESULT.MESSAGE, code: data.RESULT.CODE };
          }

          const rows = data?.StatisticSearch?.row || [];
          return {
            indicator: rows[0]?.STAT_NAME || indicator,
            itemName: rows[0]?.ITEM_NAME1 || '',
            unit: rows[0]?.UNIT_NAME || '',
            count: rows.length,
            data: rows.map((r: any) => ({
              time: r.TIME,
              value: r.DATA_VALUE,
            })),
          };
        } catch (e) {
          return { error: `ECOS lookup failed: ${e}` };
        }
      }

      default:
        return { error: `unknown tool: ${name}` };
    }
  }
}
