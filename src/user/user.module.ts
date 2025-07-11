import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/user/entities/user.schema';
import { AgoraService } from 'src/services/agora.service';
import { ConfigSchema } from 'src/common/schemas/config.schema';
import { UserActionLogService } from './user-action-log.service';
import { UserActionLogSchema } from './entities/user-action-log.schema';

import { PrivyModule } from 'src/modules/privy/privy.module';
import { CreatorModule } from 'src/creator/creator.module';

import { AgentModule } from 'src/agent/agent.module';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'User',
        schema: UserSchema,
      },
      {
        name: 'Config',
        schema: ConfigSchema,
      },
      {
        name: 'UserActionLog',
        schema: UserActionLogSchema,
      },
    ]),
    CreatorModule,
  ],
  controllers: [UserController],
  providers: [UserService, AgoraService, UserActionLogService],
  exports: [UserService, UserActionLogService],
})
export class UserModule {}
