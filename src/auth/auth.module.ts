import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from 'src/user/user.module';
import { SolanaService } from 'src/services/solana.service';
import { PrivyModule } from 'src/modules/privy/privy.module';
import { CreatorModule } from 'src/creator/creator.module';
import { OauthModule } from 'src/oauth/oauth.module';
import { TwitterService } from 'src/services/twitter.service';


// import { RoleModule } from 'src/role/role.module';
// import { EmailModule } from 'src/email/email.module';
// import { TokenModule } from 'src/token/token.module';

// don't expose your keys, move them into .env file
// read values using the @nestjs/config package
// https://docs.nestjs.com/techniques/configuration

@Module({
  imports: [
    UserModule,
    CreatorModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // import ConfigModule
      inject: [ConfigService], // inject ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ConfigModule.forRoot(), // register ConfigModule and load .env file
    PrivyModule,
    OauthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SolanaService, TwitterService], // expose JwtStratey
  exports: [AuthService],
})
export class AuthModule {}
