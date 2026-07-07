import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthRagService } from './health-rag.service';
import { ChatRequestDto, ChatResponseDto } from '../dto/chat.dto';

@Injectable()
export class HealthChatbotService {
  private readonly logger = new Logger(HealthChatbotService.name);
  private readonly geminiApiKey: string;
  private readonly systemPrompt = `Tu es un assistant vétérinaire pour l'élevage bovin à Madagascar.
Ta mission est d'aider les éleveurs à comprendre les symptômes de leurs animaux.

RÈGLES STRICTES:
1. NE JAMAIS prescrire de médicament ou de dosage
2. TOUJOURS recommander de consulter un professionnel (vétérinaire, agent sanitaire, technicien)
3. Si les symptômes évoquent une urgence vitale, le signaler en PREMIER avec 🚨 URGENCE
4. Réponse structurée en 3 parties: 📋 DIAGNOSTIC POSSIBLE / ⚠️ PRÉCAUTIONS / 👨‍⚕️ CONSULTATION
5. Parler simplement, adapté au contexte rural malgache
6. Si tu ne trouves pas d'information pertinente, l'admettre honnêtement

FORMAT DE RÉPONSE:
🚨 URGENCE: [si applicable]
📋 DIAGNOSTIC POSSIBLE: [explication simple]
⚠️ PRÉCAUTIONS: [ce que l'éleveur peut faire]
👨‍⚕️ CONSULTATION: [type de professionnel à contacter]`;

  constructor(
    private configService: ConfigService,
    private ragService: HealthRagService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!this.geminiApiKey) {
      this.logger.warn('Gemini API key not configured. Chatbot will use fallback responses.');
    }
  }

  async respond(request: ChatRequestDto, animalContext: string): Promise<ChatResponseDto> {
    try {
      // Search for relevant knowledge
      const chunks = await this.ragService.searchRelevantKnowledge(request.question, 5);
      const ragContext = this.ragService.formatForPrompt(chunks);

      // Build the prompt
      const prompt = this.buildPrompt(request.question, animalContext, ragContext, request.history);

      // Call Gemini API
      if (!this.geminiApiKey) {
        return this.getFallbackResponse(request.question);
      }

      const response = await this.callGemini(prompt);
      return {
        response,
        source: chunks.length > 0 ? 'rag' : 'fallback',
      };
    } catch (error) {
      this.logger.error('Error in chatbot response:', error);
      return {
        response: 'Une erreur technique est survenue. Veuillez réessayer ou contacter directement un vétérinaire.',
        source: 'error',
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
      history.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'Éleveur' : 'Assistant';
        prompt += `${role}: ${msg.parts[0].text}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `QUESTION ACTUELLE:\n${question}`;
    
    return prompt;
  }

  private async callGemini(prompt: string): Promise<string> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1500,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  private getFallbackResponse(question: string): ChatResponseDto {
    return {
      response: `Je suis désolé, mais je ne peux pas répondre à votre question pour le moment. Le système de consultation vétérinaire IA n'est pas complètement configuré.\n\n📋 DIAGNOSTIC POSSIBLE: Impossible à déterminer sans le système IA\n⚠️ PRÉCAUTIONS: Surveillez l'état de votre animal de près\n👨‍⚕️ CONSULTATION: Contactez un vétérinaire, un agent sanitaire ou un technicien d'élevage pour un diagnostic précis.`,
      source: 'fallback',
    };
  }
}
