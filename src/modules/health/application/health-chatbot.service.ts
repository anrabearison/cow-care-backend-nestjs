import { Injectable, Logger } from '@nestjs/common';
import { HealthOrchestratorService } from './health-orchestrator.service';
import { ChatRequestDto, ChatResponseDto } from '../dto/chat.dto';

@Injectable()
export class HealthChatbotService {
  private readonly logger = new Logger(HealthChatbotService.name);

  constructor(private readonly orchestrator: HealthOrchestratorService) {}

  async respond(request: ChatRequestDto, animalContext: string): Promise<ChatResponseDto> {
    try {
      return await this.orchestrator.generateResponse(request.question, animalContext, request.history);
    } catch (error) {
      this.logger.error('Error in chatbot response:', error);
      return {
        response: 'Une erreur technique est survenue. Veuillez réessayer ou contacter directement un vétérinaire.',
        source: 'error',
        severity: 'high',
        confidence: 0.2,
      };
    }
  }
}
