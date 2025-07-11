import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ReplicateProvider } from './providers/replicate.provider';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    UploadModule,
  ],
  providers: [AiService, ReplicateProvider],
  exports: [AiService, ReplicateProvider],
})
export class AiModule {}