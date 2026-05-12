import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CommentService } from 'src/comment/comment.service';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import { LlmService } from './llm.service';

const SYSTEM_PROMPT =
  '글에서 뉴스 독자들이 읽을만한 핵심 내용을 쉽고 짧게 요약해 줘.\n\n' +
  '• 원문의 주요 사실과 주장만 남겨라.\n' +
  '• 내용과 관계없는 쓸데없는 말, 감탄사, 반복 표현은 모두 빼라.\n' +
  '• 3-5문장 이내로 간결하게 작성해라.\n' +
  '• 한국어로 답변해라.\n' +
  '• 마크다운 문법(**굵게**, ##제목 등)은 절대 사용하지 말고 일반 텍스트로만 작성해라.';

@LogRequests()
@Controller('summarize')
export class SummarizeController {
  constructor(
    @Inject(LlmService)
    private readonly llmService: LlmService,
    @Inject(CommentService)
    private readonly commentService: CommentService,
  ) {}

  async summarize(text: string): Promise<string> {
    return this.llmService.getOpenAI(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      'grok-4-1-fast-reasoning',
    );
  }

  @Post('/')
  @RespInterceptor
  async summarizeEndpoint(
    @Body()
    body: { text: string },
  ) {
    return this.summarize(body.text);
  }

  @Get('/comment/:id')
  @RespInterceptor
  async getCommentSummary(@Param('id') id: number) {
    const comment = await this.commentService.getCommentByCommentId(id);
    return this.summarize(comment.comment);
  }
}
