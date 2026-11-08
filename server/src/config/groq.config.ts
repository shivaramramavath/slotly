// Configuration factory for Groq AI LLM integration.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Groq AI namespace configuration factory. */
export const groqConfig = registerAs('groq', () => ({
  apiKey: process.env['GROQ_API_KEY'] || DEFAULT_CONFIG.groq.apiKey,
  model: process.env['GROQ_MODEL'] || DEFAULT_CONFIG.groq.model,
  requestLimits: {
    maxTokens: parseInt(
      process.env['GROQ_MAX_TOKENS'] ||
        String(DEFAULT_CONFIG.groq.requestLimits.maxTokens),
      10,
    ),
    temperature: parseFloat(
      process.env['GROQ_TEMPERATURE'] ||
        String(DEFAULT_CONFIG.groq.requestLimits.temperature),
    ),
  },
}));

/** Inferred TypeScript type for groq namespace configuration. */
export type GroqConfig = ConfigType<typeof groqConfig>;
