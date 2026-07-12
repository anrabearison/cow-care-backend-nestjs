import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthRagService } from './infrastructure/health-rag.service';
import { HealthChatbotService } from './application/health-chatbot.service';
import { HealthSeverityClassifierService } from './application/health-severity-classifier.service';
import { GeminiHealthProviderService } from './infrastructure/gemini-health-provider.service';
import { HEALTH_AI_PROVIDER } from './infrastructure/health-provider.constants';
import { HealthOrchestratorService } from './application/health-orchestrator.service';
import { HealthResponseFormatterService } from './application/health-response-formatter.service';
import { CattleModule } from '../cattle/cattle.module';

@Module({
  imports: [
    ConfigModule,
    CattleModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthRagService,
    HealthSeverityClassifierService,
    HealthResponseFormatterService,
    HealthOrchestratorService,
    {
      provide: HEALTH_AI_PROVIDER,
      useClass: GeminiHealthProviderService,
    },
    HealthChatbotService,
  ],
  exports: [HealthRagService, HealthChatbotService, HealthSeverityClassifierService],
})
export class HealthModule {}
