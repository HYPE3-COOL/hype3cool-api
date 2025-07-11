import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { CreatorDocument } from './entities/creator.schema';
import { UserDocument } from 'src/user/entities/user.schema';
import { AgentDocument } from 'src/agent/entities/agent.schema';
import { TwitterService } from 'src/services/twitter.service';
import { delay, getRandomDelay, transformToTwitter } from 'src/common/util';
import { EntryDocument } from './entities/entry.schema';
import { EntryStatusType, EntryType } from 'src/common/constants';
import { CreateWithdrawDto } from 'src/auth/dto';
import { WithdrawalDocument } from './entities/withdrawal.schema';

@Injectable()
export class CreatorService {
  private readonly logger = new Logger(CreatorService.name);

  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    @InjectModel('Creator')
    private readonly creatorModel: Model<CreatorDocument>,
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
    @InjectModel('Agent')
    private readonly agentModel: Model<AgentDocument>,
    @InjectModel('Entry')
    private readonly entryModel: Model<EntryDocument>,
    @InjectModel('Withdrawal')
    private readonly withdrawalModel: Model<WithdrawalDocument>,
    private readonly twitterService: TwitterService,
  ) {}

  async create(dto: any) {
    const session = await this.connection.startSession();
    session.startTransaction({ readPreference: 'primary' });
    let userCountConfig;

    try {
      const doc = await this.creatorModel.create(
        [
          {
            ...dto,
            _id: new mongoose.Types.ObjectId(),
            // uid: userCountConfig.value,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return doc[0]; // exclude password (set in schema)
    } catch (error) {
      await session.abortTransaction();
      throw error;
      //   this._handleError(error);
    } finally {
      session.endSession();
    }
  }

  async createByTwittername(username: string) {
    try {
      const existCreator = await this.creatorModel
        .findOne({
          username: username,
        })
        .exec();

      if (existCreator) {
        return existCreator;
      }

      const doc = await this.creatorModel.create([
        {
          username,
        },
      ]);

      return doc[0];
    } catch (error) {
      throw error;
    }
  }

  async findByUsername(
    username: string,
    showEntry?: boolean,
  ): Promise<CreatorDocument> {
    if (showEntry) {
      return await this.creatorModel
        .findOne({ username: username })
        .populate({
          path: 'entries',
          model: 'Entry',
          populate: [
            {
              path: 'user',
              model: 'User',
              select: ['username', 'image'],
            },
            {
              path: 'creator',
              model: 'Creator',
              select: ['username', 'image'],
            },
            {
              path: 'subscription',
              model: 'Subscription',
              select: ['payment'],
            },
          ],
          select: [
            'user',
            'agent',
            'subscription',
            'withdrawal',
            'signature',
            'type',
            'contractAddress',
            'name',
            'symbol',
            'amount',
            'status',
            'createdAt',
          ],
        })
        .populate('user', ['username', 'image'])
        .exec();
    } else {
      return await this.creatorModel
        .findOne({ username: username })
        // .populate({
        //   path: 'entries',
        //   match: {
        //     status: { $ne: EntryStatusType.CLAIMED },
        //   },
        // })
        .populate('user', ['username', 'image'])
        .exec();
    }
  }

  // find entries of username of creator and agent
  async findEntryByUsernameAndAgent(
    username: string,
    agentId: string,
  ): Promise<CreatorDocument> {
    return await this.creatorModel
      .findOne({ username: username })
      .populate({
        path: 'entries',
        model: 'Entry',
        match: { agent: agentId }, // Filter entries by agentId
        populate: [
          {
            path: 'user',
            model: 'User',
            select: ['username', 'image'],
          },
          {
            path: 'creator',
            model: 'Creator',
            select: ['username', 'image'],
          },
          // {
          //   path: 'subscription',
          //   model: 'Subscription',
          //   select: ['payment'],
          // },
        ],
        select: [
          'user',
          'agent',
          'subscription',
          'withdrawal',
          'signature',
          'type',
          'contractAddress',
          'name',
          'symbol',
          'amount',
          'status',
          'createdAt',
        ],
      })
      .populate('user', ['username', 'image'])
      .exec();
  }

  async findByTwitterId(id: string): Promise<CreatorDocument> {
    return await this.creatorModel
      .findOne({ 'twitter.id': id })
      .populate('user', ['username', 'image'])
      .exec();
  }

  // sort by createdAt in descending order
  async findAll(data: {
    query: any;
    sort?: any;
    page?: number;
    limit?: number;
    fields?: string[];
  }): Promise<CreatorDocument[]> {
    const { query, sort, page, limit, fields } = data;
    return await this.creatorModel
      .find(query)
      .populate('user', ['username', 'image'])
      .populate('agents', ['name', 'avatar', 'contractAddress'])
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sort ?? { 'twitter.followersCount': -1 })
      .exec();
  }

  // link user as creator
  async link(user: UserDocument) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Extract Twitter-related data
      const { twitter: userTwitterProfile } = user;

      // Find the creator document by Twitter ID
      let existCreator = await this.creatorModel
        .findOne({ 'twitter.id': userTwitterProfile.id })
        .exec();

      if (existCreator) {
        existCreator.user = user;
        existCreator.username = userTwitterProfile.username;
        existCreator.image = userTwitterProfile.image;
        existCreator.twitter = userTwitterProfile;
        existCreator.isShow = true;
      } else {
        // Create a new Creator document
        existCreator = new this.creatorModel({
          user: user._id,
          username: userTwitterProfile.username,
          image: userTwitterProfile.image,
          twitter: userTwitterProfile,
          isShow: true,
        });
      }
      await existCreator.save({ session });

      // Link the user as a creator
      await this.userModel.findByIdAndUpdate(
        user._id,
        { $set: { isCreator: true } },
        { new: true, session },
      );

      await session.commitTransaction();
      return existCreator;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // link user to creator by privy twitter signup
  // not affecting the `isShow` field if the creator already exists (supposed it is shown through the agent creation)
  async linkByPrivyTwitterSignup(user: UserDocument) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Extract Twitter-related data
      const { twitter: userTwitterProfile } = user;

      // Find the creator document by Twitter ID
      let existCreator = await this.creatorModel
        .findOne({ 'twitter.id': userTwitterProfile.id })
        .exec();

      // if exist, update the user and twitter profile
      if (existCreator) {
        existCreator.user = user;
        existCreator.username = userTwitterProfile.username;
        existCreator.image = userTwitterProfile.image;
        existCreator.twitter = userTwitterProfile;
      } else {
        // check if any creator with the same userId exists, to prevent two creator documents with the same user
        let creatorThisUserLinkedBefore = await this.creatorModel
          .findOne({ user: user._id })
          .exec();

        if (creatorThisUserLinkedBefore) {
          creatorThisUserLinkedBefore.user = null;
          await creatorThisUserLinkedBefore.save({ session });
        }

        // Create a new Creator document
        existCreator = new this.creatorModel({
          user: user._id,
          username: userTwitterProfile.username,
          image: userTwitterProfile.image,
          twitter: userTwitterProfile,
          isShow: true,
        });
      }
      await existCreator.save({ session });

      // Link the user as a creator
      await this.userModel.findByIdAndUpdate(
        user._id,
        { $set: { isCreator: true } },
        { new: true, session },
      );

      await session.commitTransaction();
      // return existCreator;
      return;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async unlink(userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Find the creator document by userId
      const existCreator = await this.creatorModel
        .findOne({ user: userId })
        .exec();
      if (!existCreator) {
        console.log('Creator not found or already unlinked');
        return null;
        // throw new NotFoundException('Creator not found');
      }

      // Set the userId to null
      existCreator.user = null;
      // existCreator.isShow = false;
      await existCreator.save({ session });

      // Unlink the user as a creator
      await this.userModel.findByIdAndUpdate(
        userId,
        { $set: { isCreator: false, twitter: null } },
        { new: true, session },
      );

      await session.commitTransaction();
      return existCreator;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Add this method to update Twitter profile
  async updateTwitterProfile(
    creator: CreatorDocument,
  ): Promise<CreatorDocument> {
    if (creator.twitter?.username) {
      const profile = await this.twitterService.getProfile(
        creator.twitter?.username,
      );

      if (!profile) {
        return null;
      }

      const transformedProfile = transformToTwitter(profile);

      creator.twitter = {
        ...creator.twitter,
        ...transformedProfile,
      };

      console.log(`Updated Twitter profile ${creator.twitter.username}`);
      return await creator.save();
    }
  }

  // Add this method to update all creators' Twitter profiles
  async updateAllCreatorsTwitterProfiles(): Promise<void> {
    const creators = await this.creatorModel.find().exec();
    for (const creator of creators) {
      await this.updateTwitterProfile(creator);
      // const delayTime = getRandomDelay(7200000, 10800000); // 2 to 3 hours in milliseconds
      const delayTime = getRandomDelay(1 * 1000, 5 * 1000);
      // console.log(
      //   `Waiting for ${delayTime / 1000 / 60} minutes before updating the next profile.`,
      // );
      await delay(delayTime);
    }
  }

  // get outstanding holdings by linked user
  async getHoldings(userId: string) {
    return await this.creatorModel.findOne({ user: userId }).exec();
  }

  async withdraw(userId: string, dto: CreateWithdrawDto) {
    const session = await this.connection.startSession();
    session.startTransaction({ readPreference: 'primary' });

    try {
      // find linked creator by privy access token of user
      const creator = await this.creatorModel.findOne({ user: userId }).exec();

      if (!creator) {
        throw new NotFoundException('Creator not found');
      }

      const withdrawalId = new mongoose.Types.ObjectId();
      const withdrawal = await this.withdrawalModel.create(
        [
          {
            _id: withdrawalId,
            user: userId,
            creator: creator._id,
            signature: dto.signature,
            payerAddress: dto.payerAddress,
            receiverAddress: dto.receiverAddress,
            holdings: dto.holdings,
          },
        ],
        { session },
      );
      
      // Deduct the holdings from the creator
      for (const holding of dto.holdings) {
        const existingHolding = creator.holdings.find(
          (h) => h.tokenAddress === holding.tokenAddress,
        );

        if (existingHolding) {
          if (existingHolding.amount < holding.amount) {
            this.logger.error(
              `Insufficient amount for tokenAddress ${holding.tokenAddress}`,
            );
            // throw new BadRequestException(`Insufficient amount for tokenAddress ${holding.tokenAddress}`);
          }
          existingHolding.amount -= holding.amount;

          // would like to add an entry record for each deduction
          const entryId = new mongoose.Types.ObjectId();

          await this.entryModel.create(
            [
              {
                _id: entryId,
                user: userId,
                creator: creator._id, // or creator
                withdrawal: withdrawalId,
                signature: dto.signature,
                type: EntryType.DEBIT,
                contractAddress: holding.tokenAddress,
                name: holding.name ?? '',
                symbol: holding.symbol ?? '',
                amount: holding.amount,
                status: EntryStatusType.FINALIZED,
              },
            ],
            { session },
          );

          await this.creatorModel.updateOne(
            {
              _id: creator._id,
              'holdings.tokenAddress': holding.tokenAddress,
            },
            {
              $push: {
                entries: entryId,
              },
              $inc: {
                'holdings.$.amount': -holding.amount,
              },
            },
            { session },
          );

        } else {
          // throw new NotFoundException(`Holding with tokenAddress ${holding.tokenAddress} not found`);
        }
      }

      await creator.save({ session });
      await session.commitTransaction();
      return withdrawal;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  // async getClaimableAssets(username: string): Promise<CreatorDocument> {
  //   const creator = await this.creatorModel
  //     .findOne({
  //       username: username,
  //     })
  //     .populate({
  //       path: 'entries',
  //       match: {
  //         status: { $ne: EntryStatusType.CLAIMED },
  //       },
  //     })
  //     .exec();

  //   if (!creator) {
  //     throw new NotFoundException('Creator not found');
  //   }

  //   return creator;
  // }

  async count(query: any): Promise<number> {
    return await this.creatorModel.countDocuments(query);
  }
}
