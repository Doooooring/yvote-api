import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class OpenAIService {
  openaiClient: OpenAI;

  constructor(private configService: ConfigService) {
    this.openaiClient = new OpenAI({
      apiKey: this.configService.get('OPENAI_KEY'),
      baseURL: 'https://api.x.ai/v1',
    });
  }

  async getOpenAI(messages: Array<ChatCompletionMessageParam>) {
    const completion = await this.openaiClient.chat.completions.create({
      model: 'grok-2',
      messages: messages,
    });
    return completion.choices?.[0]?.message?.content;
  }
}
