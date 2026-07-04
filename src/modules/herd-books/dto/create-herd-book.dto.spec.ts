import { validate } from 'class-validator';
import { CreateHerdBookDto } from './create-herd-book.dto';

describe('CreateHerdBookDto', () => {
  it('rejects missing ownerId on creation', async () => {
    const dto = new CreateHerdBookDto();
    dto.reference = 'HB-2026';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'ownerId')).toBe(true);
  });

  it('accepts a provided ownerId', async () => {
    const dto = new CreateHerdBookDto();
    dto.reference = 'HB-2026';
    dto.ownerId = 'owner-1';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts a year on creation', async () => {
    const dto = new CreateHerdBookDto();
    dto.reference = 'HB-2026';
    dto.ownerId = 'owner-1';
    dto.year = 2026;

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
