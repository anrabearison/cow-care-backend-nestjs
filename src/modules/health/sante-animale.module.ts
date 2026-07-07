import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SanteAnimaleController } from './sante-animale.controller';
import { SanteAnimaleRagService } from './services/sante-animale-rag.service';
import { ChatbotSanteAnimaleService } from './services/chatbot-sante-animale.service';
import { CattleModule } from '../cattle/cattle.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    CattleModule,
  ],
  controllers: [SanteAnimaleController],
  providers: [SanteAnimaleRagService, ChatbotSanteAnimaleService],
  exports: [SanteAnimaleRagService, ChatbotSanteAnimaleService],
})
export class SanteAnimaleModule {}
