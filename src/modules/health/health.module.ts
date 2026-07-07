import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { HealthRagService } from './services/health-rag.service';
import { HealthChatbotService } from './services/health-chatbot.service';
import { HealthSeverityClassifierService } from './services/health-severity-classifier.service';
import { GeminiHealthProviderService } from './services/gemini-health-provider.service';
import { HEALTH_AI_PROVIDER } from './services/health-provider.constants';
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
  providers: [
    HealthRagService,
    HealthSeverityClassifierService,
    {
      provide: HEALTH_AI_PROVIDER,
      useClass: GeminiHealthProviderService,
    },
    HealthChatbotService,
  ],
  exports: [HealthRagService, HealthChatbotService, HealthSeverityClassifierService],
})
export class HealthModule {}
