import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthAiProvider, HealthAiResponse } from './health-provider.interface';

@Injectable()
export class GeminiHealthProviderService implements HealthAiProvider {
  private readonly logger = new Logger(GeminiHealthProviderService.name);
  private readonly geminiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async generateResponse(prompt: string): Promise<HealthAiResponse> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1500,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Invalid response format from Gemini API');
      }

      return { content: text, confidence: 0.85 };
    } catch (error) {
      this.logger.error('Gemini request failed', error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
