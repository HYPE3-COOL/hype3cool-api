import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

// mongoose
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigDocument } from 'src/common/schemas/config.schema';

import { ConfigKey } from 'src/common/constants';
// import { TransactionGateway } from 'src/transaction/transaction.gateway';
import { CreatorService } from 'src/creator/creator.service';
import { AgentService } from 'src/agent/agent.service';
import { TokenService } from 'src/token/token.service';
import { TweetService } from 'src/tweet/tweet.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronService {
  private readonly postTweetInterval;
  private readonly generateTweetsCronExpression;

  constructor(
    @InjectModel('Config')
    private readonly configModel: Model<ConfigDocument>,
    private readonly configService: ConfigService,
    private readonly creatorService: CreatorService,
    private readonly tokenService: TokenService,
    private readonly agentService: AgentService,
    private readonly tweetService: TweetService,
  ) {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      this.postTweetInterval = 180;
      this.generateTweetsCronExpression = 180 * 6;
    } else {
      this.postTweetInterval = 30;
      this.generateTweetsCronExpression = 30 * 6;
    }
  }

  // Use environment variables for cron expressions

  private readonly logger = new Logger(CronService.name);

  // // Cron job to scan and save transaction logs every minute
  // // @Cron(CronExpression.EVERY_MINUTE)
  // async scanAndSaveTransaction() {
  //   const coins = await this.transactionLogService.getCoins();
  //   for (const coin of coins) {
  //     const hasNewTransactions =
  //       await this.transactionLogService.fetchAndStoreTransactionLogs(
  //         coin.solCollectionWallet,
  //       );

  //     if (hasNewTransactions) {
  //       // Fetch updated holders or any related data here if needed.
  //       const holders =
  //         await this.transactionLogService.getHoldersFromCoinInPresale(
  //           coin.solCollectionWallet,
  //         );

  //       // Emit the update with the latest holders data
  //       this.transactionGateway.emitTransactionUpdate(
  //         coin.solCollectionWallet,
  //         holders,
  //       );

  //       this.logger.log(`Fetched and stored transaction logs for ${coin.name}`);
  //     } else {
  //       this.logger.log(
  //         `Fetched and but not saved any transaction logs for ${coin.name}`,
  //       );
  //     }
  //     // this.transactionGateway.emitTransactionUpdate(coin.solCollectionWallet, []);
  //   }
  // }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async getSolMarketPrice() {
  //   // Get the sol market price
  //   const response = await axios.get(
  //     'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
  //   );

  //   try {
  //     const { data, status } = response;
  //     if (status == 200) {
  //       const config = await this.configModel.findOne({
  //         name: ConfigKey.SOL_MARKET_PRICE,
  //       });
  //       if (!config) {
  //         await this.configModel.create({
  //           name: ConfigKey.SOL_MARKET_PRICE,
  //           value: data.price,
  //         });
  //         return;
  //       } else {
  //         await this.configModel.findOneAndUpdate(
  //           { name: ConfigKey.SOL_MARKET_PRICE },
  //           { value: data.price },
  //         );
  //       }
  //       this.logger.log(`Update SOL market price ${data.price}`);
  //     }
  //   } catch (error) {}
  // }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async getTps() {
  //   try {
  //     const response = await axios.post(process.env.SOLANA_RPC!, {
  //       jsonrpc: '2.0',
  //       id: 1,
  //       method: 'getRecentPerformanceSamples',
  //       params: [1],
  //     });

  //     if (response.data && response.data.result) {
  //       const tps =
  //         response.data.result[0].numTransactions /
  //         response.data.result[0].samplePeriodSecs;

  //       const config = await this.configModel.findOne({
  //         name: ConfigKey.SOL_TPS,
  //       });
  //       if (!config) {
  //         await this.configModel.create({
  //           name: ConfigKey.SOL_TPS,
  //           value: tps,
  //         });
  //         return;
  //       } else {
  //         await this.configModel.findOneAndUpdate(
  //           { name: ConfigKey.SOL_TPS },
  //           { value: tps },
  //         );
  //       }
  //       this.logger.log(`Update SOL TPS ${tps}`);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // Add this cron job to update Twitter profiles every day at midnight
  @Cron(CronExpression.EVERY_6_HOURS)
  async updateCreatorsTwitterProfiles() {
    this.logger.log('Updating Twitter profiles of all creators...');
    await this.creatorService.updateAllCreatorsTwitterProfiles();
    this.logger.log('Twitter profiles of all creators updated.');
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateTokenMarketData() {
    await this.tokenService.updateAllMarketData();
  }

  // generate tweets for all agents
  @Cron(CronExpression.EVERY_HOUR)
  async generateTweets() {
    this.logger.log('Generating tweets for all agents...');
    const agents = await this.agentService.findAllActiveAndAuthenticated();

    for (const agent of agents) {
      this.logger.log(`Generating tweets for agent ${agent._id.toString()}`);
      await this.tweetService.generateTweets(agent);
    }
    this.logger.log('Finished generating tweets for all agents...');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async postTweets() {
    this.logger.log('Scheduled tweet posting...');
    const agents = await this.agentService.findAllActiveAndAuthenticated();

    for (const agent of agents) {
      const now = new Date();
      const lastTweetedAt = agent.twitterOauth?.lastTweetedAt;

      if (!lastTweetedAt) {
        // If lastTweetedAt does not exist, send tweet
        await this.tweetService.sendTweet(agent);
      } else {
        // Check if lastTweetedAt + postTweetInterval (minutes) > now
        const nextTweetTime = new Date(
          lastTweetedAt.getTime() + this.postTweetInterval * 60000,
        );
        if (nextTweetTime <= now) {
          await this.tweetService.sendTweet(agent);
        }
      }
    }

    this.logger.log('Finished scheduled tweet posting...');
  }

  // @Cron(CronExpression.EVERY_10_MINUTES)
  @Cron(CronExpression.EVERY_HOUR)
  async refreshAgentTokens() {
    const agents = await this.agentService.findAllToRefreshToken();
    for (const agent of agents) {
      await this.agentService.refreshToken(agent._id.toString());
    }
  }
}
