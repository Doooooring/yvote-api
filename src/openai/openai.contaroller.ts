import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ChatCompletionMessageParam } from 'openai/resources';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import { OpenAIService } from './openai.service';

@LogRequests()
@Controller('openAI')
export class OpenAIController {
  constructor(
    @Inject(OpenAIService)
    private readonly openAIService: OpenAIService,
  ) {}

  @Post('/')
  @RespInterceptor
  async getFreeMessage(
    @Body() body: { message: Array<ChatCompletionMessageParam> },
  ) {
    const { message } = body;
    return await this.openAIService.getOpenAI(message);
  }
}
