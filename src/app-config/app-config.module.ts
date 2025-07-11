import { Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';
import { TokenModule } from 'src/token/token.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigSchema } from 'src/common/schemas/config.schema';
import { AgentModule } from 'src/agent/agent.module';
import { CreatorModule } from 'src/creator/creator.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Config',
        schema: ConfigSchema,
      },
    ]),
    // TokenModule,
    AgentModule,
    CreatorModule,
  ],

  providers: [AppConfigService],
  controllers: [AppConfigController],
  exports: [AppConfigService],
})
export class AppConfigModule {}
