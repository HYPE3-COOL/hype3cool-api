import {
  Controller,
  Req,
  Res,
  HttpStatus,
  Query,
  Logger,
  Get,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenService } from './token.service';
import { Public } from 'src/common/decorators';
import { SolanaService } from 'src/services/solana.service';

@Controller('tokens')
@ApiTags('Token')
export class TokenController {
  private readonly logger = new Logger(TokenController.name);

  constructor(private readonly tokenService: TokenService) {}

  @Get()
  @Public()
  async findAll(@Req() req, @Res() res: any) {
    const tokens = await this.tokenService.findAll({ query: {} });
    res.status(HttpStatus.OK).json({
      data: tokens,
      status: 'success',
    });
  }

  @Get(':address/update-market')
  @ApiBearerAuth()
  async updateMarket(
    @Param('address') address: string,
    @Req() req,
    @Res() res: any,
  ) {
    const tokens = await this.tokenService.updateMarketData(address);
    res.status(HttpStatus.OK).json({
      data: tokens,
      status: 'success',
    });
  }
}
