import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthChatbotService } from './services/health-chatbot.service';
import { CattleService } from '../cattle/cattle.service';

describe('HealthController', () => {
  let controller: HealthController;
  let chatbotService: { respond: jest.Mock };
  let cattleService: { findOne: jest.Mock };

  beforeEach(() => {
    chatbotService = { respond: jest.fn() };
    cattleService = { findOne: jest.fn() };

    controller = new HealthController(chatbotService as any, cattleService as any);
  });

  it('returns structured response for an authorized animal', async () => {
    cattleService.findOne.mockResolvedValue({
      name: 'Mina',
      gender: 'F',
      birthDate: new Date('2023-01-01'),
      character: { name: 'Calme' },
      events: [],
      treatments: [],
      sourceType: 'NE_DANS_TROUPEAU',
    });

    chatbotService.respond.mockResolvedValue({
      response: '🚨 URGENCE: ...\n\n🔍 OBSERVATION: ...',
      source: 'rag',
      severity: 'high',
      confidence: 0.82,
    });

    const result = await controller.chat({ question: 'Ma vache a de la diarrhée', animalId: 'animal-1' } as any, { user: { id: 'user-1' } });

    expect(result.severity).toBe('high');
    expect(result.confidence).toBe(0.82);
    expect(chatbotService.respond).toHaveBeenCalled();
  });

  it('blocks access when the animal is not allowed', async () => {
    cattleService.findOne.mockResolvedValue(null);

    await expect(controller.chat({ question: 'test', animalId: 'animal-1' } as any, { user: { id: 'user-1' } })).rejects.toThrow(HttpException);
    await expect(controller.chat({ question: 'test', animalId: 'animal-1' } as any, { user: { id: 'user-1' } })).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });
});
