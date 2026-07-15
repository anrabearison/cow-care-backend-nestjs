import { Controller, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HealthChatbotService } from './application/health-chatbot.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { CattleService } from '../cattle/cattle.service';

@Controller('farm/health')
@UseGuards(JwtAuthGuard)
export class HealthController {
  constructor(
    private readonly chatbotService: HealthChatbotService,
    private readonly cattleService: CattleService,
  ) {}

  @Post('chat')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requêtes/minute pour le chatbot santé
  async chat(@Body() chatRequest: ChatRequestDto, @Request() req): Promise<ChatResponseDto> {
    try {
      // Verify that the user has access to this animal
      const animal = await this.cattleService.findOne(chatRequest.animalId, req.user);
      
      if (!animal) {
        throw new HttpException('Animal not found or access denied', HttpStatus.FORBIDDEN);
      }

      // Build animal context
      const animalContext = this.buildAnimalContext(animal);

      // Get chatbot response
      const response = await this.chatbotService.respond(chatRequest, animalContext);

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'An error occurred while processing your request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildAnimalContext(animal: any): string {
    const age = this.calculateAge(animal.birthDate);
    const character = animal.character?.name || 'Unknown';
    
    const recentEvents = animal.events
      ?.slice(-3)
      .map((e: any) => `${e.eventType?.name || 'Event'}: ${e.description || 'N/A'}`)
      .join('; ') || 'No recent events';

    const recentTreatments = animal.treatments
      ?.slice(-3)
      .map((t: any) => `${t.type}: ${t.medicament?.name || 'Not specified'}`)
      .join('; ') || 'No recent treatments';

    return JSON.stringify({
      identity: `${animal.name} (${animal.gender === 'M' ? 'Male' : 'Female'})`,
      age,
      character,
      recentEvents,
      recentTreatments,
      source: animal.sourceType,
    }, null, 2);
  }

  private calculateAge(birthDate: Date): string {
    if (!birthDate) return 'Age unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());

    if (ageInMonths < 0) return 'Newborn';
    if (ageInMonths < 12) return `${ageInMonths} months`;
    
    const years = Math.floor(ageInMonths / 12);
    return `${years} year${years > 1 ? 's' : ''}`;
  }
}
