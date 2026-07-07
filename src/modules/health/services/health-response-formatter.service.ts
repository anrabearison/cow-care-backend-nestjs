import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthResponseFormatterService {
  formatAiResponse(response: string, classification: { urgency: string; observation: string; consultation: string; confidence: number; severity: 'critical' | 'high' | 'medium' | 'low' }): string {
    const normalized = response.trim();

    if (this.hasStructuredSections(normalized)) {
      return normalized;
    }

    return [
      '🚨 URGENCE: ' + classification.urgency.replace('🚨 urgence : ', '').replace('⚠️ urgence : ', '').trim(),
      '🔍 OBSERVATION: ' + classification.observation,
      '📋 DIAGNOSTIC POSSIBLE: ' + normalized,
      '👨‍⚕️ CONSULTATION: ' + classification.consultation.replace('👨‍⚕️ consultation : ', '').trim(),
    ].join('\n\n');
  }

  buildFallbackResponse(classification: { urgency: string; observation: string; consultation: string; confidence: number; severity: 'critical' | 'high' | 'medium' | 'low' }) {
    return {
      response: [
        '🚨 URGENCE: ' + classification.urgency.replace('🚨 urgence : ', '').replace('⚠️ urgence : ', '').trim(),
        '🔍 OBSERVATION: ' + classification.observation,
        '📋 DIAGNOSTIC POSSIBLE: Impossible à déterminer précisément sans le système IA. L’élément observé mérite une attention particulière.',
        '👨‍⚕️ CONSULTATION: ' + classification.consultation.replace('👨‍⚕️ consultation : ', '').trim(),
      ].join('\n\n'),
      source: 'fallback' as const,
      severity: classification.severity,
      confidence: classification.confidence,
    };
  }

  private hasStructuredSections(response: string): boolean {
    return ['🚨 URGENCE', '🔍 OBSERVATION', '📋 DIAGNOSTIC POSSIBLE', '👨‍⚕️ CONSULTATION'].some(section => response.includes(section));
  }
}
