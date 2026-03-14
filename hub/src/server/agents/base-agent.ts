import { createMessage } from '@/lib/ai/anthropic-client';
import type { AgentTask, ContentStrategy } from '@/lib/types';

export type { AgentTask, ContentStrategy };

export abstract class BaseAgent {
  protected name: string;
  protected role: string;
  protected expertise: string[];

  constructor(name: string, role: string, expertise: string[]) {
    this.name = name;
    this.role = role;
    this.expertise = expertise;
  }

  abstract executeTasks(tasks: AgentTask[]): Promise<AgentTask[]>;
  abstract analyzeData(data: any): Promise<any>;
  abstract generateRecommendations(context: any): Promise<string[]>;

  public async callAI(prompt: string, _context?: unknown): Promise<string> {
    return createMessage(this.getSystemPrompt(), prompt, {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 2000,
      temperature: 0.7,
    });
  }

  protected abstract getSystemPrompt(): string;

  protected parseJSON(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) return JSON.parse(arrayMatch[0]);

      return null;
    } catch {
      return null;
    }
  }

  public getName(): string {
    return this.name;
  }

  public getRole(): string {
    return this.role;
  }

  public getExpertise(): string[] {
    return this.expertise;
  }
}
