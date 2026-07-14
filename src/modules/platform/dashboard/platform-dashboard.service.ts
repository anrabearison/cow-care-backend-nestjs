import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformDashboardService {
  /**
   * Get platform-wide statistics for SUPER_ADMIN
   * This prepares the future statistics:
   * - number of organizations
   * - number of users
   * - number of subscriptions
   * - number of active farms
   * - global audit
   */
  async getPlatformStats() {
    // TODO: Implement actual statistics calculation
    // This is a placeholder for future implementation
    return {
      organizationsCount: 0,
      usersCount: 0,
      subscriptionsCount: 0,
      activeFarmsCount: 0,
      auditLog: [],
    };
  }
}
