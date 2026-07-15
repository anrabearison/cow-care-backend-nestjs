import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthOrchestratorService } from './health-orchestrator.service';
import { HealthRagService } from '../infrastructure/health-rag.service';
import { HealthSeverityClassifierService } from './health-severity-classifier.service';
import { HealthResponseFormatterService } from './health-response-formatter.service';
import { HEALTH_AI_PROVIDER } from '../infrastructure/health-provider.constants';
import { GeminiQuotaExceededError } from '../infrastructure/gemini-health-provider.service';

describe('HealthOrchestratorService', () => {
  let service: HealthOrchestratorService;
  let provider: { generateResponse: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthOrchestratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-key'),
          },
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
              urgency: '⚠️ urgence : contactez un professionnel',
              observation: "observer l'animal",
              consultation: '👨‍⚕️ consultation : contactez un vétérinaire',
              confidence: 0.8,
            }),
          },
        },
        {
          provide: HealthResponseFormatterService,
          useValue: {
            formatAiResponse: jest.fn().mockImplementation((content: string) => content),
            buildFallbackResponse: jest.fn().mockReturnValue({
              response: 'réponse de secours',
              source: 'fallback',
              severity: 'high',
              confidence: 0.8,
            }),
          },
        },
        {
          provide: HEALTH_AI_PROVIDER,
          useValue: {
            generateResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(HealthOrchestratorService);
    provider = module.get(HEALTH_AI_PROVIDER);
  });

  it('returns an explicit service-unavailable message when the AI provider fails', async () => {
    provider.generateResponse.mockRejectedValue(new GeminiQuotaExceededError('Quota exceeded'));

    const response = await service.generateResponse('Ma vache a de la fièvre', 'animal context');

    expect(response.response).toContain("service d'assistance IA");
    expect(response.response).toContain("limite d'utilisation journalière");
    expect(response.response).toContain('vétérinaire');
    expect(response.source).toBe('error');
  });

  it('returns a friendly prompt for simple greetings instead of a medical fallback', async () => {
    provider.generateResponse.mockResolvedValue({ content: 'Bonjour ! Comment puis-je vous aider pour la santé de vos bovins ?' });

    const response = await service.generateResponse('bonjour', 'animal context');

    expect(response.response).toContain('Bonjour');
    expect(response.response).toContain('santé de vos bovins');
    expect(response.source).toBe('fallback');
    expect(response.severity).toBe('high');
  });
});
