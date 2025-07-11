import { Module } from '@nestjs/common';
import { MeController } from './me.controller';

import { UserModule } from 'src/user/user.module';
import { PrivyModule } from 'src/modules/privy/privy.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [UserModule, PrivyModule, AuthModule],
  controllers: [MeController],
})
export class MeModule {}
