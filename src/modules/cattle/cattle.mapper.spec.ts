import { CattleMapper } from './cattle.mapper';
import { Cattle, Gender, SourceType } from './entities/cattle.entity';

describe('CattleMapper', () => {
  describe('toResponse()', () => {
    it('retourne null si cattle est null', () => {
      expect(CattleMapper.toResponse(null as any)).toBeNull();
    });

    it('mappe correctement un bovin simple (sans relations)', () => {
      const cattle = {
        id: 'c-1',
        name: 'Feno',
        nickname: null,
        gender: Gender.M,
        birthDate: new Date('2024-01-01'),
        sourceType: SourceType.NE_DANS_TROUPEAU,
        sourceMotherId: 'mother-1',
        events: [],
        treatments: [],
        herdBookEntries: [],
      } as unknown as Cattle;

      const result = CattleMapper.toResponse(cattle);

      expect(result).toMatchObject({
        id: 'c-1',
        name: 'Feno',
        gender: Gender.M,
        source: expect.objectContaining({
          type: SourceType.NE_DANS_TROUPEAU,
          motherId: 'mother-1',
        }),
        events: [],
        treatments: [],
        herdBookEntries: [],
      });
    });

    it('sélectionne la bonne entrée herdBook si herdBookId est fourni', () => {
      const cattle = {
        id: 'c-1',
        herdBookEntries: [
          { herdBookId: 'hb-1', category: { id: 'cat-1', name: 'Veau' }, status: { id: 'sta-1', name: 'Actif' } },
          { herdBookId: 'hb-2', category: { id: 'cat-2', name: 'Taureau' }, status: { id: 'sta-2', name: 'Vendu' } },
        ],
      } as unknown as Cattle;

      const result = CattleMapper.toResponse(cattle, 'hb-2');

      expect(result).toMatchObject({
        category: { id: 'cat-2', name: 'Taureau' },
        status: { id: 'sta-2', name: 'Vendu' },
      });
    });

    it('sélectionne la première entrée herdBook si aucun herdBookId fourni', () => {
      const cattle = {
        id: 'c-1',
        herdBookEntries: [
          { herdBookId: 'hb-1', category: { id: 'cat-1', name: 'Veau' }, status: { id: 'sta-1', name: 'Actif' } },
          { herdBookId: 'hb-2', category: { id: 'cat-2', name: 'Taureau' }, status: { id: 'sta-2', name: 'Vendu' } },
        ],
      } as unknown as Cattle;

      const result = CattleMapper.toResponse(cattle);

      expect(result).toMatchObject({
        category: { id: 'cat-1', name: 'Veau' },
        status: { id: 'sta-1', name: 'Actif' },
      });
    });
  });

  describe('toResponseList()', () => {
    it('filtre les éléments null et mappe le tableau', () => {
      const cattleList = [
        { id: 'c-1', events: [], treatments: [], herdBookEntries: [] },
        null,
        { id: 'c-2', events: [], treatments: [], herdBookEntries: [] },
      ] as unknown as Cattle[];

      const result = CattleMapper.toResponseList(cattleList);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('c-1');
      expect(result[1]).toBeNull();
      expect(result[2].id).toBe('c-2');
    });

    it("retourne un tableau vide si l'entrée est vide ou nulle", () => {
      expect(CattleMapper.toResponseList([])).toEqual([]);
      expect(CattleMapper.toResponseList(null as any)).toEqual([]);
    });
  });
});
