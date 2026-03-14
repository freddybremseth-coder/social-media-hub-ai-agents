export interface AgentTask {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  parameters: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

export interface ContentStrategy {
  tone: 'professional' | 'casual' | 'viral' | 'educational' | 'entertaining';
  targetAudience: string;
  keyMessages: string[];
  callToAction?: string;
  hashtags: string[];
  estimatedReach?: number;
}

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

  protected async callAI(prompt: string, context?: any): Promise<string> {
    // This will be implemented with OpenAI or Claude
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  protected abstract getSystemPrompt(): string;

  protected parseJSON(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  }
}