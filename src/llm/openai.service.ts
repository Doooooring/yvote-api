import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class OpenAIService {
  private xaiClient: OpenAI;
  private openaiClient: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    this.xaiClient = new OpenAI({
      apiKey: this.configService.get('XAI_KEY'),
      baseURL: 'https://api.x.ai/v1',
    });
    const openaiKey = this.configService.get('OPENAI_KEY');
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
  }

  async getOpenAI(messages: Array<ChatCompletionMessageParam>, model: string) {
    const client = model.startsWith('gpt') && this.openaiClient
      ? this.openaiClient
      : this.xaiClient;
    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
    });
    return completion.choices?.[0]?.message?.content;
  }
}
