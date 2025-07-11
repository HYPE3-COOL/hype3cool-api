import { Module } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { CreatorController } from './creator.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { CreatorSchema } from './entities/creator.schema';
import { UserSchema } from 'src/user/entities/user.schema';
import { AgentModule } from 'src/agent/agent.module';
import { AgentSchema } from 'src/agent/entities/agent.schema';
import { TwitterService } from 'src/services/twitter.service';
import { EntrySchema } from './entities/entry.schema';
import { WithdrawalSchema } from './entities/withdrawal.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Creator',
        schema: CreatorSchema,
      },
      {
        name: 'User',
        schema: UserSchema,
      },
      {
        name: 'Agent',
        schema: AgentSchema,
      },
      {
        name: 'Entry',
        schema: EntrySchema,
      },
      {
        name: 'Withdrawal',
        schema: WithdrawalSchema,
      }
    ]),
    AgentModule,
  ],
  controllers: [CreatorController],
  providers: [CreatorService, TwitterService],
  exports: [CreatorService],
})
export class CreatorModule {}
