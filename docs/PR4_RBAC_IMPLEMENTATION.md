# PR4 – Implémentation d'un système RBAC (Role-Based Access Control) extensible

## Contexte

Cette PR introduit un nouveau système d'autorisation basé sur les permissions (RBAC) pour remplacer progressivement les contrôles d'accès basés uniquement sur les rôles.

Les étapes précédentes sont terminées :
- ✅ PR1 : Introduction de l'entité Organization
- ✅ PR2 : Toutes les données métier sont rattachées à Organization
- ✅ PR2.1 : Les modules métier exigent une Organization et le SUPER_ADMIN n'y a plus accès
- ✅ PR3 : Fondation des domaines Platform et Farm

## Objectif

Remplacer progressivement les contrôles d'accès basés sur les rôles par un système de permissions (RBAC) tout en maintenant la compatibilité avec le système actuel.

## Architecture RBAC

### Entités

#### Permission
- **id**: UUID (primary key)
- **code**: Code unique de la permission (ex: `FARM_CATTLE_READ`)
- **name**: Nom lisible de la permission
- **description**: Description optionnelle
- **domain**: Domaine de la permission (`PLATFORM` ou `FARM`)
- **active**: Statut d'activation
- **created_at**: Date de création
- **updated_at**: Date de mise à jour

#### Role
- **id**: UUID (primary key)
- **code**: Code unique du rôle (ex: `OWNER`, `SUPER_ADMIN`)
- **name**: Nom lisible du rôle
- **description**: Description optionnelle
- **domain**: Domaine du rôle (`PLATFORM` ou `FARM`)
- **active**: Statut d'activation
- **created_at**: Date de création
- **updated_at**: Date de mise à jour

#### RolePermission
- **id**: UUID (primary key)
- **role_id**: Clé étrangère vers Role
- **permission_id**: Clé étrangère vers Permission
- **role**: Relation vers Role
- **permission**: Relation vers Permission

#### UserRole
- **id**: UUID (primary key)
- **user_id**: Clé étrangère vers User
- **role_id**: Clé étrangère vers Role
- **role**: Relation vers Role
- **created_at**: Date de création

### Permissions

#### Platform Permissions

**Gestion des utilisateurs:**
- `PLATFORM_USERS_READ` : Lire les utilisateurs plateforme
- `PLATFORM_USERS_CREATE` : Créer des utilisateurs plateforme
- `PLATFORM_USERS_UPDATE` : Modifier des utilisateurs plateforme
- `PLATFORM_USERS_DELETE` : Supprimer des utilisateurs plateforme

**Gestion des organisations:**
- `PLATFORM_ORGANIZATIONS_READ` : Lire les organisations
- `PLATFORM_ORGANIZATIONS_CREATE` : Créer des organisations
- `PLATFORM_ORGANIZATIONS_UPDATE` : Modifier des organisations
- `PLATFORM_ORGANIZATIONS_DELETE` : Supprimer des organisations

**Paramètres:**
- `PLATFORM_SETTINGS_READ` : Lire les paramètres plateforme
- `PLATFORM_SETTINGS_UPDATE` : Modifier les paramètres plateforme

**Audit:**
- `PLATFORM_AUDIT_READ` : Lire les logs d'audit

**Données de référence:**
- `PLATFORM_REFERENCE_READ` : Lire les données de référence
- `PLATFORM_REFERENCE_WRITE` : Modifier les données de référence

**Dashboard:**
- `PLATFORM_DASHBOARD_READ` : Lire le dashboard plateforme

#### Farm Permissions

**Dashboard:**
- `FARM_DASHBOARD_READ` : Lire le dashboard exploitation

**Gestion du bétail:**
- `FARM_CATTLE_READ` : Lire le bétail
- `FARM_CATTLE_CREATE` : Créer du bétail
- `FARM_CATTLE_UPDATE` : Modifier du bétail
- `FARM_CATTLE_DELETE` : Supprimer du bétail

**Gestion des événements:**
- `FARM_EVENTS_READ` : Lire les événements
- `FARM_EVENTS_CREATE` : Créer des événements
- `FARM_EVENTS_UPDATE` : Modifier des événements
- `FARM_EVENTS_DELETE` : Supprimer des événements

**Gestion des traitements:**
- `FARM_TREATMENTS_READ` : Lire les traitements
- `FARM_TREATMENTS_CREATE` : Créer des traitements
- `FARM_TREATMENTS_UPDATE` : Modifier des traitements
- `FARM_TREATMENTS_DELETE` : Supprimer des traitements

**Gestion des achats:**
- `FARM_PURCHASES_READ` : Lire les achats
- `FARM_PURCHASES_CREATE` : Créer des achats
- `FARM_PURCHASES_UPDATE` : Modifier des achats
- `FARM_PURCHASES_DELETE` : Supprimer des achats

