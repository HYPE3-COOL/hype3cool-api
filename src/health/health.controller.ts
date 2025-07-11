import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { Public } from 'src/common/decorators';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }

  @Get('version')
  @Public()
  async getVersion(
    @Res() res,
  ) {

    const doc = await this.healthService.getVersion();
    res.status(HttpStatus.OK).json({
      data: doc,
      status: 'success',
    });
    
    return doc
  }

  @Get('solana')
  @Public()
  async getSolana(
    @Res() res,
  ) {

    const doc = await this.healthService.getSolana();
    res.status(HttpStatus.OK).json({
      data: doc,
      status: 'success',
    });
    
    return doc
  } 
}