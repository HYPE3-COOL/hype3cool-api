import { forwardRef, Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { AgentSchema } from './entities/agent.schema';
import { UserSchema } from 'src/user/entities/user.schema';

import { CreatorSchema } from 'src/creator/entities/creator.schema';
import { PrivyModule } from 'src/modules/privy/privy.module';
import { SolanaService } from 'src/services/solana.service';
import { TwitterService } from 'src/services/twitter.service';
import { TokenModule } from 'src/token/token.module';
import { UserModule } from 'src/user/user.module';
import { TweetModule } from 'src/tweet/tweet.module';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Agent',
        schema: AgentSchema,
      },
      {
        name: 'User',
        schema: UserSchema,
      },
      {
        name: 'Creator',
        schema: CreatorSchema,
      },
    ]),
    forwardRef(() => UserModule),
    // UserModule,
    PrivyModule,
    TokenModule,
    TweetModule,
    AiModule,
  ],
  controllers: [AgentController],
  providers: [AgentService, SolanaService, TwitterService],
  exports: [AgentService],
})
export class AgentModule {}
