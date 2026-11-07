import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '../../common/cache/cache.module';
import { AuditModule } from '../../common/audit/audit.module';
import { EventBus } from '../../common/events/event-bus.service';
import { Faculty, FacultySchema } from './schemas/faculty.schema';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import {
  ElectiveGroup,
  ElectiveGroupSchema,
} from './schemas/elective-group.schema';
import { Room, RoomSchema } from './schemas/room.schema';
import {
  FACULTY_REPOSITORY,
  MongoFacultyRepository,
  CachedFacultyRepository,
} from './repositories/faculty.repository';
import {
  SUBJECT_REPOSITORY,
  MongoSubjectRepository,
  CachedSubjectRepository,
} from './repositories/subject.repository';
import {
  ELECTIVE_GROUP_REPOSITORY,
  MongoElectiveGroupRepository,
  CachedElectiveGroupRepository,
} from './repositories/elective-group.repository';
import {
  ROOM_REPOSITORY,
  MongoRoomRepository,
  CachedRoomRepository,
} from './repositories/room.repository';
import {
  ROOM_MATCHER,
  StandardRoomMatcher,
} from './strategies/room-matcher.strategy';
import {
  FACULTY_QUALIFIER,
  StandardFacultyQualifier,
} from './strategies/faculty-qualifier.strategy';
import { FacultyWorkloadService } from './services/faculty-workload.service';
import { LibraryImportService } from './services/library-import.service';
import { LibraryService } from './services/library.service';
import { LibraryController } from './controllers/library.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Faculty.name, schema: FacultySchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: ElectiveGroup.name, schema: ElectiveGroupSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    CacheModule,
    AuditModule,
  ],
  controllers: [LibraryController],
  providers: [
    EventBus,
    MongoFacultyRepository,
    {
      provide: FACULTY_REPOSITORY,
      useClass: CachedFacultyRepository,
    },
    MongoSubjectRepository,
    {
      provide: SUBJECT_REPOSITORY,
      useClass: CachedSubjectRepository,
    },
    MongoElectiveGroupRepository,
    {
      provide: ELECTIVE_GROUP_REPOSITORY,
      useClass: CachedElectiveGroupRepository,
    },
    MongoRoomRepository,
    {
      provide: ROOM_REPOSITORY,
      useClass: CachedRoomRepository,
    },
    StandardRoomMatcher,
    {
      provide: ROOM_MATCHER,
      useClass: StandardRoomMatcher,
    },
    StandardFacultyQualifier,
    {
      provide: FACULTY_QUALIFIER,
      useClass: StandardFacultyQualifier,
    },
    FacultyWorkloadService,
    LibraryImportService,
    LibraryService,
  ],
  exports: [
    FACULTY_REPOSITORY,
    SUBJECT_REPOSITORY,
    ELECTIVE_GROUP_REPOSITORY,
    ROOM_REPOSITORY,
    ROOM_MATCHER,
    FACULTY_QUALIFIER,
    FacultyWorkloadService,
    LibraryService,
  ],
})
export class LibraryModule {}
