/**
 * Authentication audit event types
 * 
 * This enum defines all possible security-related events that should be logged
 * for audit purposes. Each event type provides visibility into authentication
 * activities and potential security threats.
 */
export enum AuthAuditEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  GOOGLE_LOGIN_SUCCESS = 'GOOGLE_LOGIN_SUCCESS',
  GOOGLE_LOGIN_FAILED = 'GOOGLE_LOGIN_FAILED',
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  REFRESH_FAILED = 'REFRESH_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_REVOKED = 'SESSION_REVOKED',
  ALL_SESSIONS_REVOKED = 'ALL_SESSIONS_REVOKED',
  REPLAY_ATTACK = 'REPLAY_ATTACK',
  CSRF_FAILURE = 'CSRF_FAILURE',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}
