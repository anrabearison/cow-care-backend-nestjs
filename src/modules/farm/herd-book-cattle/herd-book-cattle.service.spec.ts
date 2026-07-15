import { HerdBookCattleService } from './herd-book-cattle.service';
import { CattleService } from '../cattle/cattle.service';
import { UserRole } from '../../platform/users/entities/user.entity';

describe('HerdBookCattleService', () => {
  it('creates a cattle record and herd-book registration when a nested cattle payload is provided', async () => {
    const repo = {
      create: jest.fn((data: any) => data),
      save: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 'hbc-1' }),
    };

    const cattleService = {
      create: jest.fn().mockResolvedValue({ id: 'cattle-123' }),
    };

    const service = new HerdBookCattleService(repo as any, cattleService as unknown as CattleService);

    await service.create({
      herdBookId: 'HB-2024-001',
      categoryId: 'CAT003',
      statusId: 'STA001',
      cattle: {
        name: 'Rambonorana',
        gender: 'F',
        birthDate: '2026-02-26',
        character: 'CHR005',
        source: { type: 'ACHETE' },
      },
    } as any, {
      id: 'user-1',
      role: UserRole.OWNER_USER,
      ownerId: 'owner-1',
    } as any);

    expect(cattleService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Rambonorana',
        category: 'CAT003',
      }),
      expect.anything(),
    );
  });
});
