import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthAiProvider, HealthAiResponse } from './health-provider.interface';

/** Quota journalier gratuit épuisé (HTTP 429 RESOURCE_EXHAUSTED) */
export class GeminiQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiQuotaExceededError';
  }
}

/** Service Gemini temporairement surchargé (HTTP 503 UNAVAILABLE) */
export class GeminiServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiServiceUnavailableError';
  }
}

@Injectable()
export class GeminiHealthProviderService implements HealthAiProvider {
  private readonly logger = new Logger(GeminiHealthProviderService.name);
  private readonly geminiApiKey: string;
  private readonly geminiModel: string;
  private readonly geminiApiUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim() ?? '';
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL')?.trim() ?? 'gemini-flash-latest';
    this.geminiApiUrl = this.configService.get<string>('GEMINI_API_URL')?.trim() ?? 'https://generativelanguage.googleapis.com/v1beta/models';
    this.timeoutMs = parseInt(this.configService.get<string>('GEMINI_TIMEOUT_MS') ?? '30000', 10);
  }

  async generateResponse(prompt: string): Promise<HealthAiResponse> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const endpoint = `${this.geminiApiUrl}/${this.geminiModel}:generateContent?key=${encodeURIComponent(
      this.geminiApiKey,
    )}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8000,
          },
        }),
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = `Gemini API error ${response.status} ${response.statusText}: ${responseText}`;
        this.logger.error(errorMessage);

        if (response.status === 429) {
          throw new GeminiQuotaExceededError(errorMessage);
        }
        if (response.status === 503) {
          throw new GeminiServiceUnavailableError(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      const text = this.extractText(data);

      if (!text) {
        throw new Error(`Invalid response format from Gemini API: ${responseText}`);
      }

      return { content: text, confidence: 0.85 };
    } catch (error) {
      this.logger.error('Gemini request failed', error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractText(data: any): string | null {
    if (!data) {
      return null;
    }

    if (typeof data.output === 'string') {
      return data.output;
    }

    const candidate = Array.isArray(data.candidates) ? data.candidates[0] : undefined;
    if (candidate) {
      if (typeof candidate.output === 'string') {
        return candidate.output;
      }

      // Try Gemini API format: candidate.content.parts[0].text
      const partsText = candidate?.content?.parts?.[0]?.text;
      if (typeof partsText === 'string') {
        return partsText;
      }

      // Try alternative format: candidate.content[0].text
      const contentText = candidate?.content?.[0]?.text;
      if (typeof contentText === 'string') {
        return contentText;
      }
    }

    const topContentText = data?.content?.[0]?.text;
    if (typeof topContentText === 'string') {
      return topContentText;
    }

    return null;
  }
}
