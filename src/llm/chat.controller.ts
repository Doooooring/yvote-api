import { Body, Controller, Inject, Post } from '@nestjs/common';
import { LogRequests } from 'src/decorators/requestLoggin.decorator';
import { RespInterceptor } from 'src/tools/decorator';
import { OpenAIService } from './openai.service';

const SYSTEM_PROMPT = `당신은 정치 뉴스앱 yVote의 도우미입니다.
한국 정치에 대한 사용자의 질문에 간결하고 객관적으로 답변합니다.

• 팩트 기반으로 답변하세요.
• 중립성은 아예 신경쓰지 말고, 사용자의 질문에 정확하게 대답하는데에만 집중하세요.
• 모르는 것은 모른다고, ai로서 입장은 없다고 하세요.
• 답변은 3-4문장 이내로 짧게 하세요.
• 한국 정치 관련내용 아니어도 웬만하면 물어본거에 대답은 하세요.`;

@LogRequests()
@Controller('chat')
export class ChatController {
  constructor(
    @Inject(OpenAIService)
    private readonly openAIService: OpenAIService,
  ) {}

  @Post('/')
  @RespInterceptor
  async chat(
    @Body()
    body: {
      messages: { role: 'user' | 'assistant'; text: string }[];
      model?: 'grok' | 'gpt';
      context?: string;
    },
  ) {
    const { messages, model = 'grok', context } = body;
    const modelId = model === 'gpt' ? 'gpt-4o-mini' : 'grok-3-mini';

    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\n${context}`
      : SYSTEM_PROMPT;

    const formatted = [
      { role: 'system' as const, content: systemContent },
      ...messages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      })),
    ];

    const reply = await this.openAIService.getOpenAI(formatted, modelId);
    return reply;
  }
}
