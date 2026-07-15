import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthRagService } from '../infrastructure/health-rag.service';
import { HealthSeverityClassifierService } from './health-severity-classifier.service';
import { HealthResponseFormatterService } from './health-response-formatter.service';
import { HealthAiProvider } from '../infrastructure/health-provider.interface';
import { HEALTH_AI_PROVIDER } from '../infrastructure/health-provider.constants';
import { GeminiQuotaExceededError, GeminiServiceUnavailableError } from '../infrastructure/gemini-health-provider.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class HealthOrchestratorService {
  private readonly logger = new Logger(HealthOrchestratorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ragService: HealthRagService,
    private readonly severityClassifier: HealthSeverityClassifierService,
    private readonly responseFormatter: HealthResponseFormatterService,
    @Inject(HEALTH_AI_PROVIDER) private readonly provider: HealthAiProvider,
  ) {}

  async generateResponse(question: string, animalContext: string, history?: any[]) {
    try {
      const chunks = await this.ragService.searchRelevantKnowledge(question, 5);
      const ragContext = this.ragService.formatForPrompt(chunks);
      const prompt = this.buildPrompt(question, animalContext, ragContext, history);
      const classification = this.severityClassifier.classify(question);

      if (!this.configService.get<string>('GEMINI_API_KEY')) {
        return this.responseFormatter.buildFallbackResponse(classification);
      }

      const aiResponse = await this.callWithRetry(prompt);
      return {
        response: this.responseFormatter.formatAiResponse(aiResponse.content, classification),
        source: (chunks.length > 0 ? 'rag' : 'fallback') as 'rag' | 'fallback',
        severity: classification.severity,
        confidence: classification.confidence,
      };
    } catch (error) {
      if (error instanceof GeminiQuotaExceededError) {
        this.logger.warn('Gemini quota journalier épuisé', error.message);
        return {
          response:
            "Le service d'assistance IA a atteint sa limite d'utilisation journalière. " +
            'Veuillez réessayer demain ou contacter directement un vétérinaire.',
          source: 'error' as 'error',
          severity: 'medium' as 'medium',
          confidence: 0,
        };
      }

      if (error instanceof GeminiServiceUnavailableError) {
        this.logger.warn('Service Gemini temporairement surchargé', error.message);
        return {
          response:
            "Le service d'assistance IA est momentanément surchargé. " +
            'Veuillez réessayer dans quelques minutes ou contacter directement un vétérinaire.',
          source: 'error' as 'error',
          severity: 'medium' as 'medium',
          confidence: 0,
        };
      }

      this.logger.error('Health orchestration failed', error);
      return {
        response: 'Une erreur technique est survenue. Veuillez réessayer ou contacter directement un vétérinaire.',
        source: 'error' as 'error',
        severity: 'high' as 'high',
        confidence: 0.2,
      };
    }
  }

  private buildPrompt(question: string, animalContext: string, ragContext: string, history?: any[]): string {
    const systemPrompt = `Tu es un assistant vétérinaire pour l'élevage bovin à Madagascar.
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

    let prompt = `${systemPrompt}\n\n`;
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

  private async callWithRetry(prompt: string, attempts = 3) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.provider.generateResponse(prompt);
      } catch (error) {
        lastError = error;

        // Ne pas retenter si le quota est épuisé : ça ne sert à rien
        if (error instanceof GeminiQuotaExceededError) {
          throw error;
        }

        if (attempt < attempts) {
          this.logger.warn(`AI call failed, retrying (${attempt}/${attempts})`);
          // Petit délai avant le prochain essai pour les erreurs transitoires
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError;
  }
}
