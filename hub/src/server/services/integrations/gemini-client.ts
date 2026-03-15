import { GoogleGenerativeAI } from '@google/generative-ai';

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
 * Send a text prompt to Gemini and get a text response.
 */
async function askGemini(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 1000,
    },
  });
  return result.response.text();
}

/**
 * Generate an image using Google Gemini's image generation capabilities.
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

  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });
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
 * Generate a music cover image using Gemini for both the prompt and the image.
 * No Anthropic dependency.
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
  let imagePrompt = options.imagePrompt;

  if (!imagePrompt) {
    // Use Gemini to create an optimized image generation prompt
    const analysisPrompt = `You are a creative art director for music visuals.

Create a visually striking image description for a music video cover/thumbnail:

Title: "${options.title}"
${options.genre ? `Genre: ${options.genre}` : ''}
${options.mood ? `Mood: ${options.mood}` : ''}
${options.style ? `Style: ${options.style}` : ''}
${options.bpm ? `BPM: ${options.bpm}` : ''}
${options.artist ? `Artist: ${options.artist}` : ''}

Create a detailed image prompt (in English) that:
1. Matches the music's energy and mood
2. Is visually dramatic and eye-catching for YouTube
3. Uses neon colors, abstract shapes, or futuristic elements for EDM
4. Does NOT contain text, logos, or faces
5. Is optimized for 16:9 YouTube thumbnail

Reply ONLY with the image prompt text, no explanation.`;

    imagePrompt = await askGemini(analysisPrompt, { temperature: 0.8, maxTokens: 500 });
  }

  // Generate the image with Gemini
  const image = await generateImage(imagePrompt.trim(), {
    style: 'cinematic digital art, vibrant neon colors, high contrast',
    aspectRatio: '16:9',
  });

  const imageUrl = `data:${image.mimeType};base64,${image.base64}`;
  return { ...image, prompt: imagePrompt.trim(), imageUrl };
}

/**
 * Analyze a song's characteristics using Gemini AI.
 * No Anthropic dependency.
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
  const prompt = `You are a music analyst specialized in EDM and electronic music.
Analyze this song based on the available information and respond in valid JSON only.

Title: "${options.title}"
${options.artist ? `Artist: ${options.artist}` : ''}
${metadata?.genre ? `Assumed genre: ${metadata.genre}` : ''}
${metadata?.mood ? `Assumed mood: ${metadata.mood}` : ''}
${metadata?.bpm ? `BPM: ${metadata.bpm}` : ''}

Respond with ONLY this JSON structure, no markdown:
{
  "genre": "main genre",
  "subGenre": "sub genre",
  "style": "music style (e.g., progressive, minimal, melodic)",
  "mood": "mood (e.g., euphoric, dark, chill, energetic)",
  "energy": "low|medium|high",
  "visualStyle": "description of visual style that fits the music",
  "targetAudience": "target audience for this type of music"
}`;

  const result = await askGemini(prompt, { temperature: 0.3, maxTokens: 500 });

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

/**
 * Generate YouTube SEO metadata using Gemini.
 * Replaces the YouTubeAgent (which required Anthropic).
 */
export async function generateYouTubeSEO(
  options: {
    title: string;
    artist?: string;
    genre: string;
    style: string;
    mood: string;
  }
): Promise<{
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: string;
  imagePrompt: string;
}> {
  const prompt = `You are a YouTube SEO expert for music channels.
Generate optimized YouTube metadata for this EDM/electronic track.

Track: "${options.title}"
Artist: ${options.artist || 'Neural Beat'}
Genre: ${options.genre}
Style: ${options.style}
Mood: ${options.mood}

Respond with ONLY this JSON, no markdown:
{
  "title": "YouTube video title (catchy, includes artist name, max 60 chars)",
  "description": "YouTube description (500-800 chars, include genre tags, mood, artist info, relevant hashtags at the end)",
  "tags": ["tag1", "tag2", "tag3", "...up to 15 relevant tags for YouTube SEO"],
  "categoryId": "10",
  "privacyStatus": "public",
  "imagePrompt": "A vivid image prompt for the video thumbnail (abstract, neon, no text/faces)"
}`;

  const result = await askGemini(prompt, { temperature: 0.7, maxTokens: 800 });

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // fallback
  }

  return {
    title: `${options.artist || 'Neural Beat'} - ${options.title} [${options.genre}]`,
    description: `${options.title} by ${options.artist || 'Neural Beat'}. Genre: ${options.genre}. Mood: ${options.mood}.\n\n#EDM #${options.genre.replace(/\s/g, '')} #ElectronicMusic #NeuralBeat`,
    tags: [options.genre, options.mood, options.style, 'EDM', 'Electronic Music', 'Neural Beat', options.title],
    categoryId: '10',
    privacyStatus: 'public',
    imagePrompt: `Abstract neon visualization for ${options.genre} music, ${options.mood} mood, vibrant colors, no text`,
  };
}

export function isConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