**Gestion des livres généalogiques:**
- `FARM_HERDBOOK_READ` : Lire les livres généalogiques
- `FARM_HERDBOOK_CREATE` : Créer des livres généalogiques
- `FARM_HERDBOOK_UPDATE` : Modifier des livres généalogiques
- `FARM_HERDBOOK_DELETE` : Supprimer des livres généalogiques

**Gestion des fournisseurs:**
- `FARM_SUPPLIERS_READ` : Lire les fournisseurs
- `FARM_SUPPLIERS_CREATE` : Créer des fournisseurs
- `FARM_SUPPLIERS_UPDATE` : Modifier des fournisseurs
- `FARM_SUPPLIERS_DELETE` : Supprimer des fournisseurs

**Gestion des vétérinaires:**
- `FARM_VETERINARIANS_READ` : Lire les vétérinaires
- `FARM_VETERINARIANS_CREATE` : Créer des vétérinaires
- `FARM_VETERINARIANS_UPDATE` : Modifier des vétérinaires
- `FARM_VETERINARIANS_DELETE` : Supprimer des vétérinaires

### Rôles par Défaut

#### Platform Roles

**SUPER_ADMIN**
- Accès complet à la plateforme
- Toutes les permissions Platform
- Aucune permission Farm

**SUPPORT**
- Accès lecture seule pour le support
- Permissions lecture Platform uniquement

**AUDITOR**
- Accès lecture seule pour l'audit
- Permissions audit uniquement

#### Farm Roles

**OWNER**
- Accès complet à l'exploitation
- Toutes les permissions Farm
- Aucune permission Platform

**FARM_ADMIN**
- Accès complet à la gestion de l'exploitation
- Toutes les permissions Farm

**VETERINARIAN**
- Accès aux opérations vétérinaires
- Permissions lecture/écriture limitées aux traitements et événements

**EMPLOYEE**
- Accès aux opérations de base
- Permissions lecture/écriture limitées

**VIEWER**
- Accès lecture seule
- Permissions lecture Farm uniquement

## Utilisation

### Décorateur @RequirePermissions

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { FarmPermissions } from '../rbac/constants/permissions.constant';

@Controller('cattle')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CattleController {
  @Get()
  @RequirePermissions(FarmPermissions.FARM_CATTLE_READ)
  async findAll() {
    // ...
  }

  @Post()
  @RequirePermissions(FarmPermissions.FARM_CATTLE_CREATE)
  async create() {
    // ...
  }

  @Put(':id')
  @RequirePermissions(
    FarmPermissions.FARM_CATTLE_READ,
    FarmPermissions.FARM_CATTLE_UPDATE
  )
  async update() {
    // ...
  }
}
```

### PermissionsService

```typescript
import { PermissionsService } from '../rbac/services/permissions.service';

@Injectable()
export class SomeService {
  constructor(private readonly permissionsService: PermissionsService) {}

  async someMethod(userId: string) {
    // Vérifier si l'utilisateur a une permission spécifique
    const canRead = await this.permissionsService.hasPermission(
      userId,
      'FARM_CATTLE_READ'
    );

    // Vérifier si l'utilisateur a toutes les permissions requises
    const hasAll = await this.permissionsService.hasAllPermissions(
      userId,
      ['FARM_CATTLE_READ', 'FARM_CATTLE_CREATE']
    );

    // Vérifier si l'utilisateur a au moins une des permissions
    const hasAny = await this.permissionsService.hasAnyPermission(
      userId,
      ['FARM_CATTLE_READ', 'FARM_CATTLE_CREATE']
    );

    // Obtenir toutes les permissions de l'utilisateur
    const permissions = await this.permissionsService.getUserPermissions(userId);
  }
}
```

### Seed RBAC

```typescript
import { RbacSeedService } from '../rbac/services/rbac-seed.service';

