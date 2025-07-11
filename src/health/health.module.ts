import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

import { MongooseModule } from '@nestjs/mongoose';
import { ConfigSchema } from 'src/common/schemas/config.schema';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    MongooseModule.forFeature([
      {
        name: 'Config',
        schema: ConfigSchema,
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
