import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
// import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionDocument } from './entities/subscription.schema';
import { AgentDocument } from 'src/agent/entities/agent.schema';
import { CreatorDocument } from 'src/creator/entities/creator.schema';
import {
  EntryStatusType,
  EntryType,
  SubscriptionPlanType,
} from 'src/common/constants';
import { EntryDocument } from 'src/creator/entities/entry.schema';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    @InjectModel('Subscription')
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel('Agent')
    private readonly agentModel: Model<AgentDocument>,
    @InjectModel('Creator')
    private readonly creatorModel: Model<CreatorDocument>,
    @InjectModel('Entry')
    private readonly entryModel: Model<EntryDocument>,
  ) {}

  async create(
    userId: string,
    createSubscriptionDto: CreateSubscriptionDto,
    agent: AgentDocument,
    creators: CreatorDocument[],
  ): Promise<SubscriptionDocument> {
    const session = await this.connection.startSession();
    session.startTransaction({ readPreference: 'primary' });

    try {
      let startAt: Date;
      let endAt: Date;
      let payment = createSubscriptionDto.payment;

      startAt = new Date();
      endAt = new Date(startAt);

      // depend on the plan, set the endAt
      switch (createSubscriptionDto.plan) {
        case SubscriptionPlanType.MONTHLY:
          endAt.setMonth(startAt.getMonth() + 1);
          break;
        case SubscriptionPlanType.TRIAL:
          endAt.setDate(startAt.getDate() + 7);
          break;
        default:
          break;
      }

      const subscriptionId = new mongoose.Types.ObjectId();
      await this.subscriptionModel.create(
        [
          {
            _id: subscriptionId,
            user: userId,
            agent: agent._id,
            character: agent.character,
            creators: creators,
            startAt,
            endAt,
            plan: createSubscriptionDto.plan,
            payment,
          },
        ],
        { session },
      );

      // create entry for each creator
      if (createSubscriptionDto.plan === SubscriptionPlanType.MONTHLY) {
        const numCreators = creators.length;
        const amountPerCreator = payment.amount / numCreators;

        // loop through each creator
        for (const creator of creators) {
          const entryId = new mongoose.Types.ObjectId();

          await this.entryModel.create(
            [
              {
                _id: entryId,
                user: userId,
                creator: creator._id, // or creator
                agent: agent._id,
                subscription: subscriptionId,
                signature: payment?.signature,
                type: EntryType.CREDIT,
                contractAddress: createSubscriptionDto.contractAddress,
                name: payment?.name ?? '',
                symbol: payment?.symbol ?? '',
                amount: amountPerCreator,
                status: EntryStatusType.FINALIZED,
              },
            ],
            { session },
          );

          // check existing holding and update them
          const existingHolding = creator.holdings.find(
            (holding) =>
              holding.tokenAddress === createSubscriptionDto.contractAddress,
          );

          // if existing holding, update the amount
          if (existingHolding) {
            await this.creatorModel.updateOne(
              {
                _id: creator._id,
                'holdings.tokenAddress': createSubscriptionDto.contractAddress,
              },
              {
                $push: {
                  entries: entryId,
                },
                $inc: {
                  'holdings.$.amount': amountPerCreator,
                },
              },
              { session },
            );
          } else {
            await this.creatorModel.updateOne(
              { _id: creator._id },
              {
                $push: {
                  entries: entryId,
                  holdings: {
                    amount: amountPerCreator,
                    tokenAddress: createSubscriptionDto.contractAddress,
                    name: payment?.name ?? '',
                    symbol: payment?.symbol ?? '',
                  },
                },
              },
              { session },
            );
          }

          this.logger.log(
            `Update entry and holding of creator ${creator.id} for subscription ${subscriptionId} for token ${createSubscriptionDto.contractAddress} with amount ${amountPerCreator}`,
          );
        }

        // update agent with subscription info
        await this.agentModel.updateOne(
          { _id: agent._id },
          {
            $set: {
              contractAddress: createSubscriptionDto.contractAddress,
              isActive: true,
              isSubscribed: true, // set agent as subscribed for the 1st time, since once subscribed, the token cannot be changed
              token: {
                name: payment?.name ?? '',
                symbol: payment?.symbol ?? '',
                address: createSubscriptionDto.contractAddress,
              },
              startAt,
              endAt,
            },
            $push: {
              subscriptions: subscriptionId,
            },
          },
          { session },
        );
      } else {
        // free plan
        // update agent with subscription info
        await this.agentModel.updateOne(
          { _id: agent._id },
          {
            $set: {
              isActive: true,
              isSubscribed: true, // set agent as subscribed for the 1st time, since once subscribed, the token cannot be changed
              startAt,
              endAt,
            },
            $push: {
              subscriptions: subscriptionId,
            },
          },
          { session },
        );
      }

      await session.commitTransaction();

      return await this.findOneById(subscriptionId.toString()); // retrieve again to populate agent and creators
      // return doc[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
      //   this._handleError(error);
    } finally {
      session.endSession();
    }
  }

  async findAll(userId: string): Promise<SubscriptionDocument[]> {
    return await this.subscriptionModel
      .find({ user: userId })
      .populate('agent')
      .populate('creators')
      .exec();
  }

  async findOneById(id: string): Promise<SubscriptionDocument> {
    return await this.subscriptionModel
      .findById(id)
      .populate('agent')
      .populate('creators')
      .exec();
  }

  // check if agent has active subscription
  async hasActiveSubscription(agentId: string): Promise<boolean> {
    const now = new Date();

    const activeSubscription = await this.subscriptionModel
      .findOne({
        agent: agentId,
        $or: [{ startAt: { $lte: now }, endAt: { $gte: now } }],
      })
      .exec();

    return !!activeSubscription;
  }
}
