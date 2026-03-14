/**
 * SPECIALIZED SKILLS - Last kun når du trenger dem
 * "Skill-on-demand" system
 */

export interface SpecializedSkill {
  skillName: string;
  domain: string;
  activate: boolean; // Slå av/på etter behov
  apiKeys: string[];
  models: string[];
}

export const OPTIONAL_SPECIALIZED_SKILLS: Record<string, SpecializedSkill> = {
  // SKILL 1: ARCHITECTURE & DESIGN (for eiendom)
  architectureDesign: {
    skillName: 'Architecture & Interior Design Consultant',
    domain: 'real-estate',
    activate: true, // Du bruker dette aktivt
    apiKeys: ['canva-api', 'pinterest-api', 'designtools-api'],
    models: ['gpt-4-vision', 'claude-vision'], // For å analysere eiendomsbilder
  },

  // SKILL 2: AGRICULTURAL SCIENCE (for olivenfarm)
  agricultureScience: {
    skillName: 'Agricultural & Sustainability Science',
    domain: 'agriculture',
    activate: true,
    apiKeys: ['sustainabilitydb', 'agronomyapi'],
    models: ['claude-opus'], // For kompleks agronomisk reasoning
  },

  // SKILL 3: SAAS ENGINEERING (for Chatgenius)
  saasEngineering: {
    skillName: 'SaaS Product Engineering Consultant',
    domain: 'saas',
    activate: true, // Viktig for Chatgenius
    apiKeys: ['github-api', 'claude-code', 'api-documentation-tool'],
    models: ['claude-3.5-sonnet', 'gpt-4-turbo'],
  },

  // SKILL 4: SPANISH REAL ESTATE LAW (for eiendom i Spania)
  spanishRealEstateLaw: {
    skillName: 'Spanish Real Estate Legal Expert',
    domain: 'real-estate',
    activate: true,
    apiKeys: ['legal-database-es', 'regulation-api'],
    models: ['claude-opus'],
  },
};

/**
 * SMART SKILL INJECTION
 * Legger til spesialisert kunnskap uten å opprette separate agenter
 */
export class SkillInjectionSystem {
  static async injectSkillIntoDomain(
    domain: string,
    skillName: keyof typeof OPTIONAL_SPECIALIZED_SKILLS
  ): Promise<string> {
    const skill = OPTIONAL_SPECIALIZED_SKILLS[skillName];

    if (!skill.activate) {
      console.warn(`Skill ${skillName} is not activated`);
      return '';
    }

    // Hent spesialisert system prompt basert på skill
    const skillContext = this.getSkillContext(skillName);

    return skillContext;
  }

  private static getSkillContext(skillName: string): string {
    const contexts: Record<string, string> = {
      architectureDesign: `Du er en ekspert arkitekt og interiørdesigner med 15+ års erfaring.
        Din rolle er å vurdere eiendomsfoto, gi designanbefalinger, og skrive 
        overbevisende property descriptions som fremhever arkitektoniske kvaliteter.
        
        TOOLS:
        - Visjon-analyse av property-bilder
        - Design trend-analyse
        - Spatial optimization recommendations
        
        Når du analyserer properties, fokuser på:
        - Arkitektonisk stil og periode
        - Flow og funksjonalitet
        - Potensial for oppgraderinger
        - Markedsverdi basert på design`,

      agricultureScience: `Du er en senioragronomer med spesialisering i olivedyrking og sustainable farming.
        Din rolle er å hjelpe med agronomisk innhold, sertifiseringsspørsmål, 
        og sustainability-storytelling.
        
        TOOLS:
        - Soil analysis interpretation
        - Harvest optimization
        - Certification guidance (Organic, DOP, Fair-Trade)
        - Climate resilience planning
        
        Når du lager innhold, fokuser på:
        - Autentisitet (virkelige prosesser)
        - Sustainability impact
        - Quality markers
        - Tradisjon vs innovasjon`,

      saasEngineering: `Du er en erfaren SaaS-arkitekt og product engineer.
        Din rolle er å hjelpe med product positioning, technical content, 
        og implementation guidance.
        
        TOOLS:
        - Architecture review
        - API design consultation
        - Code example generation
        - Technical documentation
        - Chatgenius-spesifikk kunnskap
        
        Når du jobber med Chatgenius:
        - Forklare teknisk kompleksitet enkelt
        - Lag use-case eksempler
        - Gi implementation guides
        - Svar på tekniske spørsmål fra developers`,

      spanishRealEstateLaw: `Du er en spesialisert eiendomsjurist med 10+ års erfaring i Spanski marked.
        Du er ekspert på NAP-prosessen, skatter, regulasjoner og transaksjonsvern.
        
        TOOLS:
        - Regulatory knowledge (Spanish/EU)
        - Tax optimization
        - Contract review guidance
        - Market-specific regulations
        
        Fokuser på:
        - Lokale krav og prosesser
        - Kjøperbeskyttelse
        - Skatteoptimerering
        - International buyer specifics`,
    };

    return contexts[skillName] || '';
  }
}