// Configuration factory for Blueprint v2 feature flags and behavior.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Blueprint namespace configuration factory. */
export const blueprintConfig = registerAs('blueprint', () => ({
  v2Enabled:
    process.env['BLUEPRINT_V2'] === 'true'
      ? true
      : process.env['BLUEPRINT_V2'] === 'false'
        ? false
        : DEFAULT_CONFIG.blueprint.v2Enabled,
}));

/** Inferred TypeScript type for blueprint namespace configuration. */
export type BlueprintConfig = ConfigType<typeof blueprintConfig>;
