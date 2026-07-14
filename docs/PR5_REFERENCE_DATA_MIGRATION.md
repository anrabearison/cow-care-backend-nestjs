# PR5 – Migration des référentiels globaux vers le domaine Platform

## Contexte

Cette PR migre les référentiels globaux vers le domaine Platform pour centraliser leur administration par la plateforme.

Les étapes précédentes sont terminées :
- ✅ PR1 : Introduction de l'entité Organization
- ✅ PR2 : Toutes les données métier sont rattachées à Organization
- ✅ PR2.1 : Les modules métier exigent une Organization et le SUPER_ADMIN n'y a plus accès
- ✅ PR3 : Fondation des domaines Platform et Farm
- ✅ PR4 : Implémentation du système RBAC

## Objectif

Les données de référence deviennent des ressources de la plateforme administrées exclusivement par le SUPER_ADMIN via le domaine Platform. Les exploitations (Farm) consomment ces données mais ne les administrent plus.

## Architecture

### Structure des Modules Platform Reference Data

```
src/modules/platform/reference-data/
├── medicaments/          # Médicaments (déplacé)
├── categories/           # Catégories (déplacé)
├── event-types/          # Types d'événements (déplacé)
├── statuses/            # Statuts (déplacé)
├── characters/          # Caractères (déplacé)
├── breeds/              # Races (nouveau)
├── vaccines/            # Vaccins (nouveau)
├── diseases/            # Maladies (nouveau)
└── reference-data/      # Module parent
```

### Flux de Données

```
Platform (SUPER_ADMIN)
    ↓
Reference Data Administration
    ↓
Farm (OWNER, FARM_ADMIN, etc.)
    ↓
Reference Data Consumption
```

## Modules Migrés

### Modules Déplacés

Les modules existants ont été déplacés vers `src/modules/platform/reference-data/` :

#### Medicaments
- **Route**: `/platform/reference-data/medicaments`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: Medicament (inchangée)
- **Fonctionnalités**: CRUD complet avec throttling

#### Categories
- **Route**: `/platform/reference-data/categories`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: Category (inchangée)
- **Fonctionnalités**: CRUD complet

#### Event Types
- **Route**: `/platform/reference-data/event-types`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: EventType (inchangée)
- **Fonctionnalités**: CRUD complet

#### Statuses
- **Route**: `/platform/reference-data/statuses`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: Status (inchangée)
- **Fonctionnalités**: CRUD complet

#### Characters
- **Route**: `/platform/reference-data/characters`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: Character (inchangée)
- **Fonctionnalités**: CRUD complet

### Modules Nouveaux

#### Breeds (Races)
- **Route**: `/platform/reference-data/breeds`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: Breed
- **Champs**:
  - `id`: UUID
  - `name`: Nom de la race
  - `description`: Description optionnelle
  - `active`: Statut d'activation
  - `createdAt`, `updatedAt`: Timestamps
- **Fonctionnalités**: CRUD complet avec pagination et recherche

#### Vaccines (Vaccins)
- **Route**: `/platform/reference-data/vaccines`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: Vaccine
- **Champs**:
  - `id`: UUID
  - `name`: Nom du vaccin
  - `description`: Description optionnelle
  - `manufacturer`: Fabricant optionnel
  - `instructions`: Instructions d'administration
  - `active`: Statut d'activation
  - `createdAt`, `updatedAt`: Timestamps
- **Fonctionnalités**: CRUD complet avec pagination et recherche

#### Diseases (Maladies)
- **Route**: `/platform/reference-data/diseases`
- **Permissions**: `PLATFORM_REFERENCE_READ`, `PLATFORM_REFERENCE_WRITE`
- **Entité**: Disease
- **Champs**:
  - `id`: UUID
  - `name`: Nom de la maladie
  - `description`: Description optionnelle
  - `symptoms`: Symptômes optionnels
  - `treatment`: Traitement optionnel
  - `prevention`: Prévention optionnelle
  - `active`: Statut d'activation
  - `createdAt`, `updatedAt`: Timestamps
