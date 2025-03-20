import { Controller, Get, Inject, Param } from '@nestjs/common';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { OpenAIService } from 'src/openai/openai.service';
import { RespInterceptor } from 'src/tools/decorator';
import { CommentService } from './comment.service';

@LogRequests()
@Controller('comment')
export class CommentController {
  constructor(
    @Inject(CommentService)
    private readonly commentService: CommentService,
    @Inject(OpenAIService)
    private readonly openAiService: OpenAIService,
  ) {}

  @Get('/:id/summary')
  @RespInterceptor
  async getCommentSummary(@Param('id') id: number) {
    const comment = await this.commentService.getCommentByCommentId(id);

    const summary = await this.openAiService.getOpenAI([
      {
        role: 'system',
        content:
          '글에서 뉴스 독자들이 읽을만한 부분을 쉽고 짧게 요약해 줘. 내용과 관계 없는 쓸데 없는 말은 빼고.',
      },
      { role: 'user', content: comment.comment },
    ]);

    return summary;
  }
}
