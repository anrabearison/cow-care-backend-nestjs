import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { HealthRagService } from './services/health-rag.service';
import { HealthChatbotService } from './services/health-chatbot.service';
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
  controllers: [HealthController],
  providers: [HealthRagService, HealthChatbotService],
  exports: [HealthRagService, HealthChatbotService],
})
export class HealthModule {}
