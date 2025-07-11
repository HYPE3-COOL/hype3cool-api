import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { TokenSchema } from 'src/token/entities/token.schema';

import { UserModule } from 'src/user/user.module';
import { SolanaService } from 'src/services/solana.service';
import { UploadService } from 'src/upload/upload.service';
import { UploadModule } from 'src/upload/upload.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Token',
        schema: TokenSchema,
      }      
    ]),
    // UserModule,
    // UploadModule,
  ],
  controllers: [TokenController],
  providers: [TokenService, SolanaService],
  exports: [TokenService],
})
export class TokenModule {}
