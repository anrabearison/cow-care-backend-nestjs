import { HealthSeverityClassifierService } from './health-severity-classifier.service';

describe('HealthSeverityClassifierService', () => {
  let service: HealthSeverityClassifierService;

  beforeEach(() => {
    service = new HealthSeverityClassifierService();
  });

  it('classifies critical symptoms as urgent', () => {
    const result = service.classify('Ma vache a des difficultés respiratoires, elle est très faible et ne se tient plus debout');

    expect(result.severity).toBe('critical');
    expect(result.urgency).toContain('urgence');
    expect(result.consultation).toContain('vétérinaire');
  });

  it('classifies moderate symptoms as high priority', () => {
    const result = service.classify('La vache a de la diarrhée abondante et refuse de manger');

    expect(result.severity).toBe('high');
    expect(result.observation).toContain('surveiller');
  });

  it('classifies mild symptoms as low priority', () => {
    const result = service.classify('L\u2019animal a juste un peu de toux sans autre signe');

    expect(result.severity).toBe('low');
    expect(result.urgency).toContain('surveillance');
  });
});
