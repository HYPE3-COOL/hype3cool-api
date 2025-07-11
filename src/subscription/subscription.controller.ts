import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SubscriptionService } from './subscription.service';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AgentService } from 'src/agent/agent.service';
import { CreatorService } from 'src/creator/creator.service';
import { SubscriptionPlanType } from 'src/common/constants';

import { Public } from 'src/common/decorators';
import { PrivyService } from 'src/modules/privy/privy.service';

import { SolanaService } from 'src/services/solana.service';
import { CreatorDocument } from 'src/creator/entities/creator.schema';
import { TokenService } from 'src/token/token.service';
import { AppConfigService } from 'src/app-config/app-config.service';

@Controller('subscriptions')
@ApiTags('Subscription')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly agentService: AgentService,
    private readonly creatorService: CreatorService,
    private readonly tokenService: TokenService,
    private readonly solanaService: SolanaService,
    private readonly appConfigService: AppConfigService,
    // private readonly privyService: PrivyService,

  ) {}

  /**
   * Create new subscription
   * @param id
   * @param CreateSubscriptionDto
   * @param req
   * @param res
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new subscription' })
  async create(
    @Body() dto: CreateSubscriptionDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    // check if agent exists and belongs to user
    const agent = await this.agentService.findOne({
      _id: dto.agent,
      user: req.user.id,
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Check if the agent already has an active subscription within the startAt and endAt dates
    const hasActiveSubscription =
      await this.subscriptionService.hasActiveSubscription(
        agent._id.toString(),
      );

    if (hasActiveSubscription) {
      throw new ConflictException(
        'Agent already has an active subscription at the moment!',
      );
    }

    // by agent, get related creator(s)
    let creators: CreatorDocument[] = [];
    for (const creator of agent.suggestions) {
      const doc = await this.creatorService.findByTwitterId(creator.id);
      creators.push(doc);
    }

    const subscription = await this.subscriptionService.create(
      req.user.id,
      dto,
      agent,
      creators,
    );

    // if (dto.plan === SubscriptionPlanType.MONTHLY && dto.contractAddress) {
    //   // fetch token metadata
    //   const meta = await this.solanaService.getTokenMetadata(dto.contractAddress);

    //   if (meta) {
    //     await this.tokenService.createOrUpdateTokenFromHelius(dto.contractAddress, meta?.result);
    //   }
    // }

    res.status(HttpStatus.ACCEPTED).json({
      data: subscription,
      // data: agent,
      status: 'success',
    });
  }

  @Public()
  @Get('check-active-subscription/:agentId')
  @ApiOperation({ summary: 'Check if agent has an active subscription' })
  async checkActiveSubscription(
    @Param('agentId') agentId: string,
    @Res() res: any,
  ) {
    const isActive =
      await this.subscriptionService.hasActiveSubscription(agentId);

    res.status(HttpStatus.OK).json({
      data: {
        isActive,
      },
      status: 'success',
    });
  }

  @Public()
  @Get('get-charge/:plan')
  @ApiOperation({ summary: 'Check if agent has an active subscription' })
  async getCharge(
    @Param('plan') plan: string,
    @Res() res: any,
  ) {
    let amount = 0;

    if (plan == SubscriptionPlanType.MONTHLY) {
      const v = await this.appConfigService.getNumberValue('MONTHLY_PLAN_AMOUNT');
      amount = v;
    }

    res.status(HttpStatus.OK).json({
      data: amount,
      status: 'success',
    });
  }

  @Public()
  @Get('token/:token/get-metadata')
  @ApiOperation({ summary: 'Get token metedata' })
  async getTokenMetadata(@Param('token') token: string, @Res() res: any) {
    // const metadata = await this.solanaService.getTokenMetadata(token);

    try {
      const metadata = await this.solanaService.getTokenMetadata(token);

      // const response = await fetch('https://mainnet.helius-rpc.com/?api-key=a5fd02d3-20b1-4f75-b774-d19399bc9c63', {
      //     method: 'POST',
      //     headers: {
      //         'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //         jsonrpc: '2.0',
      //         id: 'text',
      //         method: 'getAsset',
      //         params: { id: token },
      //     }),
      // });
      // const data = await response.json();
      // setTokenName(data.result.content.metadata.name);
      // setTokenSymbol(data.result.content.metadata.symbol);

      res.status(HttpStatus.OK).json({
        data: {
          token,
          ...metadata,
        },
        status: 'success',
      });
    } catch (error) {
      throw new NotFoundException('Token not found');
      console.log('Error in getting token metadata:', error);
      // setTokenName(null);
      // setTokenSymbol(null);
    }
  }
}
