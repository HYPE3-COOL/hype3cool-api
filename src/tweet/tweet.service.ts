import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { TweetDocument } from './entities/tweet.schema';
import { AgentDocument } from 'src/agent/entities/agent.schema';
import { AiService } from 'src/ai/ai.service';

import { TwitterService } from 'src/services/twitter.service';
import { PostTweetStatus } from 'src/common/constants';

@Injectable()
export class TweetService {
  private readonly logger = new Logger(TweetService.name);

  private readonly UNSSENT_THRESHOLD = 3; // no. of unsent tweets to generate
  private readonly GENERATE_TWEET = 10; // no. of tweets to generate each time

  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    @InjectModel('Tweet')
    private readonly tweetModel: Model<TweetDocument>,
    @InjectModel('Agent')
    private readonly agentModel: Model<AgentDocument>,
    private readonly aiService: AiService,
    private readonly twitterService: TwitterService,
  ) {}

  async generateTweets(agent: AgentDocument): Promise<void> {
    try {
      // no. of unsent tweets
      const numOfUnsend = await this.tweetModel.countDocuments({
        agent: agent,
        isSent: false,
      });

      if (numOfUnsend > this.UNSSENT_THRESHOLD) {
        return;
      }

      // TODO: get agent character data to setup prompt to feed to AI model in order to generate tweets
      // const agent = await this.agentModel.findById(agentId).exec();
      console.log({ character: agent.character });
      const prompts = await this.aiService.setupPromptGenerateTweets(
        agent.character,
        this.GENERATE_TWEET,
        agent.character?.language ?? 'en',
        agent.character?.withHashTags ?? false,
      );
      this.logger.log(`Prompts: ${prompts}`);
      const xml = await this.aiService.genetrateTextInXml(
        prompts.system,
        prompts.user,
      );

      const tweets = xml.tweets.tweet;
      const now = new Date();

      // console.log(tweets);
      // filter out empty tweets
      const filteredTweets = tweets.filter((tweet) => tweet.length > 0);

      if (filteredTweets.length === 0) {
        this.logger.log('No tweets generated');
        return;
      }

      // Store the generated tweets in MongoDB
      const tweetDocuments = await this.tweetModel.insertMany(
        filteredTweets.map((tweet) => ({
          agent: agent._id,
          content: tweet,
          isSent: false,
          createdAt: now,
          updatedAt: now,
        })),
      );

      this.logger.log(
        `Generated and stored ${tweetDocuments.length} tweets for agent ${agent._id}`,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  // get the latest unsent tweet by agentId
  // send the tweet to Twitter
  // update the tweet as sent
  async sendTweet(agent: AgentDocument): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();

    const now = new Date();

    try {
      // get the latest unsent tweet
      const tweet = await this.tweetModel
        .findOne(
          { agent: agent._id, isSent: false },
          {},
          { sort: { createdAt: 1 } }, // Sort by createdAt in ascending order to get the earliest tweet
        )
        .session(session);

      if (!tweet) {
        await session.abortTransaction();
        session.endSession();
        return;
      }

      // send tweet to Twitter
      let status = await this.twitterService.postTweet(
        agent.twitterOauth?.accessToken,
        tweet.content,
      );

      // // if token expired, refresh token and retry sending tweet
      // if (status === PostTweetStatus.TOKEN_EXPIRED) {
      //   this.logger.log('Refreshing access token');
      //   const newTokens = await this.twitterService.refreshAccessToken(
      //     agent.twitterOauth?.refreshToken,
      //   );
      //   console.log({ newTokens });
      //   if (newTokens !== PostTweetStatus.REFRESH_TOKEN_FAILED) {
      //     const tokens = newTokens as IOAuth2TokenResponse;
      //     await this.agentModel.updateOne(
      //       { _id: agent._id },
      //       {
      //         'twitterOauth.accessToken': tokens.accessToken,
      //         'twitterOauth.refreshToken': tokens.refreshToken,
      //       },
      //       { session },
      //     );

      //     // retry sending tweet with new access token
      //     this.logger.log('Retrying sending tweet with new access token');
      //     status = await this.twitterService.postTweet(
      //       tokens.accessToken,
      //       tweet.content,
      //     );
      //   } else {
      //     status = newTokens as PostTweetStatus;
      //     await this.agentModel.updateOne(
      //       { _id: agent._id },
      //       {
      //         'twitterOauth.isAuthenticated': false,
      //         'twitterOauth.lastTrialAt': now,
      //         'twitterOauth.updatedAt': now,
      //       },
      //       { session },
      //     );
      //     // throw new Error(`Failed to send tweet: ${tweet}`);
      //   }
      // }

      // update the tweet as sent
      if (status === PostTweetStatus.SUCCESS) {
        this.logger.log(`Tweet sent: ${tweet}`);
        tweet.isSent = true;
        await tweet.save({ session });

        await this.agentModel.updateOne(
          { _id: agent._id },
          { 'twitterOauth.lastTweetedAt': now },
          { session },
        );
      } else {
        this.logger.error(`Failed to send tweet: ${tweet}`);
        await this.agentModel.updateOne(
          { _id: agent._id },
          {
            'twitterOauth.lastTrialAt': now,
            'twitterOauth.updatedAt': now,
          },
          { session },
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(error);
    } finally {
      session.endSession();
    }
  }
}
