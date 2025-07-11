import { Module } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { TweetSchema } from './entities/tweet.schema';
import { UserSchema } from 'src/user/entities/user.schema';
import { AgentSchema } from 'src/agent/entities/agent.schema';
import { AiModule } from 'src/ai/ai.module';
import { TwitterService } from 'src/services/twitter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Tweet',
        schema: TweetSchema,
      },
      {
        name: 'User',
        schema: UserSchema,
      },
      {
        name: 'Agent',
        schema: AgentSchema,
      },
    ]),
    AiModule,
  ],
  controllers: [TweetController],
  providers: [TweetService, TwitterService],
  exports: [TweetService],
})
export class TweetModule {}
