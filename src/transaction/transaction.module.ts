import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { TransactionSchema } from './entities/transaction.schema';
import { UserModule } from 'src/user/user.module';

import { TransactionGateway } from './transaction.gateway';
import { SolanaService } from 'src/services/solana.service';
import { UserSchema } from 'src/user/entities/user.schema';
import { CreatorSchema } from 'src/creator/entities/creator.schema';
import { AgentSchema } from 'src/agent/entities/agent.schema';
import { SubscriptionSchema } from 'src/subscription/entities/subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Transaction',
        schema: TransactionSchema,
      },
      {
        name: 'User',
        schema: UserSchema,
      },
      {
        name: 'Creator',
        schema: CreatorSchema,
      },
      {
        name: 'Agent',
        schema: AgentSchema,
      },{
        name: 'Subscription',
        schema: SubscriptionSchema,
      },

      // {
      //   name: 'Coin',
      //   schema: CoinSchema,
      // }
    ]),
    UserModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionGateway, SolanaService],
  exports: [TransactionService, TransactionGateway],
})
export class TransactionModule {}
