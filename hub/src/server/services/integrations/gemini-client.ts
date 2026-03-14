import { GoogleGenerativeAI } from '@google/generative-ai';
import { createMessage } from '@/lib/ai/anthropic-client';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generate an image using Google Gemini's image generation capabilities.
 * Returns the generated image as base64 data.
 */
export async function generateImage(
  prompt: string,
  options?: {
    style?: string;
    aspectRatio?: '1:1' | '16:9' | '9:16';
  }
): Promise<{ base64: string; mimeType: string }> {
  const client = getClient();

  const enhancedPrompt = options?.style
    ? `${prompt}. Style: ${options.style}. Aspect ratio: ${options.aspectRatio || '16:9'}`
    : `${prompt}. Aspect ratio: ${options?.aspectRatio || '16:9'}`;

  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Generate an image: ${enhancedPrompt}` }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'] as any,
    } as any,
  });

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if ((part as any).inlineData) {
      return {
        base64: (part as any).inlineData.data,
        mimeType: (part as any).inlineData.mimeType || 'image/png',
      };
    }
  }

  throw new Error('Gemini did not return an image in the response');
}

/**
 * Use Claude to analyze a song title/metadata and generate an optimized image prompt.
 * Then use Gemini to generate the actual image.
 */
export async function generateMusicCoverImage(
  options: {
    title: string;
    artist?: string;
    genre?: string;
    style?: string;
    mood?: string;
    imagePrompt?: string;
    bpm?: number;
  }
): Promise<{ imageUrl: string; base64: string; mimeType: string; prompt: string }> {
  // If an image prompt is already provided, use it directly
  if (options.imagePrompt) {
    const image = await generateImage(options.imagePrompt, {
      style: 'cinematic digital art, vibrant neon colors, high contrast',
      aspectRatio: '16:9',
    });
    const imageUrl = `data:${image.mimeType};base64,${image.base64}`;
    return { ...image, prompt: options.imagePrompt, imageUrl };
  }

  // Step 1: Use Claude to create an optimized image generation prompt
  const analysisPrompt = `Du er en kreativ art director for musikkvisualer.

Analyser denne sangen og lag en visuelt slående bildebeskrivelse for musikkvideoens cover/thumbnail:

Tittel: "${options.title}"
${options.genre ? `Sjanger: ${options.genre}` : ''}
${options.mood ? `Stemning: ${options.mood}` : ''}
${options.style ? `Stil: ${options.style}` : ''}
${options.bpm ? `BPM: ${options.bpm}` : ''}
${options.artist ? `Artist: ${options.artist}` : ''}

Lag en detaljert bildeprompt (på engelsk) som:
1. Matcher musikkens energi og stemning
2. Er visuelt dramatisk og eye-catching for YouTube
3. Bruker neon-farger, abstrakte former, eller futuristiske elementer for EDM
4. IKKE inneholder tekst, logoer eller ansikter
5. Er optimalisert for 16:9 YouTube thumbnail

Svar KUN med bildeprompt-teksten, ingen forklaring.`;

  const imagePrompt = await createMessage(
    'Du er en ekspert på visuell kunst og musikkvisualer.',
    analysisPrompt,
    { temperature: 0.8, maxTokens: 500 }
  );

  // Step 2: Generate the image with Gemini
  const image = await generateImage(imagePrompt.trim(), {
    style: 'cinematic digital art, vibrant neon colors, high contrast',
    aspectRatio: '16:9',
  });

  const imageUrl = `data:${image.mimeType};base64,${image.base64}`;
  return { ...image, prompt: imagePrompt.trim(), imageUrl };
}

/**
 * Analyze a song's characteristics using Claude AI.
 */
export async function analyzeSong(
  options: {
    title: string;
    artist?: string;
    audioUrl?: string;
    metadata?: Record<string, any>;
  }
): Promise<{
  genre: string;
  subGenre: string;
  style: string;
  mood: string;
  energy: 'low' | 'medium' | 'high';
  visualStyle: string;
  targetAudience: string;
}> {
  const metadata = options.metadata;
  const prompt = `Analyser denne EDM/elektroniske sangen basert på tilgjengelig informasjon:

Tittel: "${options.title}"
${options.artist ? `Artist: ${options.artist}` : ''}
${metadata?.genre ? `Antatt sjanger: ${metadata.genre}` : ''}
${metadata?.mood ? `Antatt stemning: ${metadata.mood}` : ''}
${metadata?.bpm ? `BPM: ${metadata.bpm}` : ''}

Svar i JSON-format:
{
  "genre": "hovedsjanger",
  "subGenre": "undersjanger",
  "style": "musikkstil (f.eks. progressive, minimal, melodic)",
  "mood": "stemning (f.eks. euphoric, dark, chill, energetic)",
  "energy": "low|medium|high",
  "visualStyle": "beskrivelse av visuell stil som passer musikken",
  "targetAudience": "målgruppe for denne typen musikk"
}`;

  const result = await createMessage(
    'Du er en musikkanalytiker spesialisert på EDM og elektronisk musikk. Svar alltid i gyldig JSON.',
    prompt,
    { temperature: 0.3, maxTokens: 500 }
  );

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // fallback
  }

  return {
    genre: metadata?.genre || 'EDM',
    subGenre: 'Electronic',
    style: 'progressive',
    mood: metadata?.mood || 'energetic',
    energy: 'high',
    visualStyle: 'Neon cyberpunk with abstract geometric shapes',
    targetAudience: 'EDM fans and electronic music lovers',
  };
}

export function isConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
