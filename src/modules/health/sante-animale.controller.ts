import { Controller, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatbotSanteAnimaleService } from './services/chatbot-sante-animale.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { CattleService } from '../cattle/cattle.service';

@Controller('sante-animale')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class SanteAnimaleController {
  constructor(
    private readonly chatbotService: ChatbotSanteAnimaleService,
    private readonly cattleService: CattleService,
  ) {}

  @Post('chat')
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
    const character = animal.character?.name || 'Non défini';
    
    const recentEvents = animal.events
      ?.slice(-3)
      .map((e: any) => `${e.eventType?.name || 'Événement'}: ${e.description || 'N/A'}`)
      .join('; ') || 'Aucun événement récent';

    const recentTreatments = animal.treatments
      ?.slice(-3)
      .map((t: any) => `${t.type}: ${t.medicament?.name || 'Non spécifié'}`)
      .join('; ') || 'Aucun traitement récent';

    return JSON.stringify({
      identite: `${animal.name} (${animal.gender === 'M' ? 'Mâle' : 'Femelle'})`,
      age,
      caractere: character,
      evenementsRecents: recentEvents,
      traitementsRecents: recentTreatments,
      source: animal.sourceType,
    }, null, 2);
  }

  private calculateAge(birthDate: Date): string {
    if (!birthDate) return 'Âge inconnu';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());

    if (ageInMonths < 0) return 'Nouveau-né';
    if (ageInMonths < 12) return `${ageInMonths} mois`;
    
    const years = Math.floor(ageInMonths / 12);
    return `${years} an${years > 1 ? 's' : ''}`;
  }
}
