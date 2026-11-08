// Tiny zod schema fixture.
import { z } from 'zod';

export const TinyItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type TinyItem = z.infer<typeof TinyItemSchema>;
