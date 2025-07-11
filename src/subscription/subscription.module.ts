import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionSchema } from './entities/subscription.schema';
import { TransactionSchema } from 'src/transaction/entities/transaction.schema';
import { AgentModule } from 'src/agent/agent.module';
import { CreatorModule } from 'src/creator/creator.module';
import { AgentSchema } from 'src/agent/entities/agent.schema';
import { CreatorSchema } from 'src/creator/entities/creator.schema';
import { EntrySchema } from 'src/creator/entities/entry.schema';
import { PrivyModule } from 'src/modules/privy/privy.module';
import { SolanaService } from 'src/services/solana.service';
import { TokenModule } from 'src/token/token.module';
import { AppConfigModule } from 'src/app-config/app-config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Subscription',
        schema: SubscriptionSchema,
      },
      {
        name: 'Transaction',
        schema: TransactionSchema,
      },
      {
        name: 'Agent',
        schema: AgentSchema,
      },
      {
        name: 'Creator',
        schema: CreatorSchema,
      },
      {
        name: 'Entry',
        schema: EntrySchema,
      },
    ]),
    AgentModule,
    CreatorModule,
    TokenModule,
    PrivyModule,
    AppConfigModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SolanaService],
})
export class SubscriptionModule {}
