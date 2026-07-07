import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthChatbotService } from './health-chatbot.service';
import { HealthRagService } from './health-rag.service';
import { HealthSeverityClassifierService } from './health-severity-classifier.service';
import { HEALTH_AI_PROVIDER } from './health-provider.constants';

describe('HealthChatbotService', () => {
  let service: HealthChatbotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthChatbotService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-key') },
        },
        {
          provide: HealthRagService,
          useValue: {
            searchRelevantKnowledge: jest.fn().mockResolvedValue([]),
            formatForPrompt: jest.fn().mockReturnValue(''),
          },
        },
        {
          provide: HealthSeverityClassifierService,
          useValue: {
            classify: jest.fn().mockReturnValue({
              severity: 'high',
              urgency: 'Consultez un vétérinaire rapidement',
              observation: 'Surveillez la température et l’appétit',
              consultation: 'Contactez un vétérinaire',
              confidence: 0.82,
            }),
          },
        },
        {
          provide: HEALTH_AI_PROVIDER,
          useValue: {
            generateResponse: jest.fn().mockResolvedValue({ content: 'Réponse structurée de test', confidence: 0.82 }),
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
