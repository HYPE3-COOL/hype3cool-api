import { Module } from '@nestjs/common';
import { ElizaController } from './eliza.controller';
import { AgentModule } from 'src/agent/agent.module';
import { OauthModule } from 'src/oauth/oauth.module';

@Module({
  imports: [AgentModule, OauthModule],
  controllers: [ElizaController],
})
export class ElizaModule {}
