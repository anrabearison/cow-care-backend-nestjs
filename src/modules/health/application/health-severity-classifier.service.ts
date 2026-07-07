import { Injectable } from '@nestjs/common';

export interface SeverityClassification {
  severity: 'critical' | 'high' | 'medium' | 'low';
  urgency: string;
  observation: string;
  consultation: string;
  confidence: number;
}

@Injectable()
export class HealthSeverityClassifierService {
  classify(text: string): SeverityClassification {
    const normalized = text.toLowerCase();

    const criticalKeywords = [
      'difficultés respiratoires',
      'respire difficilement',
      'ne se tient plus',
      'ne peut plus se lever',
      'prostration',
      'faible',
      'collapse',
      'tremblements',
      'convulsions',
      'vomissements abondants',
    ];

    const highKeywords = [
      'diarrhée',
      'fièvre',
      'refuse de manger',
      'bave',
      'toux forte',
      'mange plus',
      'abattement',
      'boit peu',
    ];

    const mediumKeywords = [
      'toux',
      'écoulement',
      'boit moins',
      'se gratte',
      'inflammation',
    ];

    const isCritical = criticalKeywords.some(keyword => normalized.includes(keyword));
    const isHigh = highKeywords.some(keyword => normalized.includes(keyword));
    const isMedium = mediumKeywords.some(keyword => normalized.includes(keyword));
    const isLightSymptom = normalized.includes('un peu') || normalized.includes('juste') || normalized.includes('sans autre signe') || normalized.includes('légère');

    if (isCritical) {
      return {
        severity: 'critical',
        urgency: '🚨 urgence : consultez un vétérinaire immédiatement ou un agent sanitaire, car la situation peut mettre en jeu la vie de l’animal.',
        observation: 'surveiller la respiration, la température, l’état de conscience et l’absence de boisson.',
        consultation: '👨‍⚕️ consultation : contactez un vétérinaire dès que possible.',
        confidence: 0.94,
      };
    }

    if (isHigh) {
      return {
        severity: 'high',
        urgency: '⚠️ urgence : prenez rapidement contact avec un professionnel pour éviter une aggravation.',
        observation: 'surveiller l’appétit, la boisson, la température et l’évolution des signes pendant 24 heures.',
        consultation: '👨‍⚕️ consultation : rendez-vous chez un vétérinaire ou un technicien d’élevage.',
        confidence: 0.84,
      };
    }

    if (isMedium && !isLightSymptom) {
      return {
        severity: 'medium',
        urgency: '🟡 surveillance : vérifiez l’évolution des symptômes et agissez si ils s’aggravent.',
        observation: 'observer le comportement, l’appétit et l’état général de l’animal pendant 24 à 48 heures.',
        consultation: '👨‍⚕️ consultation : consultez un vétérinaire si le signe persiste ou s’aggrave.',
        confidence: 0.74,
      };
    }

    return {
      severity: 'low',
      urgency: '🟢 surveillance : le cas semble bénin, mais une observation régulière reste nécessaire.',
      observation: 'surveiller régulièrement l’animal et noter tout changement important.',
      consultation: '👨‍⚕️ consultation : contactez un professionnel si le problème persiste ou si l’état se dégrade.',
      confidence: 0.6,
    };
  }
}
