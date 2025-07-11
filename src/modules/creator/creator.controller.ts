import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Req,
  Res,
  HttpStatus,
  Query,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Public, SetResponse } from '@/common/decorators';

import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { CreatorService } from '@/creator/creator.service';
import { AgentService } from '@/agent/agent.service';


@Controller('creator')
@ApiTags('Creator')
export class CreatorController {
  private readonly logger = new Logger(CreatorController.name);

  constructor(
    private readonly creatorService: CreatorService,
    private readonly agentService: AgentService,
    
  ) {}

  @Public()
  @Get('/:username')
  @ApiOperation({ summary: 'Get creator details by twitter username' })
  @UseInterceptors(ResponseInterceptor)
  @SetResponse('Get creator details by twitter username', 'success')
  async findOneByUsername(@Param('username') username: string, @Res() res) {
    this.logger.log(`Get creator details by twitter username ${username}`);
    const creator = await this.creatorService.findByUsername(username, true);

    if (!creator) {
      throw new NotFoundException(
        `Creator with username ${username} not found`,
      );
    }

    const creatorObj = creator.toObject();

    // find agents by creator.twitter.id
    const agents = await this.agentService.findAgentsByCreatorTwitterId(
      creator.twitter.id,
    );

    // Create a map to store the sum of amounts for each combination of agent and contract address
    const agentContractAmountMap = new Map<
      string,
      {
        agent: string;
        name: string;
        symbol: string;
        contractAddress: string;
        totalAmount: number;
        user?: any;
        creator?: any;
        subscription?: any;
        createdAt?: any;
      }
    >();

    // Iterate over the creator.entries array and update the map with the sum of amounts for each combination of agent and contract address
    creator.entries.forEach((entry) => {
      const agentId = entry.agent.toString();
      const contractAddress = entry.contractAddress;
      const key = `${agentId}-${contractAddress}`;
      const amount = entry.amount;
      const user = entry.user;
      const creator = entry.creator;
      const subscription = entry.subscription;
      const createdAt = entry.createdAt;

      if (agentContractAmountMap.has(key)) {
        agentContractAmountMap.get(key).totalAmount += amount;
      } else {
        agentContractAmountMap.set(key, {
          agent: agentId,
          name: entry.name,
          symbol: entry.symbol,
          contractAddress: contractAddress,
          totalAmount: amount,
          user: user,
          creator: creator,
          subscription: subscription,
          createdAt: createdAt,
        });
      }
    });

    // Use a plain object to hold the agents and assign new values
    const agentsWithTotalAmount = agents.map((agent) => {
      const agentObj: any = agent.toObject();
      const agentId = agent._id.toString();

      agentObj.entries = Array.from(agentContractAmountMap.values()).filter(
        (entry) => entry.agent === agentId,
      );
      return agentObj;
    });



    // refresh agentCount
    creatorObj.agentCount = agents.length;


    res.status(HttpStatus.OK).json({
      data: {
        ...creatorObj,
        agents: agentsWithTotalAmount,
      },
      status: 'success',
    });
  }

  // @Public()
  // @Get('/:username/agents/:agentId')
  // @ApiOperation({ summary: 'Get details of agent of creator' })
  // @UseInterceptors(ResponseInterceptor)
  // @SetResponse('Get creator details by twitter username', 'success')
  // async findAgent(
  //   @Param('username') username: string,
  //   @Param('agentId') agentId: string,
  //   @Res() res,
  // ) {
  //   this.logger.log(`Get details of agent ${agentId} for creator ${username}`);

  //   // Find the creator by username and populate the entries field
  //   // const creator = await this.creatorService.findByUsername(username, true);
  //   // const creator = await this.creatorService.findByUsername(username, true).populate('entries');
  //   const creator = await this.creatorService.findEntryByUsernameAndAgent(username, agentId);

  //   if (!creator) {
  //     throw new NotFoundException(`Creator with username ${username} not found`);
  //   }

  //   // // Find the agent by agentId
  //   // const agent = await this.agentService.findOne({ _id: agentId });

  //   // if (!agent) {
  //   //   throw new NotFoundException(`Agent with ID ${agentId} not found`);
  //   // }

  //   // Filter the entries to include only those related to the agent
  //   // const agentEntries = creator.entries.filter(entry => entry.agent.toString() === agentId);

  //   res.status(HttpStatus.OK).json({
  //     data: {
  //       // ...agent.toObject(),
  //       // entries: agentEntries,
  //       entries: creator.entries,
  //     },
  //     status: 'success',
  //   });
  // }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List creators' })
  // @ApiQuery({
  //   name: 'search',
  //   type: String,
  //   description: 'Text to search creators (name, username, displayName)',
  //   required: false,
  // })
  // @ApiQuery({
  //   name: 'fields',
  //   type: String,
  //   description: 'Field(s) to show details, separated by comma',
  //   required: false,
  //   example: 'email,wallet',
  // })
  // @ApiQuery({
  //   name: 'twitterName',
  //   type: String,
  //   description: 'Search only by twitter username',
  //   required: false,
  // })
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
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req,
    @Res() res: any,
  ) {
    let query: any = {
      isShow: true,
    };

    page = page || 1;
    // limit = limit || 15;

    // if (twitterName != undefined && twitterName != '') {
    //   // If twitterName is provided, only search by twitter.username
    //   query = {
    //     'twitter.username': { $regex: twitterName, $options: 'i' },
    //   };
    // } else if (search != '') {
    //   // Default search behavior
    //   query = {
    //     $or: [
    //       { username: { $regex: search.toLocaleLowerCase(), $options: 'i' } },
    //       { displayName: { $regex: search, $options: 'i' } },
    //     ],
    //   };
    // } else {
    //   res.status(HttpStatus.OK).json({
    //     data: [],
    //     status: 'success',
    //   });
    // }

    // if (search) {
    //   query = {
    //     $or: [
    //       { username: { $regex: search.toLocaleLowerCase(), $options: 'i' } },
    //       { displayName: { $regex: search, $options: 'i' } },
    //       // { description: { "$regex": search, "$options": "i" } }
    //     ],
    //   };
    // }

    const docs = await this.creatorService.findAll({
      query,
      page,
      limit,
      // fields ? fields.split(',') : [],
    });
    res.status(HttpStatus.OK).json({
      data: docs,
      status: 'success',
    });
  }

  // @Public()
  // @Post('get-profile-by-username')
  // @ApiOperation({ summary: 'Get profile of twitter by username' })
  // @UseInterceptors(ResponseInterceptor)
  // @SetResponse('Get profile of twitter by username', 'success')
  // async getProfile(@Body() dto: any, @Res() res) {
  //   const profile = await this.twitterService.getProfile(dto.username);
  //   res.status(HttpStatus.CREATED).json({
  //     data: profile,
  //     status: 'success',
  //   });
  // }
}
