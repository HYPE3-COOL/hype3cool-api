import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UserDocument } from 'src/user/entities/user.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { ClientSession, Model } from 'mongoose';
import { TransactionDocument } from './entities/transaction.schema';

import { AgentDocument } from 'src/agent/entities/agent.schema';
import { CreatorDocument } from 'src/creator/entities/creator.schema';
import { SubscriptionDocument } from 'src/subscription/entities/subscription.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,

    @InjectModel('Transaction')
    private readonly transactionModel: Model<TransactionDocument>,

    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,

    @InjectModel('Creator')
    private readonly creatorModel: Model<CreatorDocument>,

    @InjectModel('Agent')
    private readonly agentModel: Model<AgentDocument>,

    @InjectModel('Subscription')
    private readonly subscriptionModel: Model<SubscriptionDocument>,

    // private readonly solanaService: SolanaService,
  ) {}

}