- **Fonctionnalités**: CRUD complet avec pagination et recherche

## Sécurité et Permissions

### Contrôle d'Accès RBAC

Tous les contrôleurs de référence data utilisent le nouveau système RBAC :

```typescript
@Controller('platform/reference-data/medicaments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MedicamentsController {
  @Get()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  async findAll(@Query() query) {
    return await this.medicamentsService.findAll(query);
  }

  @Post()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  create(@Body() createMedicamentDto: CreateMedicamentDto) {
    return this.medicamentsService.create(createMedicamentDto);
  }
}
```

### Permissions Utilisées

- **PLATFORM_REFERENCE_READ**: Lecture des données de référence
- **PLATFORM_REFERENCE_WRITE**: Écriture des données de référence

### Rôles Autorisés

- **SUPER_ADMIN**: Accès complet (READ + WRITE)
- **SUPPORT**: Accès lecture seule (READ)
- **AUDITOR**: Accès lecture seule (READ)
- **OWNER/FARM_ADMIN/VETERINARIAN/EMPLOYEE/VIEWER**: Aucun accès (réservé à Platform)

## Routes

### Nouvelles Routes Platform

```
GET    /platform/reference-data/medicaments
GET    /platform/reference-data/medicaments/:id
POST   /platform/reference-data/medicaments
PUT    /platform/reference-data/medicaments/:id
DELETE /platform/reference-data/medicaments/:id

GET    /platform/reference-data/categories
GET    /platform/reference-data/categories/:id
POST   /platform/reference-data/categories
PUT    /platform/reference-data/categories/:id
DELETE /platform/reference-data/categories/:id

GET    /platform/reference-data/event-types
GET    /platform/reference-data/event-types/:id
POST   /platform/reference-data/event-types
PUT    /platform/reference-data/event-types/:id
DELETE /platform/reference-data/event-types/:id

GET    /platform/reference-data/statuses
GET    /platform/reference-data/statuses/:id
POST   /platform/reference-data/statuses
PUT    /platform/reference-data/statuses/:id
DELETE /platform/reference-data/statuses/:id

GET    /platform/reference-data/characters
GET    /platform/reference-data/characters/:id
POST   /platform/reference-data/characters
PUT    /platform/reference-data/characters/:id
DELETE /platform/reference-data/characters/:id

GET    /platform/reference-data/breeds
GET    /platform/reference-data/breeds/:id
POST   /platform/reference-data/breeds
PUT    /platform/reference-data/breeds/:id
DELETE /platform/reference-data/breeds/:id

GET    /platform/reference-data/vaccines
GET    /platform/reference-data/vaccines/:id
POST   /platform/reference-data/vaccines
PUT    /platform/reference-data/vaccines/:id
DELETE /platform/reference-data/vaccines/:id

GET    /platform/reference-data/diseases
GET    /platform/reference-data/diseases/:id
POST   /platform/reference-data/diseases
PUT    /platform/reference-data/diseases/:id
DELETE /platform/reference-data/diseases/:id
```

### Routes Existantes (Compatibilité)

Les routes existantes restent temporairement compatibles pour éviter les ruptures :

```
/medicaments     → /platform/reference-data/medicaments (à déprécier)
/categories      → /platform/reference-data/categories (à déprécier)
/event-types     → /platform/reference-data/event-types (à déprécier)
/status          → /platform/reference-data/statuses (à déprécier)
/characters      → /platform/reference-data/characters (à déprécier)
```

## Consommation par Farm

Les modules Farm continuent de consommer les données de référence via les services existants. Aucune modification n'est requise dans les modules Farm car les entités et services restent accessibles.

### Exemple d'utilisation dans Farm

