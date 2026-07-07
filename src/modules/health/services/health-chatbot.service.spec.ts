import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthChatbotService } from '../application/health-chatbot.service';
import { HealthOrchestratorService } from '../application/health-orchestrator.service';

describe('HealthChatbotService', () => {
  let service: HealthChatbotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthChatbotService,
        {
          provide: HealthOrchestratorService,
          useValue: {
            generateResponse: jest.fn().mockResolvedValue({
              response: '🚨 URGENCE: ...\n\n🔍 OBSERVATION: ...\n\n📋 DIAGNOSTIC POSSIBLE: ...\n\n👨‍⚕️ CONSULTATION: ...',
              source: 'rag',
              severity: 'high',
              confidence: 0.82,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(HealthChatbotService);
  });

  it('returns a structured response with confidence and sections', async () => {
    const response = await service.respond(
      { question: 'Ma vache a de la diarrhée', animalId: 'animal-1' },
      'animal context',
    );

    expect(response.response).toContain('URGENCE');
    expect(response.response).toContain('OBSERVATION');
    expect(response.response).toContain('CONSULTATION');
    expect(response.confidence).toBe(0.82);
    expect(response.severity).toBe('high');
  });
});
