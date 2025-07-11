import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UserModule } from './user/user.module';


import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { HelperModule } from './helper/helper.module';
import { MeModule } from './me/me.module';
import { UploadModule } from './upload/upload.module';
import { TokenModule } from './token/token.module';

import { AppConfigModule } from './app-config/app-config.module';

import { TransactionModule } from './transaction/transaction.module';
import { CronModule } from './cron/cron.module';
import { PrivyModule } from './modules/privy/privy.module';
import { PrivyAuthGuard } from './auth/guards';
import { CreatorModule } from './creator/creator.module';
import { AgentModule } from './agent/agent.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { OauthModule } from './oauth/oauth.module';
import { ElizaModule } from './eliza/eliza.module';
import { TweetModule } from './tweet/tweet.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // envFilePath: ['.env.local', '.env'],
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'), // Loaded from .ENV
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // import ConfigModule
      inject: [ConfigService], // inject ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
        // refreshToken: configService.get<string>('JWT_REFRESH_TOKEN'),
      }),
    }),
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false, 
    }),
    ScheduleModule.forRoot(),
    HelperModule,
    UserModule,
    HealthModule,
    AuthModule,
    MeModule,
    UploadModule,
    TokenModule,
    AppConfigModule,

    TransactionModule,
    CronModule,
    PrivyModule,
    CreatorModule,
    AgentModule,
    SubscriptionModule,
    OauthModule,
    ElizaModule,
    TweetModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_GUARD,
      useClass: PrivyAuthGuard,
      // useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
