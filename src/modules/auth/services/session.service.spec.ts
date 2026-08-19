import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SessionService } from './session.service';
import { RefreshSession } from '../entities/refresh-session.entity';
import { AuditService } from './audit.service';
import { User, UserRole } from '../../platform/users/entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    role: UserRole.OWNER_USER,
    ownerId: 'owner-1',
    isActive: true,
    ...overrides,
  } as User);

describe('SessionService', () => {
    let service: SessionService;
    let refreshSessionRepo: any;
    let jwtService: any;
    let auditService: any;

    beforeEach(async () => {
        refreshSessionRepo = {
            create: jest.fn((data) => ({ ...data })),
            save: jest.fn(async (entity) => entity),
            update: jest.fn().mockResolvedValue(undefined),
            findOne: jest.fn(),
            find: jest.fn(),
        };

        jwtService = {
            sign: jest.fn().mockReturnValue('mocked-token'),
            verify: jest.fn(),
        };

        auditService = {
            logEvent: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                { provide: getRepositoryToken(RefreshSession), useValue: refreshSessionRepo },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('mock-secret') } },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
    });

    describe('generateTokens()', () => {
        it('should generate access and refresh tokens and create new session', async () => {
            const user = makeUser();
            const result = await service.generateTokens(user);

            expect(result).toEqual({ accessToken: 'mocked-token', refreshToken: 'mocked-token' });
            expect(refreshSessionRepo.create).toHaveBeenCalled();
            expect(refreshSessionRepo.save).toHaveBeenCalled();
        });
    });

    describe('getSessionIdFromToken()', () => {
        it('should return null if no token provided', () => {
            expect(service.getSessionIdFromToken(undefined)).toBeNull();
        });

        it('should decode session ID from valid token', () => {
            jwtService.verify.mockReturnValue({ sessionId: 'session-123' });
            expect(service.getSessionIdFromToken('valid-token')).toBe('session-123');
        });

        it('should return null if verification fails', () => {
            jwtService.verify.mockImplementation(() => { throw new Error('Invalid'); });
            expect(service.getSessionIdFromToken('invalid-token')).toBeNull();
        });
    });

    describe('logout()', () => {
        it('should be idempotent if token is undefined', async () => {
            await service.logout(undefined);
            expect(refreshSessionRepo.findOne).not.toHaveBeenCalled();
        });

        it('should revoke active session if matching token provided', async () => {
            jwtService.verify.mockReturnValue({ sessionId: 'session-123' });
            const hashed = (service as any).hashString('valid-token');
            const session = { id: 'session-123', refreshTokenHash: hashed, revokedAt: null, user: makeUser() };

            refreshSessionRepo.findOne.mockResolvedValue(session);
            await service.logout('valid-token');

            expect(session.revokedAt).toBeInstanceOf(Date);
            expect(refreshSessionRepo.save).toHaveBeenCalledWith(session);
        });
    });

    describe('deleteSession()', () => {
        it('should throw NotFoundException if session does not exist', async () => {
            refreshSessionRepo.findOne.mockResolvedValue(null);
            await expect(service.deleteSession('user-1', 'invalid-session')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if session belongs to another user', async () => {
            refreshSessionRepo.findOne.mockResolvedValue({ id: 'session-1', userId: 'user-2' });
            await expect(service.deleteSession('user-1', 'session-1')).rejects.toThrow(ForbiddenException);
        });

        it('should revoke session if user matches', async () => {
            const session = { id: 'session-1', userId: 'user-1', revokedAt: null, user: makeUser() };
            refreshSessionRepo.findOne.mockResolvedValue(session);

            await service.deleteSession('user-1', 'session-1');
            expect(session.revokedAt).toBeInstanceOf(Date);
            expect(refreshSessionRepo.save).toHaveBeenCalledWith(session);
        });
    });
});
