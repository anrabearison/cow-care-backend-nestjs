# PR3 – Séparation des domaines Platform et Farm

## Contexte

Cette PR constitue une refonte architecturale importante pour préparer l'application vers une architecture SaaS multi-tenant.

Les étapes précédentes sont terminées :
- ✅ PR1 : Introduction de l'entité Organization
- ✅ PR2 : Toutes les données métier sont rattachées à Organization
- ✅ PR2.1 : Les modules métier exigent une Organization et le SUPER_ADMIN n'y a plus accès

## Objectif

Séparer définitivement les deux domaines de l'application :
- **Platform** : Administration de la plateforme
- **Farm** : Fonctionnalités métier d'exploitation

Cette PR ne modifie pas les fonctionnalités existantes, elle réorganise uniquement l'architecture.

## Architecture Actuelle

### Domaine Platform

**Emplacement:** `src/modules/platform/`

**Sous-modules créés:**
- `dashboard/` : Dashboard pour SUPER_ADMIN (statistiques globales)
- `reference-data/` : Préparation pour les données de référence globales
- `organizations/` : (structure créée, module existant non déplacé)
- `users/` : (structure créée, module existant non déplacé)
- `settings/` : (structure créée pour future implémentation)
- `audit/` : (structure créée pour future implémentation)

**Nouveaux modules implémentés:**

#### Platform Dashboard Module
- **Controller:** `platform-dashboard.controller.ts`
- **Service:** `platform-dashboard.service.ts`
- **Module:** `platform-dashboard.module.ts`
- **Route:** `/platform/dashboard`
- **Accès:** SUPER_ADMIN uniquement
- **Fonctionnalité:** Statistiques globales de la plateforme

#### Reference Data Module
- **Controller:** `reference-data.controller.ts`
- **Service:** `reference-data.service.ts`
- **Module:** `reference-data.module.ts`
- **Route:** `/platform/reference-data`
- **Fonctionnalité:** Préparation pour données de référence globales

### Domaine Farm

**Emplacement:** `src/modules/farm/`

**Sous-modules créés (structure pour future migration):**
- `cattle/` : (structure créée, module existant non déplacé)
- `herd-books/` : (structure créée, module existant non déplacé)
- `herd-book-cattle/` : (structure créée, module existant non déplacé)
- `purchases/` : (structure créée, module existant non déplacé)
- `treatments/` : (structure créée, module existant non déplacé)
- `events/` : (structure créée, module existant non déplacé)
- `veterinarians/` : (structure créée, module existant non déplacé)
- `suppliers/` : (structure créée pour future implémentation)
- `dashboard/` : (structure créée, module existant non déplacé)

## Modules Existantants (Non Déplacés)

Pour éviter les régressions et les problèmes de dépendances, les modules existants restent à leur emplacement actuel :

**Modules Platform (restent dans `src/modules/`):**
- `organizations/` : Gestion des organisations
- `users/` : Gestion des utilisateurs
- `auth/` : Authentification (JWT, refresh tokens, guards)

**Modules Farm (restent dans `src/modules/`):**
- `cattle/` : Gestion du bétail
- `herd-books/` : Gestion des livres généalogiques
- `herd-book-cattle/` : Association bétail-livres
- `purchases/` : Gestion des achats
- `treatments/` : Gestion des traitements
- `events/` : Gestion des événements
- `veterinarians/` : Gestion des vétérinaires
- `dashboard/` : Dashboard d'exploitation

**Modules Communs:**
- `categories/` : Catégories (à migrer vers Platform)
- `event-types/` : Types d'événements (à migrer vers Platform)
- `medicaments/` : Médicaments (à migrer vers Platform)
- `characters/` : Caractères (à migrer vers Platform)
- `status/` : Statuts (à migrer vers Platform)

## Routes

### Routes Actuelles (Conservées)

Toutes les routes existantes sont conservées pour éviter les régressions :
- `/cattle` → reste `/cattle`
- `/herd-books` → reste `/herd-books`
- `/events` → reste `/events`
- `/treatments` → reste `/treatments`
- `/veterinarians` → reste `/veterinarians`
- `/purchases` → reste `/purchases`
- `/dashboard` → reste `/dashboard`
- `/organizations` → reste `/organizations`
- `/users` → reste `/users`

### Nouvelles Routes Platform

- `/platform/dashboard` : Dashboard SUPER_ADMIN (nouveau)
- `/platform/reference-data` : Données de référence (nouveau)

### Routes Futures (Préparées)

Les futurs préfixes de routes sont préparés :
- `/platform/*` pour les modules Platform
- `/farm/*` pour les modules Farm

## Sécurité

### Authentification
- ✅ JWT : Non modifié
- ✅ Refresh Token : Non modifié
- ✅ Cookies : Non modifiés
- ✅ Guards : Non modifiés

