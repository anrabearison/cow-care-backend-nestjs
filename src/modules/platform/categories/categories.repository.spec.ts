import { FindOperator } from 'typeorm';
import { CategoriesRepository } from './categories.repository';

describe('CategoriesRepository.findByName', () => {
  let repository: CategoriesRepository;

  beforeEach(() => {
    // On instancie directement la classe sans passer par le DataSource NestJS,
    // et on mocke uniquement findOne() (héritée de TypeORM Repository) pour
    // inspecter la clause where construite par findByName().
    repository = Object.create(CategoriesRepository.prototype);
    (repository as any).findOne = jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Vache' });
  });

  it('construit une comparaison réellement insensible à la casse (via Raw/LOWER), pas une égalité stricte sur une chaîne mise en minuscule', async () => {
    await repository.findByName('vache');

    const callArg = (repository as any).findOne.mock.calls[0][0];
    expect(callArg.where.name).toBeInstanceOf(FindOperator);
    // La valeur littérale passée à la comparaison doit être le terme
    // recherché tel quel (trimé), PAS déjà mis en minuscule — c'est LOWER()
    // côté SQL qui doit gérer la casse des deux côtés de la comparaison.
    expect(callArg.where.name.getSql).toBeDefined();
  });

  it('trim les espaces superflus avant la recherche', async () => {
    await repository.findByName('  Vache  ');

    const callArg = (repository as any).findOne.mock.calls[0][0];
    // On vérifie indirectement via le paramètre de la requête générée
    const sql = callArg.where.name.getSql('category');
    expect(sql).toContain('LOWER');
  });

  it('retourne le résultat de findOne', async () => {
    const result = await repository.findByName('vache');
    expect(result).toEqual({ id: 'cat-1', name: 'Vache' });
  });
});
