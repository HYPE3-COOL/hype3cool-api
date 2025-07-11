import { Module } from '@nestjs/common';
import { CronService } from './cron.service';

import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/user/entities/user.schema';

import { SolanaService } from 'src/services/solana.service';
import { ConfigSchema } from 'src/common/schemas/config.schema';
import { CreatorModule } from 'src/creator/creator.module';

import { TwitterService } from 'src/services/twitter.service';

import { AgentModule } from 'src/agent/agent.module';
import { TokenModule } from 'src/token/token.module';
import { TweetModule } from 'src/tweet/tweet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'User',
        schema: UserSchema,
      },
      {
        name: 'Config',
        schema: ConfigSchema,
      },
    ]),
    CreatorModule,
    TweetModule,
    AgentModule,
    TokenModule,
  ],
  providers: [CronService, SolanaService, TwitterService],
})
export class CronModule {}
