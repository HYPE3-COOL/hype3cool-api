import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import mongoose, { Model } from 'mongoose';

import { CreateAgentDto } from './dto/create-agent.dto';
import {
  UpdateAgentDto,
  UpdateAgentContractAddressDto,
  UpdateAgentCredentialsDto,
  UpdateAgentSocialLinksDto,
  UpdateAgentAccessTokensDto,
} from './dto';

import { AgentDocument } from './entities/agent.schema';
import { CreatorDocument } from 'src/creator/entities/creator.schema';
import { decrypt, encrypt } from 'src/common/util/crypto-util';
import { SolanaService } from 'src/services/solana.service';
import { TwitterService } from 'src/services/twitter.service';

import { PostTweetStatus } from 'src/common/constants';
import { IOAuth2TokenResponse } from 'src/common/interfaces';

const USER_FIELD_TO_SELECT = 'username image twitter privyUserId';
const SUBSCRIPTION_FIELD_TO_SELECT = 'startAt endAt plan';
const REFRESH_BEFORE_EXPIRED = 20; // in minutes

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    @InjectModel('Agent')
    private readonly agentModel: Model<AgentDocument>,
    @InjectModel('Creator')
    private readonly creatorModel: Model<CreatorDocument>,
    private readonly configService: ConfigService,
    private readonly solanaService: SolanaService,
    private readonly twitterService: TwitterService,
  ) {}

  // create agent and related creators (if not exist)
  async create(userId: string, dto: CreateAgentDto) {
    const session = await this.connection.startSession();
    session.startTransaction({ readPreference: 'primary' });

    try {
      // create agent
      const agentId = new mongoose.Types.ObjectId();
      const doc = await this.agentModel.create(
        [
          {
            _id: agentId,
            user: userId,
            name: dto.name,
            avatar: dto.avatar,
            character: dto.character,
            suggestions: dto.suggestions,
          },
        ],
        { session },
      );

      // loop through the suggestions and create a creator for each, if it doesn't exist
      for (const twitterProfile of dto.suggestions) {
        // find creator by twitter id
        const existCreator = await this.creatorModel
          .findOne({
            'twitter.id': twitterProfile.id,
          })
          .exec();

        if (!existCreator) {
          const newCreator = await this.creatorModel.create(
            [
              {
                username: twitterProfile.username,
                image: twitterProfile.avatar,
                twitter: twitterProfile,
                isShow: true,
                _id: new mongoose.Types.ObjectId(),
              },
            ],
            { session },
          );

          // Push the agentId to the new creator's agents array
          await this.creatorModel.updateOne(
            { _id: newCreator[0]._id },
            {
              $push: {
                agents: agentId,
              },
            },
            { session },
          );
        } else {
          // update the creator with the new avatar
          await this.creatorModel.findByIdAndUpdate(
            existCreator._id,
            {
              $set: {
                image: twitterProfile.avatar,
                twitter: twitterProfile,
              },
            },
            { session },
          );

          // Push the agentId to the existing creator's agents array
          await this.creatorModel.updateOne(
            { _id: existCreator._id },
            {
              $push: {
                agents: agentId,
              },
            },
            { session },
          );
        }
      }

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

  async update(
    id: string,
    updateAgentDto: UpdateAgentDto,
  ): Promise<AgentDocument> {
    const session = await this.connection.startSession();
    session.startTransaction({ readPreference: 'primary' });

    try {
      // // Create Creator objects from updateAgentDto.suggestions if they don't exist
      // const creators = await Promise.all(
      //   updateAgentDto.suggestions.map(async (suggestion) => {
      //     let creator = await this.creatorModel
      //       .findOne({ username: suggestion.username })
      //       .session(session);
      //     if (!creator) {
      //       creator = new this.creatorModel({
      //         name: suggestion.name,
      //         username: suggestion.username,
      //         avatar: suggestion.avatar,
      //       });
      //       await creator.save({ session });
      //     }
      //     return creator._id;
      //   }),
      // );

      const existingAgent = await this.agentModel.findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateAgentDto,
          },
        },
        { new: true, session },
      );

      if (!existingAgent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      for (const suggestion of updateAgentDto.suggestions) {
        const existCreator = await this.creatorModel
          .findOne({
            username: suggestion.username,
          })
          .exec();

        if (!existCreator) {
          await this.creatorModel.create(
            [
              {
                username: suggestion.username,
                image: suggestion.avatar,
                twitter: suggestion,
                isShow: true, // only set true for the creator first created by the agent
                _id: new mongoose.Types.ObjectId(),
              },
            ],
            { session },
          );
        } else {
          // update the creator with the new avatar
          await this.creatorModel.findByIdAndUpdate(
            existCreator._id,
            {
              $set: {
                image: suggestion.avatar,
                twitter: suggestion,
              },
            },
            { session },
          );
        }
      }

      await session.commitTransaction();
      return existingAgent;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // async update(
  //   id: string,
  //   updateAgentDto: UpdateAgentDto,
  // ): Promise<AgentDocument> {
  //   const existingAgent = await this.agentModel.findByIdAndUpdate(
  //     id,
  //     {
  //       $set: {
  //         name: updateAgentDto.name,
  //         avatar: updateAgentDto.avatar,
  //         character: {
  //           bio: updateAgentDto.bio,
  //           lore: updateAgentDto.lore,
  //           knowledge: updateAgentDto.knowledge,
  //           topics: updateAgentDto.topics,
  //           style: updateAgentDto.style,
  //           adjectives: updateAgentDto.adjectives,
  //         },
  //         suggestions: updateAgentDto.suggestions,
  //       },
  //     },
  //     { new: true },
  //   );

  //   if (!existingAgent) {
  //     throw new NotFoundException(`Agent with ID ${id} not found`);
  //   }

  //   return existingAgent;
  // }

  async updateSocialLinks(
    id: string,
    dto: UpdateAgentSocialLinksDto,
  ): Promise<AgentDocument> {
    const existingAgent = await this.agentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          twitter: {
            url: dto.twitter ?? '',
          },
          telegram: {
            url: dto.telegram ?? '',
          },
          discord: {
            url: dto.discord ?? '',
          },
          website: {
            url: dto.website ?? '',
          },
        },
      },
      { new: true },
    );

    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return existingAgent;
  }

  async updateContractAddress(
    id: string,
    dto: UpdateAgentContractAddressDto,
  ): Promise<AgentDocument> {
    const existingAgent = await this.agentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          contractAddress: dto.contractAddress,
        },
      },
      { new: true },
    );

    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return existingAgent;
  }

  // through twitter oauth to get access tokens and store them in the agent
  async updateAccessTokens(
    id: string,
    dto: UpdateAgentAccessTokensDto,
  ): Promise<AgentDocument> {
    const now = new Date();
    const interval = 15; // in minutes   (production is 180 minutes)
    const existingAgent = await this.agentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          twitterOauth: {
            ...dto,
            isAuthenticated: true,
            lastAuthorizedAt: now,
            postTweetsInterval: interval,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      { new: true },
    );

    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return existingAgent;
  }

  async updateCredentials(
    id: string,
    dto: UpdateAgentCredentialsDto,
  ): Promise<AgentDocument> {
    const dataToEncrypt = JSON.stringify(dto);
    const password = this.configService.get<string>('CIPHER_KEY');
    const encryptedCredentials = await encrypt(dataToEncrypt, password);

    const existingAgent = await this.agentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          encryptedCredentials,
          twitter: {
            url: `https://x.com/${dto.username}`, // assume the username of credentials is same as the x.com username
          },
        },
      },
      { new: true },
    );

    if (!existingAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return existingAgent;
  }

  async decryptCredentials(text: string): Promise<string> {
    const password = this.configService.get<string>('CIPHER_KEY');
    return await decrypt(text, password);
  }

  async findOne(query: any): Promise<AgentDocument> {
    return await this.agentModel
      .findOne(query)
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      .exec();
  }

  // const FIELD_TO_SELECT = 'username displayName image twitter walletAddresses';
  async findOneById(id: string): Promise<AgentDocument> {
    return await this.agentModel
      .findById(id)
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      .populate({
        path: 'subscriptions',
        model: 'Subscription',
        select: SUBSCRIPTION_FIELD_TO_SELECT,
      })
      .exec();
  }

  async findByUserId(userId: string): Promise<AgentDocument> {
    return await this.agentModel
      .findOne({ user: userId })
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      .exec();
  }

  async findAllByUserId(userId: string): Promise<AgentDocument[]> {
    return await this.agentModel
      .find({ user: userId })
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      .populate({
        path: 'subscriptions',
        model: 'Subscription',
        select: SUBSCRIPTION_FIELD_TO_SELECT,
      })
      .sort({ updatedAt: -1 })
      .select('+encryptedCredentials')
      .exec();
  }

  // sort by createdAt in descending order
  async findAll(data: {
    query: any;
    sort?: any;
    page?: number;
    limit?: number;
    fields?: string[];
  }): Promise<AgentDocument[]> {
    const { query, sort, page, limit, fields } = data;

    return await this.agentModel
      .find(query)
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      .populate({
        path: 'subscriptions',
        model: 'Subscription',
        // select: SUBSCRIPTION_FIELD_TO_SELECT
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sort ?? { createdAt: -1 })
      .exec();
  }

  async findAgentsByCreatorTwitterId(
    creatorTwitterId: string,
  ): Promise<AgentDocument[]> {
    return await this.agentModel
      .find({ 'suggestions.id': creatorTwitterId })
      .populate({
        path: 'subscriptions',
        model: 'Subscription',
        select: SUBSCRIPTION_FIELD_TO_SELECT,
      })
      // .skip((page - 1) * limit)
      // .limit(limit)
      // .sort(sort ?? { createdAt: -1 })
      .exec();
  }

  async findAllWithCredentials(
    query: any,
    fields?: string[],
  ): Promise<AgentDocument[]> {
    return await this.agentModel
      .find(query)
      .select('+encryptedCredentials')
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      // .populate('user', [USER_FIELD_TO_SELECT])
      // .sort({ 'twitter.followersCount': -1 })
      .exec();
  }

  async findOneWithCredentials(id: string): Promise<AgentDocument> {
    return await this.agentModel
      .findById(id)
      .select('+encryptedCredentials')
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      .exec();
  }

  // async findOneWithTokens(id: string): Promise<AgentDocument> {
  //   return await this.agentModel
  //     .findById(id)
  //     .select('+accessToken +refreshToken')
  //     .exec();
  // }

  async count(query: any): Promise<number> {
    return await this.agentModel.countDocuments(query);
  }

  async findOneWithAccessToken(id: string): Promise<AgentDocument> {
    return await this.agentModel
      .findById(id)
      .select('+twitterOauth')
      .populate({
        path: 'user',
        model: 'User',
        select: USER_FIELD_TO_SELECT,
      })
      .exec();
  }

  async refreshToken(id: string): Promise<any> {
    const agent = await this.agentModel
      .findById(id)
      .select('twitterOauth')
      .exec();
    if (!agent && !agent.twitterOauth?.refreshToken) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    this.logger.log(`Refreshing access token for agent ${id}`);

    const oauthTokenResponse = await this.twitterService.refreshAccessToken(
      agent.twitterOauth?.refreshToken,
    );

    if (oauthTokenResponse !== PostTweetStatus.REFRESH_TOKEN_FAILED) {
      const tokens = oauthTokenResponse as IOAuth2TokenResponse;

      const now = new Date();

      this.logger.log(`New access token has been refreshed for agent ${id}`);
      return await this.agentModel.findByIdAndUpdate(
        id,
        {
          $set: {
            'twitterOauth.accessToken': tokens.access_token,
            'twitterOauth.refreshToken': tokens.refresh_token,
            'twitterOauth.scope': tokens.scope,
            'twitterOauth.expiresIn': tokens.expires_in,
            'twitterOauth.tokenType': tokens.token_type,
            'twitterOauth.isAuthenticated': true,
            'twitterOauth.lastAuthorizedAt': now,
            'twitterOauth.updatedAt': now,
          },
        },
        { new: true },
      );
    } else {
      this.logger.error(`Failed to refresh access token for agent ${id}`);
      return await this.agentModel.findByIdAndUpdate(
        id,
        {
          $set: {
            'twitterOauth.isAuthenticated': false,
            'twitterOauth.lastTrialAt': new Date(),
            'twitterOauth.updatedAt': new Date(),
          },
        },
        { new: true },
      );
    }
  }

  // find all active agents with isAuthenticated and isActive
  async findAllActiveAndAuthenticated(): Promise<AgentDocument[]> {
    return await this.agentModel
      .find({
        'twitterOauth.isAuthenticated': true,
        isActive: true,
      })
      .select('character twitterOauth')
      .exec();
  }

  async findAllToRefreshToken(): Promise<AgentDocument[]> {
    const bufferTime = REFRESH_BEFORE_EXPIRED * 60 * 1000; // 10 minutes in milliseconds
    const now = new Date();

    return await this.agentModel
      .find({
        'twitterOauth.isAuthenticated': true,
        isActive: true,
        $expr: {
          $lt: [
            {
              $add: [
                '$twitterOauth.lastAuthorizedAt',
                { $multiply: ['$twitterOauth.expiresIn', 1000] },
              ],
            },
            { $subtract: [now, bufferTime] },
          ],
        },
      })
      .select('twitterOauth')
      .exec();
  }

  // // Temporary function to update creator agents
  // async updateCreatorAgents() {
  //   const session = await this.connection.startSession();
  //   session.startTransaction({ readPreference: 'primary' });

  //   try {
  //     const agents = await this.agentModel.find().exec();

  //     for (const agent of agents) {
  //       for (const suggestion of agent.suggestions) {
  //         const creator = await this.creatorModel
  //           .findOne({
  //             'twitter.id': suggestion.id,
  //           })
  //           .exec();

  //         if (creator) {
  //           await this.creatorModel.updateOne(
  //             { _id: creator._id },
  //             {
  //               $addToSet: {
  //                 agents: agent._id,
  //               },
  //             },
  //             { session },
  //           );
  //         }
  //       }
  //     }

  //     await session.commitTransaction();
  //     console.log('Creator agents updated successfully');
  //   } catch (error) {
  //     await session.abortTransaction();
  //     console.error('Error updating creator agents:', error);
  //   } finally {
  //     session.endSession();
  //   }
  // }

  // // temp
  // async subscriptionToken(
  //   id: string,
  //   address: string,
  //   name?: string,
  //   symbol?: string,
  // ) {
  //   return await this.agentModel.updateOne(
  //     { _id: id },
  //     {
  //       $set: {
  //         contractAddress: address,
  //         // isActive: true,
  //         // isSubscribed: true,     // set agent as subscribed for the 1st time, since once subscribed, the token cannot be changed
  //         token: {
  //           name: name ?? '',
  //           symbol: symbol ?? '',
  //           address: address,
  //         },
  //       },
  //     },
  //   );
  // }
}
