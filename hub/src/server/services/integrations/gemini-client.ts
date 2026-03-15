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

  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
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

// ─── Mood-based visual theme mapping for multi-image generation ────────
const MOOD_VISUAL_THEMES: Record<string, string[]> = {
  romantic: [
    'golden sunset over calm ocean with silhouetted couple on beach',
    'candlelit room with soft bokeh lights and rose petals',
    'starry night sky reflected in a still mountain lake',
    'cherry blossom trees along a serene garden path',
    'warm sunrise through sheer curtains in a modern apartment',
    'vintage car driving along coastal highway at dusk',
    'soft rain on city windows with warm interior lights',
    'tropical island beach with crystal clear turquoise water',
    'hot air balloons over lavender fields at golden hour',
    'moonlit rooftop terrace overlooking a sparkling city',
  ],
  chill: [
    'misty forest with soft morning light filtering through trees',
    'minimalist zen garden with raked sand patterns',
    'calm lake at dawn with mountains reflected in water',
    'cozy reading nook with warm ambient lighting',
    'slow-motion waves breaking on an empty sandy beach',
    'japanese tea ceremony room with bamboo and natural light',
    'aerial view of winding river through autumn forest',
    'soft clouds drifting over snow-capped mountain peaks',
    'underwater view of coral reef with gentle fish movements',
    'hammock between palm trees overlooking turquoise lagoon',
  ],
  energetic: [
    'neon-lit cyberpunk city skyline at night with rain',
    'electric laser light show in a massive concert venue',
    'speed blur of sports car driving through neon tunnel',
    'dynamic aerial view of a pulsing EDM festival crowd',
    'abstract neon circuit board with glowing data streams',
    'futuristic dance floor with holographic projections',
    'lightning storm over a modern glass skyscraper city',
    'extreme close-up of turntable with neon reflections',
    'high-speed motion blur of motorcycle through tokyo streets',
    'explosive burst of colorful powder and neon particles',
  ],
  dark: [
    'dramatic thunderstorm with purple lightning over ocean',
    'abandoned industrial warehouse with moody atmospheric fog',
    'dark forest path illuminated by a single beam of moonlight',
    'abstract dark art with deep red and black smoke swirls',
    'dystopian cityscape with towering dark buildings and neon accents',
    'underwater deep sea scene with bioluminescent creatures',
    'smoky underground club with minimal red laser lighting',
    'volcanic landscape with flowing lava and dark sky',
    'gothic cathedral interior with dramatic stained glass light',
    'dark nebula in space with stars and cosmic dust',
  ],
  happy: [
    'vibrant tropical sunset with colorful sky and palm trees',
    'festival crowd with confetti and colorful stage lights',
    'bright flower field with butterflies and blue sky',
    'colorful hot air balloons floating over rolling green hills',
    'beach party scene with tiki torches and string lights',
    'aerial view of colorful coral reef in crystal water',
    'vibrant street market with colorful lanterns and decorations',
    'rainbow over a waterfall in lush tropical jungle',
    'golden hour skateboard park with warm cinematic light',
    'fireworks display over city waterfront at night',
  ],
  euphoric: [
    'massive EDM festival stage with pyrotechnics and lasers',
    'aurora borealis dancing over snow-covered mountains',
    'golden sunrise breaking through dramatic cloud formations',
    'aerial view of endless desert sand dunes at golden hour',
    'cosmic nebula explosion with vibrant pink and blue colors',
    'mountain peak above the clouds at sunrise',
    'speed blur through a tunnel of colorful neon lights',
    'crystal cave with rainbow light refractions',
    'panoramic view from space station of earth and stars',
    'massive ocean wave frozen in time with golden light',
  ],
};

/**
 * Get the mood category for visual theme selection.
 */
function getMoodCategory(mood: string, energy: string): string {
  const moodLower = mood.toLowerCase();
  if (moodLower.includes('romantic') || moodLower.includes('love') || moodLower.includes('sensual')) return 'romantic';
  if (moodLower.includes('chill') || moodLower.includes('relax') || moodLower.includes('calm') || moodLower.includes('ambient')) return 'chill';
  if (moodLower.includes('dark') || moodLower.includes('intense') || moodLower.includes('aggressive') || moodLower.includes('heavy')) return 'dark';
  if (moodLower.includes('happy') || moodLower.includes('upbeat') || moodLower.includes('fun') || moodLower.includes('cheerful')) return 'happy';
  if (moodLower.includes('euphoric') || moodLower.includes('uplifting') || moodLower.includes('epic')) return 'euphoric';
  if (energy === 'high') return 'energetic';
  if (energy === 'low') return 'chill';
  return 'energetic'; // default for EDM
}

/**
 * Generate a set of cover images for a music video slideshow.
 * Creates 10 unique images based on the song's mood and energy.
 * Images are generated in batches of 3 to avoid rate limits.
 */
export async function generateMusicImageSet(
  options: {
    title: string;
    artist?: string;
    genre?: string;
    style?: string;
    mood?: string;
    energy?: string;
    visualStyle?: string;
    count?: number;
  }
): Promise<{ images: Array<{ base64: string; mimeType: string; prompt: string }> }> {
  const count = options.count || 10;
  const moodCategory = getMoodCategory(options.mood || 'energetic', options.energy || 'high');
  const themes = MOOD_VISUAL_THEMES[moodCategory] || MOOD_VISUAL_THEMES.energetic;

  // Select themes (pick as many as needed, cycling if necessary)
  const selectedThemes = Array.from({ length: count }, (_, i) => themes[i % themes.length]);

  // Add genre/style enhancement to each prompt
  const enhancedPrompts = selectedThemes.map((theme) =>
    `${theme}. ${options.genre ? `Feeling of ${options.genre} music.` : ''} ${options.visualStyle ? `Visual style: ${options.visualStyle}.` : ''} Cinematic, atmospheric, no text or faces, 16:9 aspect ratio.`
  );

  console.log(`[Gemini] Generating ${count} images for mood: ${moodCategory}`);

  // Generate images in batches of 3 to avoid rate limits
  const batchSize = 3;
  const results: Array<{ base64: string; mimeType: string; prompt: string }> = [];

  for (let i = 0; i < enhancedPrompts.length; i += batchSize) {
    const batch = enhancedPrompts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (prompt, batchIndex) => {
        try {
          const image = await generateImage(prompt, {
            style: 'cinematic photography, high contrast, dramatic lighting',
            aspectRatio: '16:9',
          });
          console.log(`[Gemini] Image ${i + batchIndex + 1}/${count} generated`);
          return { ...image, prompt };
        } catch (err) {
          console.warn(`[Gemini] Image ${i + batchIndex + 1} failed, retrying...`, err);
          // Retry once
          try {
            const image = await generateImage(prompt, {
              style: 'cinematic digital art, vibrant colors',
              aspectRatio: '16:9',
            });
            return { ...image, prompt };
          } catch {
            console.error(`[Gemini] Image ${i + batchIndex + 1} failed permanently`);
            return null;
          }
        }
      })
    );
    results.push(...batchResults.filter((r): r is NonNullable<typeof r> => r !== null));

    // Small delay between batches to avoid rate limits
    if (i + batchSize < enhancedPrompts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (results.length === 0) {
    throw new Error('Failed to generate any images for the music video');
  }

  console.log(`[Gemini] Successfully generated ${results.length}/${count} images`);
  return { images: results };
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
