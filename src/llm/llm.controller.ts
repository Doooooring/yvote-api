import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ChatCompletionMessageParam } from 'openai/resources';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import { LlmService } from './llm.service';

@LogRequests()
@Controller('llm')
export class LlmController {
  constructor(
    @Inject(LlmService)
    private readonly llmService: LlmService,
  ) {}

  @Post('/')
  @RespInterceptor
  async getAIResult(
    @Body()
    body: {
      message: Array<ChatCompletionMessageParam>;
      model?: string;
    },
  ) {
    const { message, model = 'grok-4-1-fast-reasoning' } = body;
    return await this.llmService.getOpenAI(message, model);
  }
}