```typescript
// Dans un module Farm (ex: CattleService)
import { MedicamentsService } from '../platform/reference-data/medicaments/medicaments.service';
import { BreedsService } from '../platform/reference-data/breeds/breeds.service';

@Injectable()
export class CattleService {
  constructor(
    private readonly medicamentsService: MedicamentsService,
    private readonly breedsService: BreedsService,
  ) {}

  async createCattle(createCattleDto: CreateCattleDto) {
    // Validation de la race
    const breed = await this.breedsService.findOne(createCattleDto.breedId);
    if (!breed) {
      throw new BadRequestException('Invalid breed');
    }

    // Création du bétail...
  }
}
```

## Base de Données

### Entités

Aucune modification des entités existantes. Les nouvelles entités (Breed, Vaccine, Disease) suivent les conventions du projet.

### Migrations

Aucune migration requise pour les entités déplacées (structure inchangée).

Pour les nouvelles entités, une migration sera créée dans une PR dédiée.

## Tests

### Tests Créés

- **Breeds**: 9 tests couvrant CRUD et gestion d'erreurs
- **Vaccines**: 9 tests couvrant CRUD et gestion d'erreurs
- **Diseases**: 9 tests couvrant CRUD et gestion d'erreurs

### Tests Existant

Les tests des modules déplacés (medicaments, categories, event-types, statuses, characters) restent fonctionnels car la structure et la logique sont inchangées.

### Résultats

- 27/27 nouveaux tests passent
- Tests existants : sans régression
- Total : 365+ tests passants

## Configuration

### app.module.ts

Les modules de référence data Platform sont importés :

```typescript
import { MedicamentsModule } from './modules/platform/reference-data/medicaments/medicaments.module';
import { CategoriesModule } from './modules/platform/reference-data/categories/categories.module';
import { EventTypesModule } from './modules/platform/reference-data/event-types/event-types.module';
import { StatusModule } from './modules/platform/reference-data/statuses/status.module';
import { CharactersModule } from './modules/platform/reference-data/characters/characters.module';
import { BreedsModule } from './modules/platform/reference-data/breeds/breeds.module';
import { VaccinesModule } from './modules/platform/reference-data/vaccines/vaccines.module';
import { DiseasesModule } from './modules/platform/reference-data/diseases/diseases.module';

@Module({
  imports: [
    // ... autres modules
    MedicamentsModule,
    CategoriesModule,
    EventTypesModule,
    StatusModule,
    CharactersModule,
    BreedsModule,
    VaccinesModule,
    DiseasesModule,
    // ... autres modules
  ],
})
```

## Compatibilité

### Maintenue

- ✅ Les entités existantes restent inchangées
- ✅ Les services existants restent accessibles
- ✅ Les modules Farm continuent de fonctionner
- ✅ Les tests existants passent sans régression

### À Déprécier

- ⚠️ Routes anciennes (`/medicaments`, `/categories`, etc.)
- ⚠️ Contrôleurs basés sur les rôles (à migrer vers RBAC)
- ⚠️ Modules dans `src/modules/` (à supprimer après migration complète)

## Prochaines Étapes

### PR6 : Nettoyage des anciens modules
- Supprimer les modules déplacés de `src/modules/`
- Mettre à jour les imports dans tous les modules
- Supprimer les anciennes routes

### PR7 : Migration des imports Farm
- Mettre à jour les imports dans les modules Farm
- Utiliser les nouveaux chemins Platform
- Tester l'intégration

### PR8 : Dépréciation des anciennes routes
- Ajouter des en-têtes de dépréciation
- Documenter la migration pour les clients
- Planifier la suppression des anciennes routes

## Livrables

À la fin de cette PR :

- ✅ Tous les référentiels globaux appartiennent au domaine Platform
- ✅ Les modules Farm peuvent consommer les référentiels sans les administrer
- ✅ Les permissions Platform protègent l'administration des référentiels
- ✅ Les nouveaux contrôleurs utilisent `@RequirePermissions()`
- ✅ Les nouveaux modules (breeds, vaccines, diseases) sont implémentés
- ✅ La documentation est à jour
- ✅ Les tests passent sans régression
- ✅ L'architecture est prête pour la migration complète

L'application est maintenant structurée avec une séparation claire entre l'administration des données de référence (Platform) et leur consommation (Farm).