// Dans un script de migration ou un command
async function seedRbac() {
  const rbacSeedService = app.get(RbacSeedService);
  await rbacSeedService.seedAll();
}
```

## Migration Progressive

### Phase 1 : Coexistence (PR actuelle)
- Le système RBAC est implémenté
- Les anciens mécanismes basés sur les rôles continuent de fonctionner
- Les nouveaux contrôleurs peuvent utiliser le système RBAC
- Les contrôleurs existants ne sont pas modifiés

### Phase 2 : Migration des contrôleurs
- Migrer progressivement les contrôleurs vers le nouveau système
- Commencer par les nouveaux contrôleurs Platform
- Puis migrer les contrôleurs Farm
- Tester chaque migration indépendamment

### Phase 3 : Nettoyage
- Une fois tous les contrôleurs migrés
- Supprimer les anciens mécanismes basés sur les rôles
- Nettoyer le code obsolète

## Ajouter une Nouvelle Permission

1. **Ajouter la permission au constant:**
```typescript
// src/modules/rbac/constants/permissions.constant.ts
export enum FarmPermissions {
  // ... permissions existantes
  FARM_NEW_PERMISSION = 'FARM_NEW_PERMISSION',
}
```

2. **Ajouter le nom de la permission:**
```typescript
export const PERMISSION_NAMES: Record<string, string> = {
  // ... noms existants
  [FarmPermissions.FARM_NEW_PERMISSION]: 'Description de la nouvelle permission',
};
```

3. **Exécuter le seed:**
```typescript
await rbacSeedService.seedAll();
```

4. **Associer la permission aux rôles appropriés:**
```typescript
// src/modules/rbac/constants/roles.constant.ts
{
  code: RoleCode.OWNER,
  permissions: [
    // ... permissions existantes
    FarmPermissions.FARM_NEW_PERMISSION,
  ],
}
```

## Créer un Nouveau Rôle

1. **Ajouter le code du rôle:**
```typescript
// src/modules/rbac/constants/roles.constant.ts
export enum RoleCode {
  // ... rôles existants
  NEW_ROLE = 'NEW_ROLE',
}
```

2. **Définir le rôle avec ses permissions:**
```typescript
export const DEFAULT_ROLES = [
  // ... rôles existants
  {
    code: RoleCode.NEW_ROLE,
    name: 'New Role Name',
    description: 'Description du nouveau rôle',
    domain: 'FARM' as const,
    permissions: [
      FarmPermissions.FARM_DASHBOARD_READ,
      FarmPermissions.FARM_CATTLE_READ,
      // ... autres permissions
    ],
  },
];
```

3. **Exécuter le seed:**
```typescript
await rbacSeedService.seedAll();
```

## Tests

### Tests Unitaires

Les tests couvrent :
- Récupération des permissions d'un utilisateur
- Vérification des permissions (hasPermission, hasAllPermissions, hasAnyPermission)
- PermissionsGuard
- Décorateur RequirePermissions
- Attribution des rôles
- Seed

### Exécuter les tests

```bash
npm test -- rbac
```

## Sécurité

### Authentification
- ✅ JWT : Non modifié
- ✅ Refresh Token : Non modifié
- ✅ Cookies : Non modifiés
- ✅ Login : Non modifié

### Autorisation
- Nouveau système RBAC implémenté
- Ancien système basé sur les rôles toujours fonctionnel
- Coexistence des deux systèmes pendant la migration

## Base de Données

### Migration

La migration `CreateRBACTables` crée les tables suivantes :
- `permissions`
- `roles`
- `role_permissions`
- `user_roles`

### Index

- `idx_permissions_code` : Index sur permissions.code
- `idx_permissions_domain` : Index sur permissions.domain
- `idx_roles_code` : Index sur roles.code
- `idx_roles_domain` : Index sur roles.domain
- `idx_role_permissions_unique` : Index unique sur (role_id, permission_id)
- `idx_role_permissions_role_id` : Index sur role_permissions.role_id
- `idx_role_permissions_permission_id` : Index sur role_permissions.permission_id
- `idx_user_roles_unique` : Index unique sur (user_id, role_id)
- `idx_user_roles_user_id` : Index sur user_roles.user_id
- `idx_user_roles_role_id` : Index sur user_roles.role_id

### Clés Étrangères

- `role_permissions.role_id` → `roles.id` (CASCADE)
- `role_permissions.permission_id` → `permissions.id` (CASCADE)
- `user_roles.role_id` → `roles.id` (CASCADE)

## Configuration

### app.module.ts

Le module RBAC est ajouté à l'application :

```typescript
import { RbacModule } from './modules/rbac/rbac.module';

@Module({
  imports: [
    // ... autres modules
    RbacModule,
  ],
})
export class AppModule {}
```

## Points Restant à Migrer

Les points suivants doivent encore être migrés vers le nouveau système RBAC :

- [ ] Contrôleurs Platform (organizations, users)
- [ ] Contrôleurs Farm (cattle, events, treatments, etc.)
- [ ] Guards existants basés sur les rôles
- [ ] Décorateurs de rôles existants
- [ ] Logique métier utilisant directement les rôles

## Livrables

À la fin de cette PR :

- ✅ Système RBAC complet et extensible
- ✅ Entités `Role`, `Permission`, `RolePermission` et `UserRole`
- ✅ Migrations TypeORM
- ✅ Seeds d'initialisation
- ✅ `PermissionsGuard`
- ✅ Décorateur `@RequirePermissions(...)`
- ✅ Service central de gestion des permissions
- ✅ Tests unitaires complets
- ✅ Documentation technique
- ✅ Intégration dans app.module.ts
- ✅ Compatibilité avec le système existant

L'application est prête à migrer progressivement tous les contrôles d'accès vers les permissions, sans régression fonctionnelle.