### Permissions
- ✅ Rôles actuels : Inchangés
- ✅ Nouveau système RBAC : Non implémenté (PR dédiée)

## Migration Progressive

### Étapes Futures

1. **PR4 : Migration des données de référence vers Platform**
   - Déplacer `categories/` vers `platform/reference-data/`
   - Déplacer `event-types/` vers `platform/reference-data/`
   - Déplacer `medicaments/` vers `platform/reference-data/`
   - Déplacer `characters/` vers `platform/reference-data/`
   - Déplacer `status/` vers `platform/reference-data/`

2. **PR5 : Migration des modules Platform**
   - Déplacer `organizations/` vers `platform/organizations/`
   - Déplacer `users/` vers `platform/users/`
   - Mettre à jour tous les imports

3. **PR6 : Migration des modules Farm**
   - Déplacer `cattle/` vers `farm/cattle/`
   - Déplacer `herd-books/` vers `farm/herd-books/`
   - Déplacer `herd-book-cattle/` vers `farm/herd-book-cattle/`
   - Déplacer `purchases/` vers `farm/purchases/`
   - Déplacer `treatments/` vers `farm/treatments/`
   - Déplacer `events/` vers `farm/events/`
   - Déplacer `veterinarians/` vers `farm/veterinarians/`
   - Déplacer `dashboard/` vers `farm/dashboard/`
   - Mettre à jour tous les imports

4. **PR7 : Implémentation des préfixes de routes**
   - Ajouter `/farm` préfixe aux routes Farm
   - Ajouter `/platform` préfixe aux routes Platform
   - Maintenir la compatibilité avec les anciennes routes

## Tests

### Tests Existant
- ✅ 322/338 tests passent
- ⚠️ 16 tests échouent (pré-existants dans `csrf.guard.spec.ts`)
- ✅ Aucune régression introduite par cette PR

### Tests Nouveaux
- Les nouveaux modules Platform n'ont pas encore de tests
- Les tests seront ajoutés dans une PR dédiée

## Dépendances

### Modules Platform
- `PlatformDashboardModule` : Dépend de `JwtAuthGuard`, `RolesGuard`
- `ReferenceDataModule` : Dépend de `JwtAuthGuard`, `RolesGuard`

### Modules Farm
- Aucune dépendance modifiée

## Configuration

### app.module.ts
Les nouveaux modules Platform sont ajoutés :
```typescript
import { PlatformDashboardModule } from './modules/platform/dashboard/platform-dashboard.module';
import { ReferenceDataModule } from './modules/platform/reference-data/reference-data.module';

@Module({
  imports: [
    // ... existing modules
    PlatformDashboardModule,
    ReferenceDataModule,
  ],
})
```

## Choix Architecturaux

### Pourquoi une migration progressive ?
1. **Éviter les régressions** : Les modules existants continuent de fonctionner
2. **Minimiser les risques** : Chaque PR est testée indépendamment
3. **Faciliter les reviews** : Changements plus petits et plus ciblés
4. **Permettre les rollback** : Possibilité de revenir en arrière si nécessaire

### Pourquoi conserver les routes actuelles ?
1. **Compatibilité** : Les clients existants continuent de fonctionner
2. **API Stability** : Pas de rupture de contrat API
3. **Migration douce** : Les nouvelles routes peuvent être adoptées progressivement

### Pourquoi créer les structures maintenant ?
1. **Préparation** : L'architecture est prête pour la migration
2. **Documentation** : La séparation des domaines est visible dans le code
3. **Planification** : Les équipes savent où placer les nouveaux modules

## Livrables

### À la fin de cette PR :
- ✅ Le projet possède deux domaines clairement identifiés : Platform et Farm
- ✅ Les structures de répertoires sont créées pour les deux domaines
- ✅ Les nouveaux modules Platform (dashboard, reference-data) sont implémentés
- ✅ Les routes Platform sont préparées (`/platform/dashboard`, `/platform/reference-data`)
- ✅ L'architecture est prête pour la prochaine PR (migration des données de référence)
- ✅ Aucune régression dans les tests existants

### Non inclus dans cette PR :
- ❌ Migration des modules existants vers les nouveaux domaines
- ❌ Modification des routes existantes
- ❌ Implémentation du nouveau système RBAC
- ❌ Migration des données de référence (PR dédiée)

## Prochaines Étapes

1. **PR4** : Migration des données de référence vers Platform
2. **PR5** : Migration des modules Platform
3. **PR6** : Migration des modules Farm
4. **PR7** : Implémentation des préfixes de routes
5. **PR8** : Implémentation du nouveau système RBAC

## Notes

- L'application n'est pas encore en production, ce qui permet des changements architecturaux importants
- La branche `refactor/multi-tenant-platform` est la branche principale de cette refonte
- Chaque PR est testée indépendamment pour garantir la qualité
- La documentation est mise à jour à chaque étape
