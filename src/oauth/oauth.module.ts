import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OauthClientService } from './services/oauth-client.service';
import { ConfigSchema } from 'src/common/schemas/config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Config',
        schema: ConfigSchema,
      },
    ]),
  ],
  providers: [OauthClientService],
  exports: [OauthClientService],
})
export class OauthModule {}
