import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthRagService } from './health-rag.service';
import { HealthSeverityClassifierService } from './health-severity-classifier.service';
import { HealthAiProvider } from './health-provider.interface';
import { ChatRequestDto, ChatResponseDto } from '../dto/chat.dto';
import { HEALTH_AI_PROVIDER } from './health-provider.constants';

@Injectable()
export class HealthChatbotService {
  private readonly logger = new Logger(HealthChatbotService.name);

  private readonly systemPrompt = `Tu es un assistant vétérinaire pour l'élevage bovin à Madagascar.
Ta mission est d'aider les éleveurs à comprendre les symptômes de leurs animaux.

RÈGLES STRICTES:
1. NE JAMAIS prescrire de médicament ou de dosage
2. TOUJOURS recommander de consulter un professionnel (vétérinaire, agent sanitaire, technicien)
3. Si les symptômes évoquent une urgence vitale, le signaler en PREMIER avec 🚨 URGENCE
4. Réponse structurée en 4 parties: 🚨 URGENCE / 🔍 OBSERVATION / 📋 DIAGNOSTIC POSSIBLE / 👨‍⚕️ CONSULTATION
5. Parler simplement, adapté au contexte rural malgache
6. Si tu ne trouves pas d'information pertinente, l'admettre honnêtement

FORMAT DE RÉPONSE:
🚨 URGENCE: [si applicable]
🔍 OBSERVATION: [ce que l'éleveur doit surveiller]
📋 DIAGNOSTIC POSSIBLE: [explication simple]
👨‍⚕️ CONSULTATION: [type de professionnel à contacter]`;

  constructor(
    private configService: ConfigService,
    private ragService: HealthRagService,
    private severityClassifier: HealthSeverityClassifierService,
    @Inject(HEALTH_AI_PROVIDER) private readonly provider: HealthAiProvider,
  ) {
    if (!this.configService.get<string>('GEMINI_API_KEY')) {
      this.logger.warn('Gemini API key not configured. Chatbot will use fallback responses.');
    }
  }

  async respond(request: ChatRequestDto, animalContext: string): Promise<ChatResponseDto> {
    try {
      const chunks = await this.ragService.searchRelevantKnowledge(request.question, 5);
      const ragContext = this.ragService.formatForPrompt(chunks);
      const prompt = this.buildPrompt(request.question, animalContext, ragContext, request.history);

      const classification = this.severityClassifier.classify(request.question);

      if (!this.configService.get<string>('GEMINI_API_KEY')) {
        return this.getFallbackResponse(classification);
      }

      const response = await this.callWithRetry(prompt);
      return {
        response: this.enrichResponse(response, classification),
        source: chunks.length > 0 ? 'rag' : 'fallback',
        severity: classification.severity,
        confidence: classification.confidence,
      };
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

  private buildPrompt(
    question: string,
    animalContext: string,
    ragContext: string,
    history?: any[],
  ): string {
    let prompt = `${this.systemPrompt}\n\n`;

    prompt += `CONTEXTE DE L'ANIMAL:\n${animalContext}\n\n`;

    if (ragContext && ragContext !== 'Aucune information pertinente trouvée dans la base de connaissances.') {
      prompt += `INFORMATIONS VÉTÉRINAIRES PERTINENTES:\n${ragContext}\n\n`;
    }

    if (history && history.length > 0) {
      prompt += `HISTORIQUE DE LA CONVERSATION:\n`;
      history.forEach((msg) => {
        const role = msg.role === 'user' ? 'Éleveur' : 'Assistant';
        prompt += `${role}: ${msg.parts[0].text}\n`;
      });
      prompt += '\n';
    }

    prompt += `QUESTION ACTUELLE:\n${question}`;

    return prompt;
  }

  private async callWithRetry(prompt: string, attempts = 3): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const aiResponse = await this.provider.generateResponse(prompt);
        return aiResponse.content;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          this.logger.warn(`AI call failed, retrying (${attempt}/${attempts})`);
          continue;
        }
      }
    }

    throw lastError;
  }

  private enrichResponse(response: string, classification: { urgency: string; observation: string; consultation: string; confidence: number; severity: 'critical' | 'high' | 'medium' | 'low' }): string {
    const normalized = response.trim();

    if (normalized.includes('🚨 URGENCE') || normalized.includes('🔍 OBSERVATION') || normalized.includes('📋 DIAGNOSTIC POSSIBLE') || normalized.includes('👨‍⚕️ CONSULTATION')) {
      return normalized;
    }

    return [
      '🚨 URGENCE: ' + classification.urgency.replace('🚨 URGENCE : ', '').trim(),
      '🔍 OBSERVATION: ' + classification.observation,
      '📋 DIAGNOSTIC POSSIBLE: ' + normalized,
      '👨‍⚕️ CONSULTATION: ' + classification.consultation.replace('👨‍⚕️ CONSULTATION : ', '').trim(),
    ].join('\n\n');
  }

  private getFallbackResponse(classification: { urgency: string; observation: string; consultation: string; confidence: number; severity: 'critical' | 'high' | 'medium' | 'low' }): ChatResponseDto {
    return {
      response: [
        '🚨 URGENCE: ' + classification.urgency.replace('🚨 URGENCE : ', '').trim(),
        '🔍 OBSERVATION: ' + classification.observation,
        '📋 DIAGNOSTIC POSSIBLE: Impossible à déterminer précisément sans le système IA. L’élément observé mérite une attention particulière.',
        '👨‍⚕️ CONSULTATION: ' + classification.consultation.replace('👨‍⚕️ CONSULTATION : ', '').trim(),
      ].join('\n\n'),
      source: 'fallback',
      severity: 'high',
      confidence: classification.confidence,
    };
  }
}
