import { Module } from '@nestjs/common';
import { PrivyService } from './privy.service';
import { SolanaService } from 'src/services/solana.service';

@Module({
    providers: [PrivyService, SolanaService],
    exports: [PrivyService],
})
export class PrivyModule {}
