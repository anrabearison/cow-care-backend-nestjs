import { FindOperator } from 'typeorm';
import { StatusRepository } from './status.repository';

describe('StatusRepository.findByName', () => {
  let repository: StatusRepository;

  beforeEach(() => {
    repository = Object.create(StatusRepository.prototype);
    (repository as any).findOne = jest.fn().mockResolvedValue({ id: 'status-1', name: 'En bonne santé' });
  });

  it('construit une comparaison réellement insensible à la casse (via Raw/LOWER), pas une égalité stricte sur une chaîne mise en minuscule', async () => {
    await repository.findByName('en bonne santé');

    const callArg = (repository as any).findOne.mock.calls[0][0];
    expect(callArg.where.name).toBeInstanceOf(FindOperator);
    const sql = callArg.where.name.getSql('status');
    expect(sql).toContain('LOWER');
  });

  it('retourne le résultat de findOne', async () => {
    const result = await repository.findByName('en bonne santé');
    expect(result).toEqual({ id: 'status-1', name: 'En bonne santé' });
  });
});
