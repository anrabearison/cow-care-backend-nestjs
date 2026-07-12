import { BadRequestException } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';
import { CreateInvitationDto } from '../dto/invitation.dto';
import { InvitationService } from './invitation.service';

describe('InvitationService', () => {
  let service: InvitationService;
  let invitationsRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let emailService: {
    sendInvitationEmail: jest.Mock;
  };

  beforeEach(() => {
    invitationsRepository = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn(async (invitation: any) => ({ ...invitation, id: 'invitation-id' })),
    };

    emailService = {
      sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = new InvitationService(
      invitationsRepository as any,
      emailService as any,
    );
  });

  describe('createInvitation()', () => {
    it('should create a new invitation when none already exists', async () => {
      invitationsRepository.findOne.mockResolvedValue(null);

      const dto: CreateInvitationDto = {
        email: 'test@example.com',
        role: UserRole.OWNER_USER,
        ownerId: 'owner-1',
      };

      const result = await service.createInvitation(dto);

      expect(invitationsRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', usedAt: null },
        order: { createdAt: 'DESC' },
      });
      expect(invitationsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          role: UserRole.OWNER_USER,
          ownerId: 'owner-1',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
      expect(invitationsRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        email: 'test@example.com',
        role: UserRole.OWNER_USER,
        ownerId: 'owner-1',
      });
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when an unexpired invitation already exists', async () => {
      invitationsRepository.findOne.mockResolvedValue({
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        usedAt: null,
      });

      const dto: CreateInvitationDto = {
        email: 'test@example.com',
        role: UserRole.OWNER_USER,
      };

      await expect(service.createInvitation(dto)).rejects.toThrow(BadRequestException);
      await expect(service.createInvitation(dto)).rejects.toThrow(
        'Une invitation existe déjà pour cet email et n\'est pas encore expirée',
      );
    });
  });
});
