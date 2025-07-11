import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';

import { Public } from 'src/common/decorators';
import { OAuthClientGuard } from 'src/oauth/guard/oauth-client.guard';
import { AgentService } from 'src/agent/agent.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseDto } from './dto';

@Public()
@Controller('eliza')
@ApiTags('Eliza')
@UseGuards(OAuthClientGuard)
export class ElizaController {
  private readonly logger = new Logger(ElizaController.name);

  constructor(
    private readonly agentService: AgentService,
    // private readonly userService: UserService,
  ) {}

  // constructor(
  //   private readonly elizaService: ElizaService
  // ) { }

  @Get('agents')
  @ApiOperation({ summary: 'List of agents' })
  async findAll(@Req() req, @Res() res: any) {
    let query: any = {
      // isShow: true,
    };

    const docs = await this.agentService.findAllWithCredentials(query);
    res.status(HttpStatus.OK).json({
      data: docs,
      status: 'success',
    });
  }

  @Get('agents/:id')
  @ApiOperation({ summary: 'Get agent details by agent ID' })
  async findOne(@Param('id') id: string, @Res() res: any) {
    const agent = await this.agentService.findOneWithCredentials(id);

    res.status(HttpStatus.ACCEPTED).json({
      data: agent,
      status: 'success',
    });
  }

  @Post('parse')
  @ApiOperation({ summary: 'Get agent credentials' })
  async decrypt(@Body() dto: ParseDto, @Res() res: any) {
    const data = await this.agentService.decryptCredentials(dto.text);

    res.status(HttpStatus.ACCEPTED).json({
      data: JSON.parse(data),
      status: 'success',
    });
  }
}
