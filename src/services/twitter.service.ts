import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Scraper } from 'agent-twitter-client';
import { IOAuth2TokenResponse, Twitter } from 'src/common/interfaces';
import { transformToTwitter } from 'src/common/util';

import { TwitterApi } from 'twitter-api-v2';

import { PostTweetStatus } from 'src/common/constants';
import axios from 'axios';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly twitterClientBasicAuth: string;

  private scraper: Scraper;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('TWITTER_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('TWITTER_CLIENT_SECRET');
    this.twitterClientBasicAuth = this.configService.get<string>('TWITTER_CLIENT_BASIC_AUTH');
    
    this.scraper = new Scraper();
  }

  async getProfile(username: string): Promise<any> {
    try {
      const profile = await this.scraper.getProfile(username);
      return profile;
    } catch (error) {
      this.logger.error(
        `Failed to fetch profile for ${username}: ${error.message}`,
      );
      return;
    }
  }

  transform = (data: any): Twitter => transformToTwitter(data);

  async postTweet(
    access_token: string,
    tweet: string,
  ): Promise<PostTweetStatus> {
    const client = new TwitterApi(access_token);

    try {
      await client.v2.tweet({ text: tweet });
      this.logger.log(`Tweet posted: ${tweet}`);
      return PostTweetStatus.SUCCESS;
    } catch (error) {
      this.logger.error(
        `Failed to post tweet: ${tweet}`,
        `error from x.com: ${error.message}`,
      );
      return PostTweetStatus.TOKEN_EXPIRED;
    }
  }

  async refreshAccessToken(
    refresh_token: string,
  ): Promise<IOAuth2TokenResponse | PostTweetStatus> {
    try {
      const tokenResponse = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          refresh_token: refresh_token,
          grant_type: 'refresh_token',
          client_id: this.clientId!,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Authorization: `Basic ${Buffer.from(`${this.clientId!}:${this.clientSecret!}`).toString('base64')}`,
            Authorization: `Basic ${this.twitterClientBasicAuth}`,
          },
        },
      );

      if (tokenResponse.status !== 200) {
        return PostTweetStatus.REFRESH_TOKEN_FAILED;
      }

      return {
        token_type: tokenResponse.data.token_type,
        expires_in: tokenResponse.data.expires_in,
        access_token: tokenResponse.data.access_token,
        scope: tokenResponse.data.scope,
        refresh_token: tokenResponse.data.refresh_token,
      };
    } catch (error) {
      this.logger.error(error);
      console.log({ refreshAccessToken: error });
      return PostTweetStatus.REFRESH_TOKEN_FAILED;
    }
  }
}
