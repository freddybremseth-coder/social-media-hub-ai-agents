import { BaseAgent } from './base-agent';
import { NORWEGIAN_CONTENT_RULES, CLEAN_OUTPUT_RULES } from '@/lib/text-utils';
import type { AgentTask } from '@/lib/types';

export class YouTubeAgent extends BaseAgent {
  constructor() {
    super(
      'Nova YouTube Creator',
      'YouTube Content & Growth Specialist',
      ['youtube-seo', 'script-writing', 'thumbnail-strategy', 'audience-retention', 'shorts-optimization', 'channel-growth']
    );
  }

  /**
   * Convenience method for pipeline use.
   * Wraps executeTasks() in a simple { task, input } → { metadata } interface.
   */
  async run(options: { task: string; input: Record<string, any> }): Promise<{ metadata: any }> {
    const agentTask: AgentTask = {
      id: `yt_${Date.now()}`,
      name: options.task,
      description: `YouTube agent task: ${options.task}`,
      priority: 'high',
      parameters: options.input,
      status: 'pending',
    };
    const results = await this.executeTasks([agentTask]);
    const result = results[0];
    const parsed = typeof result.result === 'string' ? this.parseJSON(result.result) : result.result;
    return { metadata: parsed || result.result };
  }

  async executeTasks(tasks: AgentTask[]): Promise<AgentTask[]> {
    const results: AgentTask[] = [];

    for (const task of tasks) {
      try {
        task.status = 'in_progress';

        switch (task.name) {
          case 'create_script':
            task.result = await this.createVideoScript(task.parameters);
            break;
          case 'optimize_title':
            task.result = await this.optimizeTitle(task.parameters);
            break;
          case 'generate_description':
            task.result = await this.generateDescription(task.parameters);
            break;
          case 'suggest_tags':
            task.result = await this.suggestTags(task.parameters);
            break;
          case 'thumbnail_concept':
            task.result = await this.createThumbnailConcept(task.parameters);
            break;
          case 'retention_hooks':
            task.result = await this.createRetentionHooks(task.parameters);
            break;
          case 'shorts_strategy':
            task.result = await this.planShortsStrategy(task.parameters);
            break;
          case 'channel_strategy':
            task.result = await this.developChannelStrategy(task.parameters);
            break;
          case 'generate_youtube_seo':
            task.result = await this.generateYouTubeSEO(task.parameters);
            break;
          default:
            task.result = await this.callAI(`YouTube-oppgave: ${task.name}\n\nParametere: ${JSON.stringify(task.parameters)}`);
        }

        task.status = 'completed';
      } catch (error) {
        task.status = 'failed';
        task.result = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push(task);
    }

    return results;
  }

  private async createVideoScript(params: any): Promise<string> {
    const prompt = `Lag et YouTube-videomanus for:

Emne: ${params.topic || params.task}
Brand: ${params.brand || 'Generelt'}
Maalgruppe: ${params.audience || 'YouTube-seere'}
Videolengde: ${params.duration || '8-12 minutter'}
Tone: ${params.tone || 'engasjerende og informativ'}

Strukturer manuset slik:
1. HOOK (foerste 30 sekunder) - Start med et smell, ALDRI "Hei, jeg heter..."
2. INTRO (30-60 sek) - Kort oversikt over hva seeren vil laere
3. HOVEDDEL (4-8 min) - Hovedinnhold med klare seksjoner
4. CALL TO ACTION (30 sek) - Abonner, kommenter, besøk nettside
5. OUTRO (15 sek) - Kort avslutning

Inkluder:
- Timestampforslag for beskrivelsen
- Forslag til B-roll og visuelt innhold
- Engagement-hooks gjennom videoen (spørsmaal, paastander)
- Pattern interrupts for aa holde oppmerksomheten`;

    return this.callAI(prompt);
  }

  private async optimizeTitle(params: any): Promise<string> {
    const prompt = `Lag 5 klikk-verdige, SEO-optimaliserte YouTube-titler for:

Emne: ${params.topic || params.task}
Brand: ${params.brand || 'Generelt'}
Noekkelfrase: ${params.keyword || 'ingen spesifikk'}

Regler for gode YouTube-titler:
- Under 60 tegn (vises helt i soek)
- Bruk tall og aar (f.eks. "i 2026")
- Skape nysgjerrighet uten clickbait
- Inkluder hovedsoekordet
- Emosjonell trigger (f.eks. "sannheten om", "det ingen forteller deg")

DAARLIG: "Visning av villa i Biar"
BRA: "Slik kjoeper du bolig i Spania i 2026 (Komplett guide)"

For hvert titelforslag, estimer:
- CTR-potensial (lav/medium/hoey)
- Soekevolum-indikasjon
- Hvorfor den fungerer`;

    return this.callAI(prompt);
  }

  private async generateDescription(params: any): Promise<string> {
    const prompt = `Lag en SEO-optimalisert YouTube-beskrivelse for:

Tittel: ${params.title || params.topic}
Brand: ${params.brand || 'Generelt'}
Nettside: ${params.website || ''}
Noekkelfrase: ${params.keyword || ''}

Strukturer beskrivelsen:
1. Foerste 2 linjer (vises i foerhandsvisning - maa vaere catchy!)
2. Hovedbeskrivelse med nøkkelord (150-300 ord)
3. Timestamps (00:00 format)
4. Ressurser og lenker
5. Hashtags (3-5 relevante)
6. About/Kontakt-seksjon

SEO-tips aa foelge:
- Noekkelfrase i foerste setning
- Naturlig keywordbruk (2-3% density)
- Include CTA (Last ned guide, besøk nettside)
- Bruk relevante hashtags`;

    return this.callAI(prompt);
  }

  private async suggestTags(params: any): Promise<string> {
    const prompt = `Foreslaa 20-30 YouTube-tags for en video om:

Emne: ${params.topic || params.task}
Brand: ${params.brand || 'Generelt'}
Sjanger/Kategori: ${params.category || 'Generelt'}

Regler:
- Mix av brede og spesifikke tags
- Inkluder long-tail keywords
- Bruk konkurrent-tags (ikke merkenavn)
- Inkluder trending topics
- Maks 500 tegn totalt

Returner som JSON-array: ["tag1", "tag2", ...]`;

    return this.callAI(prompt);
  }

  private async createThumbnailConcept(params: any): Promise<string> {
    const prompt = `Beskriv et eye-catching YouTube-thumbnail for:

Tittel: ${params.title || params.topic}
Brand: ${params.brand || 'Generelt'}

Thumbnail-regler for høy CTR:
- 90% av suksessen er thumbnailet
- ALLTID ansikt med tydelig uttrykk
- Stor, lettlest tekst (3-5 ord)
- Lyse, kontrastrike farger
- Hook/teaser (f.eks. "Billigere enn du tror?")
- Unngaa rot - hold det enkelt

Beskriv:
1. Bakgrunn (farger, setting)
2. Hovedelement (person, objekt)
3. Tekst-overlay (ord, font-stil, farge)
4. Emosjon/ansiktsuttrykk
5. Bildeprompt for AI-generering`;

    return this.callAI(prompt);
  }

  private async createRetentionHooks(params: any): Promise<string> {
    const prompt = `Lag retention hooks for de foerste 30 sekundene av en YouTube-video:

Emne: ${params.topic || params.task}
Brand: ${params.brand || 'Generelt'}
Maalgruppe: ${params.audience || 'YouTube-seere'}

Algorithmen maaler retention. ALDRI start med "Hei, jeg heter Freddy".

Lag 5 alternative hooks:
1. SHOCK HOOK: Start med overraskende faktum/pastand
2. DREAM HOOK: "Se for deg aa vaakne til denne utsikten hver dag..."
3. QUESTION HOOK: "Visste du at 90% av boligkjoepere i Spania..."
4. STORY HOOK: "Forrige uke fikk jeg en telefon som endret alt..."
5. VISUAL HOOK: "SE PÅ DETTE!" (dramatisk B-roll)

For hver hook:
- Manustekst (ordrett)
- Visuell beskrivelse (hva sees paa skjermen)
- Estimert retention-effekt`;

    return this.callAI(prompt);
  }

  private async planShortsStrategy(params: any): Promise<string> {
    const prompt = `Lag en YouTube Shorts strategi for:

Brand: ${params.brand || 'Generelt'}
Maalgruppe: ${params.audience || 'YouTube-seere'}
Hovedtema: ${params.topic || 'Brand growth'}

YouTube Shorts er motoren for kanalvekst i 2026.

Lag plan med:
1. 10 Shorts-ideer med titler (15-60 sekunder)
2. Innholdstyper:
   - Quick tips / fakta
   - Behind the scenes
   - Before/after transformasjoner
   - Trending lyder/formater
   - Utdrag fra lange videoer
3. Publiseringsfrekvens (anbefaling)
4. Hook-strategi for Shorts
5. Hashtag-strategi
6. Cross-promotion med lange videoer`;

    return this.callAI(prompt);
  }

  private async developChannelStrategy(params: any): Promise<string> {
    const prompt = `Utvikle en komplett YouTube-kanalstrategi for:

Brand: ${params.brand || 'Freddy Bremseth'}
Industri: ${params.industry || 'Multi-business'}
Maalgruppe: ${params.audience || 'Norske investorer, entrepreneurs'}
Maal: ${params.goals || 'Kundemagnet og autoritet'}

Inkluder:
1. KANALNAVN OG BRANDING
   - Navneforslag (soekbart!)
   - Banner-design konsept
   - Kanal-beskrivelse

2. INNHOLDSPLAN (10 foerste videoer)
   - Mix av "Slik gjor du det" (Evergreen) + spektakulaere visninger
   - Titler, estimert varighet, kategori

3. VEKSTSTRATEGI
   - Shorts som motor
   - SEO-optimalisering
   - Kommentar-engasjement (foerste 24 timer!)
   - Cross-platform promotion

4. KONVERTERINGSPLAN
   - CTA i hver video
   - Gratis ressurs/lead magnet
   - Fra seer til kunde

5. TEKNISKE TIPS
   - Lydkvalitet (traadloes mikrofon!)
   - Thumbnail-beste praksis
   - Upload-tidspunkt`;

    return this.callAI(prompt);
  }

  /**
   * Generate complete YouTube SEO metadata for a video (used by Neural Beat pipeline).
   * Returns JSON with title, description, tags.
   */
  private async generateYouTubeSEO(params: any): Promise<string> {
    const prompt = `Lag komplett YouTube SEO-metadata for denne videoen:

Tittel/Sang: ${params.title}
Sjanger: ${params.genre || 'EDM'}
Stemning: ${params.mood || 'energetic'}
Artist: ${params.artist || 'Neural Beat'}
Brand: ${params.brand || 'Neural Beat'}

Returner KUN gyldig JSON:
{
  "title": "SEO-optimalisert YouTube-tittel (under 60 tegn)",
  "description": "Full YouTube-beskrivelse med keywords, timestamps placeholder, og CTA",
  "tags": ["tag1", "tag2", "..."],
  "categoryId": "10",
  "shortTitle": "Kort tittel for Shorts"
}`;

    return this.callAI(prompt);
  }

  async analyzeData(data: any): Promise<any> {
    const prompt = `Som YouTube-ekspert, analyser denne kanaldata:
${JSON.stringify(data, null, 2)}

Gi:
- Viktigste innsikter
- Retention-analyse
- Soekeord-muligheter
- Forbedringer for CTR`;

    const response = await this.callAI(prompt);
    return this.parseJSON(response);
  }

  async generateRecommendations(context: any): Promise<string[]> {
    const prompt = `Som YouTube Growth Specialist, gi 5 konkrete anbefalinger for:
${JSON.stringify(context, null, 2)}

Fokus paa:
- Soekemotoroptimalisering for YouTube
- Thumbnail og CTR
- Audience retention
- Subscriber growth
- Monetisering`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSON(response);
    return Array.isArray(parsed) ? parsed : [response];
  }

  protected getSystemPrompt(): string {
    return `Du er ${this.name}, en ${this.role}.

EKSPERTISE:
- YouTube SEO og soekemotoroptimalisering
- Videomanus og storytelling
- Thumbnail-design og CTR-optimalisering
- Audience retention og engagement
- YouTube Shorts strategi
- Kanalvekst og community building
- YouTube Analytics og data-drevet optimalisering

KUNNSKAP:
- YouTube-algoritmens prioriteringer i 2026
- Foerste 30 sekunders retention er kritisk
- Shorts er motoren for kanalvekst
- Thumbnail + tittel = 90% av klikkraten
- Kommentarengasjement de foerste 24 timene

REGLER:
- ALDRI start videoer med "Hei, jeg heter..."
- Alltid start med et smell (hook)
- Titler under 60 tegn
- Soekbare, ikke clickbait
- CTA i HVER video

TONE: Energisk, informativ, inspirerende. Snak direkte til seeren.

${NORWEGIAN_CONTENT_RULES}

${CLEAN_OUTPUT_RULES}`;
  }
}
