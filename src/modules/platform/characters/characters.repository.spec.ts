import { FindOperator } from 'typeorm';
import { CharactersRepository } from './characters.repository';

describe('CharactersRepository.findByName', () => {
  let repository: CharactersRepository;

  beforeEach(() => {
    repository = Object.create(CharactersRepository.prototype);
    (repository as any).findOne = jest.fn().mockResolvedValue({ id: 'char-1', name: 'Calme' });
  });

  it('construit une comparaison réellement insensible à la casse (via Raw/LOWER), pas une égalité stricte sur une chaîne mise en minuscule', async () => {
    await repository.findByName('calme');

    const callArg = (repository as any).findOne.mock.calls[0][0];
    expect(callArg.where.name).toBeInstanceOf(FindOperator);
    const sql = callArg.where.name.getSql('character');
    expect(sql).toContain('LOWER');
  });

  it('retourne le résultat de findOne', async () => {
    const result = await repository.findByName('calme');
    expect(result).toEqual({ id: 'char-1', name: 'Calme' });
  });
});
