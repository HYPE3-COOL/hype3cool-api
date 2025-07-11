import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators';
import { TokenService } from 'src/token/token.service';
import { AppConfigService } from './app-config.service';
import { CreatorService } from 'src/creator/creator.service';
import { AgentService } from 'src/agent/agent.service';

@Controller('app-config')
@ApiTags('AppConfig')
export class AppConfigController {
  constructor(
    // private readonly tokenService: TokenService,
    private readonly appConfigService: AppConfigService,
    private readonly agentService: AgentService,
    private readonly creatorService: CreatorService,
  ) {}

  // @Get()
  // @Public()
  // @ApiOperation({ summary: 'Get config for frontend' })
  // async getConfig(@Req() req, @Res() res) {
  //   const tokens = await this.tokenService.listAll();

  //   // extract only the mint of tokens and return into an array of mint addresses
  //   // const mintAddresses = tokens.map((token) => token.mint);

  //   res.status(HttpStatus.OK).json({
  //     data: {
  //       // tokens: mintAddresses,
  //       tokens,
  //       expiredAt: new Date(
  //         new Date().setDate(new Date().getDate() + 1),
  //       ).toISOString(),
  //     },
  //     status: 'success',
  //   });
  // }

  // @Get('get-vault')
  // @Public()
  // @ApiOperation({ summary: 'Get config for frontend' })
  // async getVault(@Req() req, @Res() res) {
  //   const vaultAddress = await this.appConfigService.getVault();

  //   res.status(HttpStatus.OK).json({
  //     data: {
  //       vaultAddress,
  //       expiredAt: new Date(
  //         new Date().setDate(new Date().getDate() + 1),
  //       ).toISOString(),
  //     },
  //     status: 'success',
  //   });
  // }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: 'Get app statistics' })
  async getAppStatistics(@Req() req, @Res() res) {
    const creatorCount = await this.creatorService.count({});
    const agentCount = await this.agentService.count({});

    res.status(HttpStatus.OK).json({
      data: {
        creatorCount,
        agentCount,
        totalAssignedFee: 0,
      },
      status: 'success',
    });
  }
}
