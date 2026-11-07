// Tiny mongoose schema fixture.
import { Schema, Prop } from '@nestjs/mongoose';

@Schema({ collection: 'tiny_items' })
export class TinyItem {
  @Prop({ index: true })
  code: string;
}
