// src/replicate/replicate.provider.ts
import { Provider } from '@nestjs/common';
import * as Replicate from 'replicate';
import { ConfigService } from '@nestjs/config';

export const REPLICATE_PROVIDER = 'REPLICATE_CLIENT';

export const ReplicateProvider: Provider = {
  provide: REPLICATE_PROVIDER,
  useFactory: (configService: ConfigService) => {
    return new Replicate.default({
      auth: configService.get<string>('REPLICATE_API_TOKEN'),
    });
  },
  inject: [ConfigService], // Inject ConfigService dependency
};
