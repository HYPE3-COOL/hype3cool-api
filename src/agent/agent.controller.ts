import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  Logger,
  Param,
  Get,
  NotFoundException,
  UnauthorizedException,
  Put,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';

import { Public } from 'src/common/decorators';
import {
  UpdateAgentDto,
  UpdateAgentSocialLinksDto,
  UpdateAgentAccessTokensDto,
  GenerateCharacterDto,
  GenerateImageDto,
  GenerateBasicCharacterDto,
  SuggestTwitterAccountsDto,
} from './dto';
import { PrivyService } from 'src/modules/privy/privy.service';
import { TweetService } from 'src/tweet/tweet.service';
import { AiService } from 'src/ai/ai.service';
import { TwitterService } from 'src/services/twitter.service';

@Controller('agents')
@ApiTags('Agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly userService: UserService,
    private readonly privyService: PrivyService,
    private readonly tweetService: TweetService,
    private readonly twitterService: TwitterService,
    private readonly aiService: AiService,
    // private readonly tokenService: TokenService,
  ) {}

  /**
   * Create new agent for the user
   * 1. Check if the user has already created an agent
   * 2. Create a new agent
   * 3. Create privy user for each linked creator
   * @param id
   * @param CreateAgentDto
   * @param req
   * @param res
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new agent' })
  async create(@Body() dto: CreateAgentDto, @Req() req: any, @Res() res: any) {
    const agent = await this.agentService.create(req.user.id, dto);

    // create privy user for the related creators of the agent
    if (agent) {
      for (const twitterProfile of agent.suggestions) {
        // check if the creator (twitter) already has a privy user, if yes, skip
        const privyUser = await this.privyService.getUserByTwitterId(
          twitterProfile.id,
        );

        if (privyUser) {
          this.logger.log(
            `Privy user already exists for creator ${twitterProfile.username}`,
          );
          continue;
        } else {
          await this.privyService.setPrivyUserForCreator({
            id: twitterProfile.id,
            username: twitterProfile.username,
            name: twitterProfile.name,
            image: twitterProfile.image,
          });
        }
      }
    }

    res.status(HttpStatus.ACCEPTED).json({
      data: agent,
      status: 'success',
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get agent details by agent ID' })
  async findOne(@Param('id') id: string, @Res() res: any) {
    const agent = await this.agentService.findOneById(id);

    res.status(HttpStatus.ACCEPTED).json({
      data: agent,
      status: 'success',
    });
  }

  @ApiBearerAuth()
  @Get(':id/creators/wallet')
  @ApiOperation({ summary: 'Get related creator wallets by agent ID' })
  async getCreatorWallets(@Param('id') id: string, @Res() res: any) {
    // get related creator by agent
    const agent = await this.agentService.findOneById(id);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // get wallets of creators
    const receiverWallets: string[] = [];
    for (const suggestion of agent.suggestions) {
      const wallet = await this.privyService.getWalletByTwitterId(
        suggestion.id,
      );

      if (!wallet) {
        throw new NotFoundException(
          `Wallet not found for creator ${suggestion.username}`,
        );
      }
      receiverWallets.push(wallet.address);
    }

    res.status(HttpStatus.ACCEPTED).json({
      data: receiverWallets,
      status: 'success',
    });
  }

  @Public()
  @Get('/username/:username')
  @ApiOperation({ summary: `Get agents with details by owner's username` })
  async findOneByUsername(
    @Param('username') username: string,
    @Res() res: any,
  ) {
    const user = await this.userService.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const agents = await this.agentService.findAllByUserId(user.id);

    const decryptedAgents = await Promise.all(
      agents.map(async (agent) => {
        const { encryptedCredentials, ...rest } = agent.toObject();
        if (encryptedCredentials) {
          const data =
            await this.agentService.decryptCredentials(encryptedCredentials);
          return {
            ...rest,
            xUsername: JSON.parse(data).username,
          };
        } else {
          return {
            ...rest,
            xUsername: '',
          };
        }
      }),
    );
    // console.log({ decryptedAgents });

    res.status(HttpStatus.ACCEPTED).json({
      data: decryptedAgents ?? [],
      status: 'success',
    });
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List of agents' })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Page number of result',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Number of records per page',
    required: false,
    example: 15,
  })
  @ApiQuery({
    name: 'type',
    type: String,
    description: 'Type of agent',
    required: false,
    // example: 'owner,players',
  })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    description: 'Field to sort by',
    required: false,
  })
  @ApiQuery({
    name: 'sortDirection',
    type: String,
    description: 'Sort direction: asc|desc',
    required: false,
  })
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('type') type: string,
    @Query('sortBy') sortBy: string,
    @Query('sortDirection') sortDirection: string,
    @Req() req,
    @Res() res: any,
  ) {
    let query: any = {
      // isShow: true,
    };
    let sort: any = {};

    page = page || 1;
    sortBy = sortBy || 'createdAt';

    sort = {
      ...(sortBy
        ? { [sortBy]: sortDirection === 'asc' ? 1 : -1 }
        : { seq: -1 }),
      _id: sortDirection === 'asc' ? 1 : -1, // Always include _id in the sort
    };

    query = {
      ...query,
      ...(type === 'lp' ? { 'token.address': { $exists: true } } : {}),
      // ...(type === 'presale'
      //   ? {
      //       presaleStartAt: { $lte: now },
      //       presaleEndAt: { $gte: now },
      //     }
      //   : {}),
      // ...(chain ? { chain } : {}),
    };

    const docs = await this.agentService.findAll({
      query,
      sort,
      page,
      limit,
    });
    res.status(HttpStatus.OK).json({
      data: docs,
      status: 'success',
    });
  }

  /**
   * Update user's profile
   * @param id
   * @param updateUserDto
   * @param req
   * @param res
   */
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user's agent" })
  async update(
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const agentExists = await this.agentService.findOneById(id);
    if (!agentExists) {
      throw new NotFoundException('Agent not found');
    } else {
      if (agentExists.user.privyUserId != req.user.privyUserId) {
        throw new UnauthorizedException(
          'Only the owner can update one`s agent',
        );
      }
    }

    const agent = await this.agentService.update(id, updateAgentDto);

    // create privy user for the related creators of the agent
    if (agent) {
      for (const creator of agent.suggestions) {
        await this.privyService.setPrivyUserForCreator({
          id: creator.id,
          username: creator.username,
          name: creator.name,
          image: creator.image,
        });
      }
    }

    res.status(HttpStatus.ACCEPTED).json({
      data: agent,
      status: 'success',
    });
  }

  @Put(':id/social-links')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update agent's social links` })
  async updateSocialLinks(
    @Param('id') id: string,
    @Body() dto: UpdateAgentSocialLinksDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const agentExists = await this.agentService.findOneById(id);
    if (!agentExists) {
      throw new NotFoundException('Agent not found');
    } else {
      if (agentExists.user.privyUserId != req.user.privyUserId) {
        throw new UnauthorizedException(
          'Only the owner can update one`s agent',
        );
      }
    }

    const agent = await this.agentService.updateSocialLinks(id, dto);
    res.status(HttpStatus.ACCEPTED).json({
      data: agent,
      status: 'success',
    });
  }

  // @Public()
  // @Get('/admin/update-creator-agents')
  // async updateCreatorAgents(@Req() req: any, @Res() res: any) {
  //   // const agents = await this.agentService.findAll({ query: {}, sort: { createdAt: -1, _id: -1 }, page: 1, limit: undefined });
  //   const agents = await this.agentService.findAll({ query: {} });

  //   // filter if agents[x].subscriptions[x].payment.tokenAddress is not empty, then update agent.token.address
  //   for (const agent of agents) {
  //     for (const subscription of agent.subscriptions) {
  //       if (subscription.payment.tokenAddress) {

  //         let name = ''
  //         let symbol = ''

  //         if (subscription.payment.name.trim() == '') {
  //           const meta = await this.solanaService.getTokenMetadata(
  //             subscription.payment.tokenAddress,
  //           );

  //           name = meta.name;
  //           symbol = meta.symbol;
  //           // console.log({ meta });
  //           // GKBJJAuFYuu5f6zZXCWjBecucUZkgs7pRuXB3PaRpump
  //         }

  //         try {
  //           await this.agentService.subscriptionToken(
  //             agent._id.toString(),
  //             subscription.payment?.tokenAddress,
  //             subscription.payment?.name ?? name,
  //             subscription.payment?.symbol ?? symbol,
  //           );
  //         } catch (error) {
  //           console.log(
  //             `failed to update agent token address ${subscription.payment.tokenAddress}')`,
  //           );
  //           continue;
  //         }

  //         // console.log(subscription.payment.tokenAddress);
  //       }
  //     }
  //   }

  //   res.status(HttpStatus.ACCEPTED).json({
  //     data: agents,
  //     status: 'success',
  //   });
  //   // await this.agentService.updateCreatorAgents();
  //   // return { message: 'Creator agents update initiated' };
  // }

  // @Public()
  // @Get('/:id/refresh-token')
  // @ApiOperation({ summary: `Refresh agent's access token` })
  // async refreshToken(@Param('id') id: string, @Res() res: any) {
  //   const agent = await this.agentService.findOneById(id);
  //   if (!agent) {
  //     throw new NotFoundException('Agent not found');
  //   }

  //   this.logger.log(`Refreshing agent ID:${id} access token`);

  //   const refreshedAgent = await this.agentService.refreshToken(id);
  //   res.status(HttpStatus.ACCEPTED).json({
  //     data: refreshedAgent,
  //     status: 'success',
  //   });
  // }

  // update twitter oauth of agent
  @Put(':id/access-tokens')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update agent's access tokens` })
  async updateAccessTokens(
    @Param('id') id: string,
    @Body() dto: UpdateAgentAccessTokensDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const agentExists = await this.agentService.findOneById(id);
    if (!agentExists) {
      throw new NotFoundException('Agent not found');
    } else {
      if (agentExists.user.privyUserId != req.user.privyUserId) {
        throw new UnauthorizedException(
          'Only the owner can update one`s agent',
        );
      }
    }

    const agent = await this.agentService.updateAccessTokens(id, dto);
    res.status(HttpStatus.ACCEPTED).json({
      data: agent,
      status: 'success',
    });
  }

  @Post(':id/send-tweet')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Send tweet for agent manually` })
  async sendTweet(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const agent = await this.agentService.findOneWithAccessToken(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    } else {
      if (agent.user.privyUserId != req.user.privyUserId) {
        throw new UnauthorizedException(
          'Only the owner can update one`s agent',
        );
      }
    }

    // ensure have enough pre-generate tweet first
    await this.tweetService.generateTweets(agent);
    await this.tweetService.sendTweet(agent);

    // const agent = await this.agentService.updateAccessTokens(id, dto);
    res.status(HttpStatus.ACCEPTED).json({
      data: agent,
      status: 'success',
    });
  }

  @Post('/ai/generate-character-and-tweets')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Generate character and sample tweets` })
  async generateCharacterAndTweets(
    @Body() dto: GenerateCharacterDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    // setup prompt for generating character
    const prompts = await this.aiService.setupCharacterPrompt(dto);
    const characterXml = await this.aiService.genetrateTextInXml(
      prompts.system,
      prompts.user,
    );

    // setup prompt for generating tweets
    const tweetPrompts = await this.aiService.setupPromptGenerateTweets(
      {
        ...characterXml.character,
        intro: dto.intro,
      },
      5,
      dto.language,
      dto.withHashTags,
    );

    const xml = await this.aiService.genetrateTextInXml(
      tweetPrompts.system,
      tweetPrompts.user,
    );

    const tweets = xml.tweets.tweet;

    if (!characterXml.character || !tweets) {
      throw new BadRequestException('Failed to generate character and tweets');
    }

    res.status(HttpStatus.ACCEPTED).json({
      data: {
        character: characterXml.character,
        tweets,
      },
      status: 'success',
    });
  }

  @Post('/ai/generate-basic-character')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate basic character based on list of twitter usernames',
  })
  async generateBasicCharacter(
    @Body() dto: GenerateBasicCharacterDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    // const startTime = new Date();
    // this.logger.log(`Start time: ${startTime.toISOString()}`);

    try {
      const xml = await this.aiService.generateBasicCharacterInXml(
        dto.usernames,
      );

      // also generate avatar based on the character.description
      const avatar = await this.aiService.generateImage(
        xml.character.description + `\n` + xml.character.backstory,
      );

      // const endTime = new Date();
      // this.logger.log(`End time: ${endTime.toISOString()}`);
      // const duration = endTime.getTime() - startTime.getTime();
      // this.logger.log(`Duration: ${duration} ms`);

      res.status(HttpStatus.OK).json({
        data: {
          name: xml.character.name,
          description:
            xml.character.description + `\n` + xml.character.backstory,
          avatar,
        },
        status: 'success',
      });
    } catch (error) {
      // const endTime = new Date();
      // this.logger.log(`End time: ${endTime.toISOString()}`);
      // const duration = endTime.getTime() - startTime.getTime();
      // this.logger.log(`Duration: ${duration} ms`);

      this.logger.error('Failed to generate basic character', error);
      throw new BadRequestException('Failed to generate basic character');
    }
  }

  @Post('/ai/generate-image')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate an image based on a prompt' })
  async generateImage(
    @Body() dto: GenerateImageDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      const filename = await this.aiService.generateImage(dto.prompt);
      res.status(HttpStatus.OK).json({
        data: {
          message: 'Image generated from prompt successfully',
          filename,
        },
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to generate image', error);
      throw new BadRequestException('Failed to generate image');
    }
  }

  @Post('/ai/suggest-twitter-accounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suggest twitter accounts' })
  async suggestTwitterAccounts(
    @Body() dto: SuggestTwitterAccountsDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      const accounts = await this.aiService.suggestTwitterAccounts(
        dto.username,
      );

      const suggestions = [];

      for (const account of accounts) {
        const profile = await this.twitterService.getProfile(
          account[0] == '@' ? account.slice(1) : account,
        );
        suggestions.push(profile);
      }

      res.status(HttpStatus.OK).json({
        data: suggestions,
        // data: accounts,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Failed to suggest twitter accounts', error);
      throw new BadRequestException('Failed to suggest twitter accounts');
    }
  }
}
