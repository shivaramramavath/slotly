// NestJS module configuring feedback storage, services, and administrative controllers.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import {
  FEEDBACK_REPOSITORY,
  MongoFeedbackRepository,
} from './repositories/feedback.repository';
import { FeedbackService } from './services/feedback.service';
import { FeedbackController } from './controllers/feedback.controller';
import { AdminFeedbackController } from './controllers/admin-feedback.controller';

/** NestJS module managing feedback submission, history, and administrative triage. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
  ],
  controllers: [FeedbackController, AdminFeedbackController],
  providers: [
    {
      provide: FEEDBACK_REPOSITORY,
      useClass: MongoFeedbackRepository,
    },
    FeedbackService,
  ],
  exports: [FeedbackService, FEEDBACK_REPOSITORY],
})
export class FeedbackModule {}
