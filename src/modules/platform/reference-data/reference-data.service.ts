import { Injectable } from '@nestjs/common';

/**
 * Reference Data Service for Platform domain
 * 
 * This module prepares the future location for global reference data:
 * - Medicaments
 * - Categories
 * - Event Types
 * - Breeds
 * - Vaccines
 * - Diseases
 * 
 * These will be migrated in a dedicated PR.
 */
@Injectable()
export class ReferenceDataService {
  async getAllReferenceData() {
    // TODO: Implement actual reference data retrieval
    // This is a placeholder for future implementation
    return {
      medicaments: [],
      categories: [],
      eventTypes: [],
      breeds: [],
      vaccines: [],
      diseases: [],
    };
  }
}
