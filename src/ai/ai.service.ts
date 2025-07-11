import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { generateText } from 'ai';
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek';
import { togetherai } from '@ai-sdk/togetherai';
import { createXai } from '@ai-sdk/xai';

import d from 'dedent';
import { XMLParser } from 'fast-xml-parser';
import { Prompt } from './interfaces';
import { GenerateCharacterDto } from 'src/agent/dto';
// import { AppConfigService } from 'src/app-config/app-config.service';
import { RULES_GENERATE_TWEETS } from 'src/common/constants';

import type Replicate from 'replicate';
import { REPLICATE_PROVIDER } from './providers/replicate.provider';
import { UploadService } from 'src/upload/upload.service';
import { v4 as uuidv4 } from 'uuid';

import { Scraper } from 'agent-twitter-client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private model: any;
  private deepseekModel: any;
  private togetherModel: any;

  private xai: any;

  private scraper: Scraper;

  constructor(
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
    @Inject(REPLICATE_PROVIDER)
    private readonly replicate: Replicate,
  ) {
    // this.togetherModel = togetherai('deepseek-ai/DeepSeek-R1');

    // this.configService.get<string>('TOGETHERAI_API_KEY');
    // process.env.TOGETHER_API_KEY =
    //   this.configService.get<string>('TOGETHER_API_KEY');
    // this.model = togetherai('deepseek-ai/DeepSeek-R1');
    this.deepseekModel = createDeepSeek({
      apiKey: this.configService.get<string>('DEEPSEEK_API_KEY'),
    });

    this.xai = createXai({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });

    this.scraper = new Scraper();
  }

  async setupPromptGenerateTweets(
    data: any,
    numOfTweets: number = 10,
    language: string = 'en',
    withHashTags: boolean = false,
  ): Promise<Prompt> {
    const prompt = d(`
      <intro>
      ${data?.intro}
      </intro>
      
      You will generate tweets based on the following attributes:
      
      Bio:
      <bio>${data?.bio}</bio>
      Lore:
      <lore>${data?.lore}</lore>
      Knowledge:
      <knowledge>${data?.knowledge}</knowledge>
      Topics:
      <topics>${data?.topics}</topics>
      Style:
      <style>${data?.style}</style>
    
      Generate tweets based on the following rules:
      RULES:
      <rules>${RULES_GENERATE_TWEETS}</rules>
    
      ### OUTPUT EXAMPLE:
      <tweets>
          <tweet word_count="5">Celebrity book clubs are the future.</tweet>
          <tweet word_count="10">Timothée Chalamet spotted reading Murakami!</tweet>
          <tweet word_count="50">Dark academia is trending again, and it’s no surprise. The moody libraries and classic literature aesthetics make for the perfect escape.</tweet>
      </tweets>
    `);

    let promptUser = `Generate ${numOfTweets} tweets following these guidelines. `;
    if (language === 'en') {
      promptUser += 'Tweets must be in English. ';
    } else {
      promptUser += 'Tweets must be in Chinese. ';
    }
    if (withHashTags) {
      promptUser += 'Can use hashtags or emojis.';
    } else {
      promptUser += 'No hashtags or emojis allowed.';
    }

    return {
      system: prompt,
      user: promptUser,
    };
  }

  async setupCharacterPrompt(dto: GenerateCharacterDto): Promise<Prompt> {
    const { name, intro, language } = dto;
    // this.logger.log(`setupCharacterPrompt: ${name} ${intro} ${language}`);

    const prompt = d(`
      Can you generate a set of bio, lore, knowledge, topics, style, chat, posts and adjectives for the following character:
      You will generate character based on the following description:
      
      ${intro}
      
      ### OUTPUT EXAMPLE:
      <character>
        <name>${name}</name>
        <bio></bio>
        <lore></lore>
        <knowledge></knowledge>
        <topics></topics>
        <style></style>
        <chat></chat>
        <posts></posts>
        <adjectives></adjectives>
      </character>
    `);

    let promptUser: string;
    if (language === 'en') {
      promptUser = `Generate a set of bio, lore, knowledge, topics, style, chat, posts and adjectives. Field data must be translated into English.`;
    } else {
      promptUser = `Generate a set of bio, lore, knowledge, topics, style, chat, posts and adjectives. Field data must be translated into Chinese.`;
    }

    return {
      system: prompt,
      user: promptUser,
    };
  }

  async genetrateTextInXml(
    system: string,
    prompt: string,
    // language: string = 'en',
    // withHashTags: boolean = false,
  ): Promise<any> {
    try {
      const { text } = await generateText({
        // model: this.model,
        model: this.deepseekModel('deepseek-chat'),
        // model: this.deepseek('deepseek-reasoner'),
        system,
        prompt,
      });

      const parser = new XMLParser();
      return parser.parse(text);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const defaultFolder = 'uploads';
      const [output]: any = await this.replicate.run(
        'black-forest-labs/flux-schnell',
        { input: { prompt } },
      );

      const filename = `${uuidv4()}.png`;

      return await this.uploadService.uploadStream(
        filename,
        defaultFolder,
        output,
      );
    } catch (error) {
      throw new BadRequestException('Failed to generate image');
    }
  }

  // generate a character based on list of Twitter accounts
  async generateBasicCharacterInXml(usernames: string[]): Promise<any> {
    try {
      const prompt = d(`
        <intro>
        Based on the Twitter accounts ${usernames.join(', ')}, create a highly detailed character profile. 
        The character should reflect the themes, tone, and values derived from the content and style of the specified Twitter accounts. 
        Provide a creative biography that includes the character's personality traits, motivations, and distinctive characteristics. 
        Additionally, include a few notable achievements or life events that add depth to the character. 
        </intro>

        Generate as the following example:

        ### OUTPUT EXAMPLE:
        <character>
          <name>Celebrity book clubs are the future.</name>
          <description>Timothée Chalamet spotted reading Murakami!</description>
          <backstory>Dark academia is trending again, and it’s no surprise. The moody libraries and classic literature aesthetics make for the perfect escape.</backstory>
        </character>
      `);

      const { text } = await generateText({
        model: this.xai('grok-2-latest'),
        prompt,
      });

      const parser = new XMLParser();
      return parser.parse(text);
    } catch (error) {
      console.log({ generateBasicCharacter: error });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async suggestedAccounts(
    username: string,
    followings: string[],
  ): Promise<any> {
    try {
      const prompt = d(`
        <request>
        Analyze what @${username}'s interests and pick two from the following list of accounts: ${followings.join(', ')} or any two other similar accounts that matches their interests and personality.Suggest two of accounts that align with their interests and do not repeat same accounts . Only provide the two usernames, nothing else.
        </request>

        Generate as the following example:

        ### OUTPUT EXAMPLE:
        <data>
          <account>RationalGaze__</name>
          <account>citchmook</account>
        </data>
      `);

      const { text } = await generateText({
        model: this.xai('grok-2-latest'),
        system: 'You are a helpful assistant.',
        prompt,
      });

      const parser = new XMLParser();
      return parser.parse(text);
    } catch (error) {
      console.log({ generateBasicCharacter: error });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async suggestTwitterAccounts(username: string): Promise<any> {
    try {
      const cookies = [
        {
          key: 'ct0',
          value: this.configService.get<string>('TWITTER_CT0')!,
          expires: '2030-03-13T17:58:11.000Z',
          maxAge: 157680000,
          domain: 'twitter.com',
          path: '/',
          secure: true,
          hostOnly: false,
          creation: '2025-03-14T17:58:11.687Z',
          lastAccessed: '2025-03-14T17:58:12.192Z',
          sameSite: 'lax',
        },
        {
          key: 'auth_token',
          value: this.configService.get<string>('TWITTER_AUTH_TOKEN')!,
          expires: '2030-03-13T17:58:11.000Z',
          maxAge: 157680000,
          domain: 'twitter.com',
          path: '/',
          secure: true,
          httpOnly: true,
          hostOnly: false,
          creation: '2025-03-14T17:58:11.687Z',
          lastAccessed: '2025-03-14T17:58:12.192Z',
          sameSite: 'none',
        },
      ];
      const formattedCookies = cookies.map((cookie) => {
        return `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; Expires=${cookie.expires}; Max-Age=${cookie.maxAge}; Secure=${cookie.secure}; HttpOnly=${cookie.httpOnly}; SameSite=${cookie.sameSite}`;
      });

      await this.scraper.setCookies(formattedCookies);

      const profile = await this.scraper.getProfile(username);
      const followings = this.scraper.getFollowing(
        profile.userId,
        profile.followingCount > 300 ? 300 : profile.followingCount,
      );
      const followingList = [];

      for await (const item of followings) {
        followingList.push(item);
      }
      
      const screenNames: string[] = [];
      for (const item of followingList) {
        screenNames.push(`@${item.username}`);
      }

      const xml = await this.suggestedAccounts(username, screenNames);
      return xml.data.account;

      // const randomSelectionCount = 2; // Change this to select a different number of usernames
      // const randomScreenNames = screenNames
      //   .sort(() => 0.5 - Math.random())
      //   .slice(0, randomSelectionCount);

      // console.log(screenNames); // Full list of usernames
      // console.log(randomScreenNames); // Randomly selected subset of usernames

      // return randomScreenNames;
    } catch (error) {
      throw new BadRequestException(error.message);
      // throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
