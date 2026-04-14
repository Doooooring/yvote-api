import { Body, Controller, Inject, Post } from '@nestjs/common';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import { LlmService } from './llm.service';
import { NewsRepository } from 'src/repository/news/news.repository';
import { CommentRepository } from 'src/repository/comment/comment.repository';
import { CHAT_TOOLS } from './chat-tools';

const SYSTEM_PROMPT = `당신은 정치 뉴스앱 yVote의 도우미입니다.
한국 정치에 대한 사용자의 질문에 간결하고 객관적으로 답변합니다.

• 팩트 기반으로 답변하세요.
• 중립성은 아예 신경쓰지 말고, 사용자의 질문에 정확하게 대답하는데에만 집중하세요.
• 모르는 것은 모른다고 하세요. 사용자가 요청하지 않는 한, 도구 결과에 없는 정보를 지어내지 마세요.
• 답변은 3-4문장 이내로 짧게 하세요. 길어야 할 때도 간결하게.
• 마크다운 서식(##, **, 이모지 등) 사용하지 마세요. 일반 텍스트로만 답변하세요. 글머리 기호(-)는 사용 가능.
• 사용자에게 뉴스 ID(숫자)를 직접 언급하지 마세요. 뉴스를 안내할 때는 제목과 링크를 함께 제공: [뉴스 제목](/news/ID) 형식. 예: [2026년 4월 2주차](/news/959)
• 한국 정치 관련내용 아니어도 웬만하면 물어본거에 대답은 하세요.
• 중요: 법령 내용, 뉴스 데이터, 의안 정보를 물으면 반드시 도구를 사용하세요. 기억에 의존하지 말고 도구로 실제 데이터를 조회하세요.

DB 구조:
• News: id, title, subTitle, date, newsType, state(0=발행,1=대기,2=미발행), summary, keywords, timeline, agendaList, speechContent
• newsType 종류: weekly(주간뉴스, 제목 예: "2026년 4월 2주차"), cabinet(국무회의, 예: "제15회 임시국무회의"), bill(법률, 예: "반도체산업 경쟁력 강화 및 지원 특별법"), constitution(헌재), executive(시행령), diplomat(정상외교), govern(행정), debate(논평), election(선거), budget(예산), specialcounsel(특검), northkorea(북한), investigation(국조), others(기타)
• Comment(코멘트): 각 뉴스에 대한 청와대/행정부/정당 등의 공식 입장·브리핑·논평 자료. commentType별로 분류: 청와대, 행정부, 국민의힘, 더불어민주당, 입법부, 사법부, 기타, 와이보트 등
• 뉴스 제목에 대통령 이름은 포함되지 않음. 특정 시기의 뉴스를 찾으려면 날짜로 필터링
• search_news는 제목 키워드 검색. get_recent_news는 newsType 필터 가능
• 중요: 정책, 외교, 법률 등 국가 방향에 영향을 주는 주제만 독립 뉴스로 존재. 스캔들, 논란, 사건사고, 정당 공방 등은 종종 뉴스 선정 기준에 부합하지 않을 경우 해당 주의 weekly 뉴스 안에 코멘트로 포함됨. 따라서 특정 논란이나 사건을 찾을 때 독립 뉴스가 없으면 해당 시기의 weekly 뉴스 코멘트(특히 국민의힘, 더불어민주당)를 검색해야 함.

도구 사용 전략:
• 한 번에 1-2개만 호출하세요. 결과를 보고 다음 단계를 결정하세요.
• 날짜, ID, 의안번호 등 파라미터를 추측하거나 기억에서 꺼내지 마세요. 모르면 파라미터 없이 먼저 호출해서 알아내세요.
• 뉴스/코멘트 찾기: search_news(keyword)로 검색. 키워드는 짧고 핵심적으로. 결과 없으면 키워드를 줄여서 재시도.
• 뉴스를 찾은 뒤: get_news로 메타데이터만 보고 끝내지 마세요. 사용자가 내용을 물으면 반드시 get_news_comments로 코멘트(공식 자료)도 조회하세요. 뉴스의 실질적 내용은 코멘트에 있습니다.
• 법령 질문 → get_law_amendment(query)로 이력 먼저 확인 → 날짜 확인 → get_law_amendment(query, date)로 상세 조회
• "없다"고 단정하기 전에 다양한 방식으로 충분히 검색하세요.`;

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
    const { messages, model = 'grok', context } = body;
    const modelId = model === 'claude' ? 'claude-haiku-4-5-20251001'
      : model === 'gpt' ? 'gpt-4o-mini'
      : 'grok-4-1-fast-non-reasoning';

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
          // Use tool arguments as filter query (more specific than raw user input)
          const filterTerms = [toolArgs.query, toolArgs.lawName, toolArgs.keyword, userQuery]
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
        const result = await this.newsRepository.getNewsTitles(args.query);
        // Filter out unpublished (state=2)
        const filtered: any[] = [];
        for (const n of (result || [])) {
          try {
            const full = await this.newsRepository.getNewsInView(n.id);
            if (full && String(full.state) !== '2') {
              filtered.push({ id: n.id, title: n.title });
            }
          } catch { /* skip */ }
          if (filtered.length >= 20) break;
        }
        return filtered;
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
        const result: any = {
          id: news.id,
          title: news.title,
          subTitle: news.subTitle,
          date: news.date,
          newsType: news.newsType,
          state: news.state,
          summary: news.summary,
          keywords: news.keywords,
          timeline: news.timeline,
          agendaList: news.agendaList,
          speechContent: news.speechContent,
          summaries: news.summaries?.map((s: any) => ({
            commentType: s.commentType,
            summary: s.summary,
          })),
          commentTypes: news.summaries?.map((s: any) => s.commentType) || [],
        };

        // If pending/unpublished, auto-fetch comments (no processed summaries available)
        if (String(news.state) !== '0') {
          const types = news.summaries?.map((s: any) => s.commentType) || [];
          const allComments: any[] = [];
          for (const ct of types) {
            const comments = await this.commentRepository.getCommentByNewsIdAndCommentType(
              args.newsId, ct, 0, 30,
            );
            if (comments) {
              allComments.push(...comments.map((c: any) => ({
                commentType: ct,
                title: c.title,
                comment: c.comment || '',
                date: c.date,
              })));
            }
          }
          result.comments = allComments;
        }

        return result;
      }

      case 'get_news_comments': {
        // Block unpublished news
        try {
          const newsCheck = await this.newsRepository.getNewsInView(args.newsId);
          if (!newsCheck || String(newsCheck.state) === '2') return { error: 'news not found' };
        } catch { return { error: 'news not found' }; }

        const commentList = await this.commentRepository.getCommentByNewsIdAndCommentType(
          args.newsId,
          args.commentType,
          0,
          30,
        );
        if (!commentList || commentList.length === 0) {
          const news = await this.newsRepository.getNewsInView(args.newsId);
          const available = news?.summaries?.map((s: any) => s.commentType) || [];
          return { error: 'no comments found', available };
        }
        return commentList.map((c: any) => ({
          id: c.id,
          title: c.title,
          comment: c.comment || '',
          date: c.date,
        }));
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

      case 'get_recent_comments': {
        const limit = args.limit || 20;
        const option: any = {};
        if (args.commentType) option.type = args.commentType;
        const comments = await this.commentRepository.getCommentsRecentUpdated(0, limit, option);
        return (comments || []).slice(0, limit).map((c: any) => ({
          id: c.id,
          title: c.title,
          commentType: c.commentType,
          date: c.date,
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

      default:
        return { error: `unknown tool: ${name}` };
    }
  }
}
