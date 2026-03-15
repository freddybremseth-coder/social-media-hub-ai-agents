/**
 * Text utilities for cleaning AI-generated content.
 *
 * Strips markdown formatting characters (**, ##, &&, etc.) and
 * enforces Norwegian orthography rules (no mid-sentence capitals
 * except for proper nouns).
 */

/**
 * Remove markdown formatting characters from AI-generated text.
 * Keeps the actual text content but strips formatting syntax.
 */
export function stripMarkdownFormatting(text: string): string {
  if (!text) return text;

  let cleaned = text
    // Remove bold markers: **text** → text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove remaining stray ** pairs
    .replace(/\*\*/g, '')
    // Remove italic markers: *text* → text (but not bullet points)
    .replace(/(?<!\n)\*([^*\n]+)\*/g, '$1')
    // Remove heading markers: ## Heading → Heading
    .replace(/^#{1,6}\s+/gm, '')
    // Remove && (sometimes used as emphasis)
    .replace(/&&/g, '')
    // Remove __ bold/italic: __text__ → text
    .replace(/__([^_]+)__/g, '$1')
    // Remove single _ italic: _text_ → text (but keep underscores in words)
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
    // Remove ~~strikethrough~~: ~~text~~ → text
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove backtick code: `code` → code
    .replace(/`([^`]+)`/g, '$1')
    // Remove triple backtick blocks but keep content
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')
    // Clean up multiple consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace from each line
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();

  return cleaned;
}

/**
 * Norwegian formatting rules to include in AI system prompts.
 * These rules enforce correct Norwegian orthography.
 */
export const NORWEGIAN_CONTENT_RULES = `
VIKTIGE REGLER FOR NORSK INNHOLD:
- Skriv paa norsk (bokmaal) med korrekt rettskriving
- ALDRI bruk stor bokstav midt i en setning (unntak: egennavn som Freddy, Norge, Instagram)
- ALDRI bruk ** eller ## eller && eller __ eller ~~ eller \`\` eller lignende formatering
- ALDRI bruk markdown-formatering — skriv ren, naturlig tekst
- Bruk vanlige linjeskift og avsnitt for struktur
- Bruk bindestrek (-) for punktlister, ikke stjerner (*)
- Skriv engasjerende og naturlig — ikke formelt eller stivt
- Bruk norske uttrykk og vendinger der det passer
`.trim();

/**
 * English formatting rules to include in AI system prompts.
 * Prevents markdown in output while maintaining quality.
 */
export const CLEAN_OUTPUT_RULES = `
IMPORTANT OUTPUT RULES:
- NEVER use ** or ## or && or __ or ~~ or backticks in your output
- NEVER use markdown formatting — write clean, natural text
- Use regular line breaks and paragraphs for structure
- Use dashes (-) for bullet points, not asterisks (*)
- Write engaging, clear content without formatting artifacts
`.trim();
