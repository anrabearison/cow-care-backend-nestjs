import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuthAuditLog } from '../entities/auth-audit-log.entity';
import { AuthAuditEvent } from '../enums/auth-audit-event.enum';

describe('AuditService', () => {
  let service: AuditService;
  let auditLogRepository: jest.Mocked<Repository<AuthAuditLog>>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuthAuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditLogRepository = module.get(getRepositoryToken(AuthAuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should successfully log an audit event', async () => {
      const options = {
        userId: 'user-123',
        email: 'test@example.com',
        eventType: AuthAuditEvent.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: true,
      };

      const mockLog = { id: 'log-123', ...options, failureReason: null, sessionId: null, createdAt: new Date() } as any;
      auditLogRepository.create.mockReturnValue(mockLog);
      auditLogRepository.save.mockResolvedValue(mockLog);

      await service.logEvent(options);

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          eventType: AuthAuditEvent.LOGIN_SUCCESS,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          success: true,
        })
      );
      expect(auditLogRepository.save).toHaveBeenCalledWith(mockLog);
    });

    it('should handle database errors gracefully', async () => {
      const options = {
        email: 'test@example.com',
        eventType: AuthAuditEvent.LOGIN_FAILED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: false,
        failureReason: 'Invalid password',
      };

      auditLogRepository.create.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Should not throw
      await expect(service.logEvent(options)).resolves.toBeUndefined();
    });

    it('should log event with null userId', async () => {
      const options = {
        email: 'test@example.com',
        eventType: AuthAuditEvent.LOGIN_FAILED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: false,
        failureReason: 'User not found',
      };

      const mockLog = { id: 'log-123', userId: null, ...options, sessionId: null, createdAt: new Date() } as any;
      auditLogRepository.create.mockReturnValue(mockLog);
      auditLogRepository.save.mockResolvedValue(mockLog);

      await service.logEvent(options);

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
        })
      );
    });

    it('should log event with sessionId', async () => {
      const options = {
        userId: 'user-123',
        email: 'test@example.com',
        eventType: AuthAuditEvent.REFRESH_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: true,
        sessionId: 'session-123',
      };

      const mockLog = { id: 'log-123', ...options, failureReason: null, sessionId: 'session-123', createdAt: new Date() } as any;
      auditLogRepository.create.mockReturnValue(mockLog);
      auditLogRepository.save.mockResolvedValue(mockLog);

      await service.logEvent(options);

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
        })
      );
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should detect suspicious activity when threshold is reached', async () => {
      const email = 'test@example.com';
      const ipAddress = '127.0.0.1';

      auditLogRepository.count.mockResolvedValue(10);

      const mockLog = {
        id: 'log-123',
        email,
        eventType: AuthAuditEvent.UNAUTHORIZED_ACCESS,
        success: true,
        failureReason: '10 failed login attempts in 10 minutes',
        userId: null,
        ipAddress: null,
        userAgent: null,
        sessionId: null,
        createdAt: new Date(),
      } as any;
      auditLogRepository.create.mockReturnValue(mockLog);
      auditLogRepository.save.mockResolvedValue(mockLog);

      const result = await service.detectSuspiciousActivity(email, ipAddress, 10, 10);

      expect(result).toBe(true);
      expect(auditLogRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email,
            eventType: AuthAuditEvent.LOGIN_FAILED,
            success: false,
            ipAddress,
          }),
        })
      );
      expect(auditLogRepository.save).toHaveBeenCalled();
    });

    it('should not detect suspicious activity when threshold is not reached', async () => {
      const email = 'test@example.com';
      const ipAddress = '127.0.0.1';

      auditLogRepository.count.mockResolvedValue(5);

      const result = await service.detectSuspiciousActivity(email, ipAddress, 10, 10);

      expect(result).toBe(false);
      expect(auditLogRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const email = 'test@example.com';
      const ipAddress = '127.0.0.1';

      auditLogRepository.count.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await service.detectSuspiciousActivity(email, ipAddress, 10, 10);

      expect(result).toBe(false);
    });

    it('should work with null ipAddress', async () => {
      const email = 'test@example.com';

      auditLogRepository.count.mockResolvedValue(3);

      const result = await service.detectSuspiciousActivity(email, null, 10, 10);

      expect(result).toBe(false);
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return audit logs for a user', async () => {
      const userId = 'user-123';
      const mockLogs = [
        { id: 'log-1', userId, email: 'test@example.com', eventType: AuthAuditEvent.LOGIN_SUCCESS, ipAddress: null, userAgent: null, success: true, failureReason: null, sessionId: null, createdAt: new Date() } as any,
        { id: 'log-2', userId, email: 'test@example.com', eventType: AuthAuditEvent.LOGOUT, ipAddress: null, userAgent: null, success: true, failureReason: null, sessionId: null, createdAt: new Date() } as any,
      ];

      auditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getUserAuditLogs(userId);

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: 50,
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const userId = 'user-123';

      auditLogRepository.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await service.getUserAuditLogs(userId);

      expect(result).toEqual([]);
    });

    it('should respect custom limit', async () => {
      const userId = 'user-123';
      const mockLogs = [{ id: 'log-1', userId, email: 'test@example.com', eventType: AuthAuditEvent.LOGIN_SUCCESS, ipAddress: null, userAgent: null, success: true, failureReason: null, sessionId: null, createdAt: new Date() } as any];

      auditLogRepository.find.mockResolvedValue(mockLogs);

      await service.getUserAuditLogs(userId, 10);

      expect(auditLogRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });

  describe('getIpAuditLogs', () => {
    it('should return audit logs for an IP address', async () => {
      const ipAddress = '127.0.0.1';
      const mockLogs = [
        { id: 'log-1', email: 'test@example.com', ipAddress, eventType: AuthAuditEvent.LOGIN_FAILED, userId: null, userAgent: null, success: false, failureReason: null, sessionId: null, createdAt: new Date() } as any,
        { id: 'log-2', email: 'test2@example.com', ipAddress, eventType: AuthAuditEvent.LOGIN_FAILED, userId: null, userAgent: null, success: false, failureReason: null, sessionId: null, createdAt: new Date() } as any,
      ];

      auditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getIpAuditLogs(ipAddress);

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ipAddress },
          order: { createdAt: 'DESC' },
          take: 50,
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const ipAddress = '127.0.0.1';

      auditLogRepository.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await service.getIpAuditLogs(ipAddress);

      expect(result).toEqual([]);
    });
  });
});
