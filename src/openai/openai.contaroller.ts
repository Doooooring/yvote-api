import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ChatCompletionMessageParam } from 'openai/resources';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import { OpenAIService } from './openai.service';

@LogRequests()
@Controller('openai')
export class OpenAIController {
  constructor(
    @Inject(OpenAIService)
    private readonly openAIService: OpenAIService,
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
    const { message, model = 'grok-2' } = body;
    return await this.openAIService.getOpenAI(message, model);
  }
}
