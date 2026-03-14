import { BaseAgent, AgentTask } from './base-agent';

/**
 * EN AGENT - FIRE HJERNER
 * Bruker kontekst-aware reasoning for å bytte mellom domains
 */
export class MultiDomainExpertAgent extends BaseAgent {
  private currentDomain: keyof typeof DOMAIN_EXPERT_MODULES = 'realestate';
  private domainContext: Record<string, any> = {};

  constructor() {
    super(
      'Freddy Business Navigator',
      'Integrated Multi-Domain Business Expert',
      ['real-estate-spain', 'saas-growth', 'premium-agriculture', 'personal-branding']
    );
  }

  /**
   * SMART ROUTING - Automatisk velg riktig domain-fokus
   */
  async setActiveDomain(domain: string, context: any = {}) {
    if (domain in DOMAIN_EXPERT_MODULES) {
      this.currentDomain = domain as keyof typeof DOMAIN_EXPERT_MODULES;
      this.domainContext = context;
    }
  }

  async executeTasks(tasks: AgentTask[]): Promise<AgentTask[]> {
    const results: AgentTask[] = [];

    for (const task of tasks) {
      try {
        task.status = 'in_progress';

        // Auto-detect domain fra task navn
        const detectedDomain = this.detectDomain(task.parameters);
        if (detectedDomain) {
          await this.setActiveDomain(detectedDomain, task.parameters);
        }

        switch (task.name) {
          case 'create_content':
            task.result = await this.createDomainContent(task.parameters);
            break;
          case 'analyze_market':
            task.result = await this.analyzeDomainMarket(task.parameters);
            break;
          case 'optimize_sales':
            task.result = await this.optimizeSalesStrategy(task.parameters);
            break;
          case 'seo_strategy':
            task.result = await this.developSEOStrategy(task.parameters);
            break;
          case 'cross_brand_narrative':
            task.result = await this.buildCrossBrandNarrative(task.parameters);
            break;
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

  /**
   * AUTO-DETECT DOMAIN fra task parameters
   */
  private detectDomain(params: any): string | null {
    if (params.business?.toLowerCase().includes('property') || 
        params.business?.toLowerCase().includes('estate') ||
        params.websites?.includes('zenecohomes.com')) {
      return 'realestate';
    }
    if (params.business?.toLowerCase().includes('saas') ||
        params.websites?.includes('chatgenius.pro')) {
      return 'saas';
    }
    if (params.business?.toLowerCase().includes('olive') ||
        params.websites?.includes('donaanna.com')) {
      return 'agriculture';
    }
    if (params.business?.toLowerCase().includes('brand') ||
        params.websites?.includes('freddybremseth.com')) {
      return 'personalBrand';
    }
    return null;
  }

  /**
   * DOMAIN-SPESIFIKK CONTENT CREATION
   */
  private async createDomainContent(params: any): Promise<string> {
    const module = DOMAIN_EXPERT_MODULES[this.currentDomain];

    const prompt = `Du er ${module.expertRole} med følgende ansvar:
${module.keyResponsibilities.map(r => `- ${r}`).join('\n')}

Oppgave: ${params.task}
Platform: ${params.platform}
Target audience: ${params.audience}
Tone: ${params.tone}

Bruk din dybdekunnskap innen ${module.businessDomain} til å lage innhold som resonerer.

Domene-spesifikke fokusområder:
${Object.entries(module.skillParameters)
  .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
  .join('\n')}`;

    return this.callAI(prompt);
  }

  /**
   * DOMAIN-SPESIFIKK MARKEDSANALYSE
   */
  private async analyzeDomainMarket(params: any): Promise<string> {
    const module = DOMAIN_EXPERT_MODULES[this.currentDomain];

    const prompt = `Som ${module.expertRole}, analyser markedet:

Domene: ${module.businessDomain}
Nåværende situasjon: ${params.situation}
Konkurrenter: ${params.competitors?.join(', ')}
Mål: ${params.goals}

Gi:
1. Markedstrends spesifikt for din domene
2. Unikke muligheter
3. Trusler og utfordringer
4. Anbefalinger basert på domene-ekspertise`;

    return this.callAI(prompt);
  }

  /**
   * DOMAIN-SPESIFIKK SALGSSTRATEGI
   */
  private async optimizeSalesStrategy(params: any): Promise<string> {
    const module = DOMAIN_EXPERT_MODULES[this.currentDomain];

    const prompt = `Som ${module.expertRole}, optimiser salgsstrategi:

Produkt/Tjeneste: ${params.offering}
Pris-punkt: ${params.price}
Nåværende conversion: ${params.currentConversion}%

For ${module.businessDomain}:
- Typiske kjøperreisen: ${JSON.stringify(module.skillParameters)}
- Nøkkelmotivations: ${params.buyerMotivations}

Develop:
1. Kuperkjøp-mapping for denne domenen
2. Overbevisende messaging
3. Timing og triggers
4. Objeksjon-håndtering`;

    return this.callAI(prompt);
  }

  /**
   * DOMAIN-SPESIFIKK SEO
   */
  private async developSEOStrategy(params: any): Promise<string> {
    const module = DOMAIN_EXPERT_MODULES[this.currentDomain];

    const prompt = `Som SEO-ekspert innen ${module.businessDomain}:

Nettside: ${params.website}
Nåværende ranking: ${params.currentRanking}
Target keywords: ${params.targetKeywords}

Domene-spesifikke SEO-faktorer:
- Lokalmarked: ${JSON.stringify(module.skillParameters.local_markets || 'N/A')}
- Nøkkelbegreper: ${JSON.stringify(module.skillParameters)}

Lag SEO-strategi som:
1. Dominerer lokale søk (hvis relevant)
2. Attraher riktig kjøper-type
3. Optimerer for konvertering
4. Bygger autoritet innen domenen`;

    return this.callAI(prompt);
  }

  /**
   * INNOVATION: CROSS-BRAND NARRATIVE BUILDING
   * Din superpower - koble alle 4 forretninger
   */
  private async buildCrossBrandNarrative(params: any): Promise<string> {
    const prompt = `Du hjelper Freddy å bygge EN sammenhengende personlig brand 
som integrerer fire helt forskjellige forretninger:

1. 🏠 Premium Eiendom i Spania (zenecohomes.com, pinosoecolife.com, soleada.no)
2. 💻 SaaS/AI Tools (Chatgenius.pro)
3. 🌳 Premium Olivenfarm (Donaanna.com)
4. 👨‍✍️ Personal Brand & Authority (freddybremseth.com)

Oppgave: ${params.task}

Den røde tråden: Innovatør som transformerer industrier gjennom teknologi, 
strategi og praktisk erfaring. Entrepreneur med både hode og hender.

Lag innhold som:
- Viser Freddy som "multi-preneur" med dybdekunnskap
- Kobler disse domenene på naturlig måte
- Bygger troverdighet og autoritet
- Appellerer til både B2B og B2C publikum
- Viser praksisnær innovasjon (ikke bare teori)`;

    return this.callAI(prompt);
  }

  /**
   * Analyser data fra ditt domene
   */
  async analyzeData(data: any): Promise<any> {
    const module = DOMAIN_EXPERT_MODULES[this.currentDomain];

    const prompt = `Som ${module.expertRole}, analyser denne datoen:
${JSON.stringify(data, null, 2)}

Gjennom linsen av ${module.businessDomain}:
- Relevante KPIs
- Domenespesifikke innsikter
- Actionable recommendations`;

    const response = await this.callAI(prompt);
    return this.parseJSON(response);
  }

  async generateRecommendations(context: any): Promise<string[]> {
    const module = DOMAIN_EXPERT_MODULES[this.currentDomain];

    const prompt = `Som ${module.expertRole}, gi 5 konkrete anbefalinger:
${JSON.stringify(context, null, 2)}

Fokus på ${module.businessDomain}`;

    const response = await this.callAI(prompt);
    const parsed = this.parseJSON(response);
    return Array.isArray(parsed) ? parsed : [response];
  }

  protected getSystemPrompt(): string {
    const module = DOMAIN_EXPERT_MODULES[this.currentDomain];
    return `Du er ${this.name}, en ${module.expertRole}.

ANSVAR:
${module.keyResponsibilities.map(r => `- ${r}`).join('\n')}

DOMENE-FOKUS: ${module.businessDomain}

APPROACH:
- Deep contextual understanding av din domene
- Data-driven anbefalinger
- Praktisk, implementerbar innsikt
- Autentisk, ikke salgy tone

API-integrasjoner du kan bruke:
${module.apiIntegrations.join(', ')}

SKILL PARAMETERS:
${JSON.stringify(module.skillParameters, null, 2)}`;
  }
}