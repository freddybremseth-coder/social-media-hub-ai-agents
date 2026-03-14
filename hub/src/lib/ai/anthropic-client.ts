import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function createMessage(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const message = await anthropic.messages.create({
    model: options?.model || 'claude-sonnet-4-20250514',
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature || 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function createStructuredMessage<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
  }
): Promise<T | null> {
  const response = await createMessage(
    systemPrompt + '\n\nAlways respond with valid JSON only. No markdown, no explanation.',
    userPrompt,
    { ...options, temperature: 0.3 }
  );

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T;

    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]) as T;

    return null;
  } catch {
    return null;
  }
}

export { anthropic };
