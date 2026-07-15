import { HealthResponseFormatterService } from './health-response-formatter.service';

describe('HealthResponseFormatterService', () => {
  let service: HealthResponseFormatterService;

  beforeEach(() => {
    service = new HealthResponseFormatterService();
  });

  it('adds the standard sections when the AI response is not already structured', () => {
    const result = service.formatAiResponse('Un diagnostic possible', {
      urgency: 'urgence test',
      observation: 'observation test',
      consultation: 'consultation test',
      confidence: 0.8,
      severity: 'high',
    } as any);

    expect(result).toContain('🚨 URGENCE');
    expect(result).toContain('🔍 OBSERVATION');
    expect(result).toContain('📋 DIAGNOSTIC POSSIBLE');
    expect(result).toContain('👨‍⚕️ CONSULTATION');
  });

  it('builds a fallback response with severity and confidence', () => {
    const result = service.buildFallbackResponse({
      urgency: 'urgence test',
      observation: 'observation test',
      consultation: 'consultation test',
      confidence: 0.7,
      severity: 'medium',
    } as any);

    expect(result.severity).toBe('medium');
    expect(result.confidence).toBe(0.7);
    expect(result.source).toBe('fallback');
  });
});
