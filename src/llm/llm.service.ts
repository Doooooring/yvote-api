import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class LlmService {
  private xaiClient: OpenAI;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  constructor(private configService: ConfigService) {
    this.xaiClient = new OpenAI({
      apiKey: this.configService.get('XAI_KEY'),
      baseURL: 'https://api.x.ai/v1',
    });
    const openaiKey = this.configService.get('OPENAI_KEY');
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
    const anthropicKey = this.configService.get('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
    }
  }

  private getClient(model: string): OpenAI {
    return model.startsWith('gpt') && this.openaiClient
      ? this.openaiClient
      : this.xaiClient;
  }

  isClaude(model: string): boolean {
    return model.startsWith('claude');
  }

  async getOpenAI(messages: Array<ChatCompletionMessageParam>, model: string) {
    if (this.isClaude(model)) {
      return this.claudeChat(messages, model);
    }
    const client = this.getClient(model);
    const completion = await client.chat.completions.create({
      model,
      messages,
    });
    return completion.choices?.[0]?.message?.content;
  }

  async chatWithTools(
    messages: Array<ChatCompletionMessageParam>,
    model: string,
    tools: ChatCompletionTool[],
  ) {
    if (this.isClaude(model)) {
      return this.claudeChatWithTools(messages, model, tools);
    }
    const client = this.getClient(model);
    return client.chat.completions.create({
      model,
      messages,
      tools,
    });
  }

  // Claude-specific methods
  private async claudeChat(messages: Array<ChatCompletionMessageParam>, model: string) {
    if (!this.anthropicClient) throw new Error('Anthropic client not configured');
    const { system, msgs } = this.convertToClaudeMessages(messages);
    const resp = await this.anthropicClient.messages.create({
      model,
      max_tokens: 1024,
      system: system || undefined,
      messages: msgs,
    });
    const textBlock = resp.content.find((b: any) => b.type === 'text');
    return (textBlock as any)?.text || '';
  }

  private async claudeChatWithTools(
    messages: Array<ChatCompletionMessageParam>,
    model: string,
    tools: ChatCompletionTool[],
  ) {
    if (!this.anthropicClient) throw new Error('Anthropic client not configured');
    const { system, msgs } = this.convertToClaudeMessages(messages);
    const claudeTools = tools.map(t => ({
      name: t.function.name,
      description: t.function.description || '',
      input_schema: t.function.parameters as any,
    }));

    const resp = await this.anthropicClient.messages.create({
      model,
      max_tokens: 1024,
      system: system || undefined,
      messages: msgs,
      tools: claudeTools,
    });

    // Convert Claude response to OpenAI format for compatibility
    const toolUseBlocks = resp.content.filter((b: any) => b.type === 'tool_use');
    const textBlocks = resp.content.filter((b: any) => b.type === 'text');

    const message: any = {
      role: 'assistant',
      content: textBlocks.map((b: any) => b.text).join('') || null,
      tool_calls: toolUseBlocks.length > 0 ? toolUseBlocks.map((b: any) => ({
        id: b.id,
        type: 'function',
        function: {
          name: b.name,
          arguments: JSON.stringify(b.input),
        },
      })) : null,
    };

    return { choices: [{ message }] };
  }

  private convertToClaudeMessages(messages: Array<ChatCompletionMessageParam>) {
    let system = '';
    const msgs: Array<{ role: 'user' | 'assistant'; content: any }> = [];

    for (const m of messages) {
      if (m.role === 'system') {
        system += (typeof m.content === 'string' ? m.content : '') + '\n';
      } else if (m.role === 'user') {
        msgs.push({ role: 'user', content: typeof m.content === 'string' ? m.content : '' });
      } else if (m.role === 'assistant') {
        if ((m as any).tool_calls) {
          // Convert OpenAI tool_calls to Claude format
          const content: any[] = [];
          if (m.content) content.push({ type: 'text', text: m.content });
          for (const tc of (m as any).tool_calls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments),
            });
          }
          msgs.push({ role: 'assistant', content });
        } else {
          msgs.push({ role: 'assistant', content: typeof m.content === 'string' ? m.content : '' });
        }
      } else if (m.role === 'tool') {
        // Claude expects tool results as user messages
        msgs.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: (m as any).tool_call_id,
            content: typeof m.content === 'string' ? m.content : '',
          }],
        });
      }
    }

    return { system: system.trim(), msgs };
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    const client = this.openaiClient || this.xaiClient;
    const resp = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return resp.data.map((d) => d.embedding);
  }
}
