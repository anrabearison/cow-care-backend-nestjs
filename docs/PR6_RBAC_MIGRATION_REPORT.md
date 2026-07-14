# PR6 – Migration complète des contrôles d'accès vers le système RBAC

## Rapport d'analyse

### Éléments trouvés dans le codebase

#### 1. Décorateur `@Roles` (1 occurrence)
- **Fichier**: `src/modules/passport/passport.controller.ts:103`
- **Usage**: `@Roles(UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN)` sur la méthode `delete()`
- **Statut**: ✅ **MIGRÉ** - Remplacé par `@RequirePermissions(FarmPermissions.FARM_HERDBOOK_DELETE)`

#### 2. Accès direct à `user.role` (29 occurrences)

##### Migrés (9 occurrences):
- **`src/modules/users/users.service.ts`** (10 occurrences)
  - Lignes 41, 48, 53, 55, 75, 80, 82, 101, 113, 121, 159
  - **Statut**: ✅ **MIGRÉ** - Logique d'autorisation basée sur les rôles remplacée par des vérifications de permissions au niveau du contrôleur

- **`src/modules/auth/controllers/invitation.controller.ts`** (1 occurrence)
  - Ligne 22: `if (currentUser.role === UserRole.OWNER_ADMIN)`
  - **Statut**: ✅ **MIGRÉ** - Remplacé par `@RequirePermissions(PlatformPermissions.PLATFORM_INVITATIONS_CREATE)`

- **`src/modules/dashboard/dashboard.service.ts`** (1 occurrence)
  - Ligne 28: `const isSuperAdmin = user.role === UserRole.SUPER_ADMIN`
  - **Statut**: ✅ **MIGRÉ** - Remplacé par `resolveOwnerIdFromUser()` utilitaire

- **`src/modules/herd-book-cattle/herd-book-cattle.service.ts`** (2 occurrences)
  - Lignes 21, 124: `userRole: user.role`
  - **Statut**: ✅ **MIGRÉ** - Remplacé par filtrage via `organizationId`

##### Conservés (20 occurrences):
- **`src/modules/auth/auth.service.ts`** (3 occurrences)
  - Lignes 156, 212, 360: Inclusion du rôle dans le JWT payload
  - **Justification**: Le rôle est nécessaire pour le token JWT et l'identification utilisateur
  - **Statut**: 🟢 **CONSERVÉ** - Donnée d'identité, pas contrôle d'accès

- **`src/modules/auth/guards/roles.guard.ts`** (1 occurrence)
  - Ligne 19: Implémentation du guard legacy
  - **Justification**: Gardé temporairement pour compatibilité, à déprécier après migration complète
  - **Statut**: 🟡 **TEMPORAIRE** - À supprimer dans PR future

- **`src/modules/auth/guards/super-admin.guard.ts`** (1 occurrence)
  - Ligne 13: Implémentation du guard legacy
  - **Justification**: Gardé temporairement pour compatibilité, à déprécier après migration complète
  - **Statut**: 🟡 **TEMPORAIRE** - À supprimer dans PR future

- **`src/common/utils/rbac.util.ts`** (1 occurrence)
  - Ligne 20: `if (user.role === UserRole.SUPER_ADMIN)`
  - **Justification**: Fonction utilitaire pour résolution ownerId, nécessaire pour la logique métier
  - **Statut**: 🟢 **CONSERVÉ** - Logique métier, pas contrôle d'accès

- **`src/modules/users/users.repository.ts`** (2 occurrences)
  - Lignes 50, 54: Filtrage par rôle dans les requêtes
  - **Justification**: Nécessaire pour les requêtes de filtrage, pas un contrôle d'accès
  - **Statut**: 🟢 **CONSERVÉ** - Filtrage de données, pas autorisation

- **`src/modules/users/users.mapper.ts`** (1 occurrence)
  - Ligne 12: Mapping du rôle dans la réponse
  - **Justification**: Donnée exposée dans l'API, pas un contrôle d'accès
  - **Statut**: 🟢 **CONSERVÉ** - Transformation de données

- **Tests** (8 occurrences)
  - `users.service.spec.ts` (2 occurrences)
  - `auth.service.spec.ts` (3 occurrences)
  - `rbac.services.permissions.service.ts` (1 occurrence)
  - **Justification**: Tests validant le comportement, à adapter après migration
  - **Statut**: 🟡 **À METTRE À JOUR** - Tests à adapter

#### 3. Vérifications `if (role === ...)` (13 occurrences)

##### Migrés (10 occurrences):
- **`src/modules/users/users.service.ts`** (10 occurrences)
  - **Statut**: ✅ **MIGRÉ** - Remplacé par permissions au niveau contrôleur

##### Conservés (3 occurrences):
- **`src/common/utils/rbac.util.ts`** (1 occurrence)
  - Ligne 20: Fonction utilitaire
  - **Statut**: 🟢 **CONSERVÉ** - Logique métier

- **`src/modules/auth/controllers/invitation.controller.ts`** (1 occurrence)
  - Ligne 22: Déjà migré
  - **Statut**: ✅ **MIGRÉ**

- **`src/modules/rbac/services/permissions.service.ts`** (1 occurrence)
  - Ligne 36: Vérification si l'utilisateur a des rôles
  - **Justification**: Logique interne du service RBAC
  - **Statut**: 🟢 **CONSERVÉ** - Logique interne RBAC

#### 4. `switch(role)` (0 occurrences)
- Aucune utilisation trouvée

---

## Éléments legacy conservés avec justification

### 1. JWT Payload (auth.service.ts)
**Fichier**: `src/modules/auth/auth.service.ts`
**Lignes**: 156, 212, 360
**Usage**: Inclusion du rôle dans le JWT payload
**Justification**: 
- Nécessaire pour l'identification rapide de l'utilisateur
- Utilisé par les guards legacy pendant la transition
- Peut être utile pour le logging et l'audit
- Donnée d'identité, pas mécanisme d'autorisation
**Statut**: 🟢 **CONSERVÉ DÉFINITIVEMENT**

### 2. Guards Legacy (roles.guard.ts, super-admin.guard.ts)
**Fichiers**: 
- `src/modules/auth/guards/roles.guard.ts`
- `src/modules/auth/guards/super-admin.guard.ts`
**Justification**:
- Certains contrôleurs peuvent encore les utiliser
- Permet une migration progressive
- À déprécier et supprimer dans une PR future
**Statut**: 🟡 **TEMPORAIRE - À SUPPRIMER DANS PR FUTURE**

### 3. Utilitaires RBAC (rbac.util.ts)
**Fichier**: `src/common/utils/rbac.util.ts`
**Ligne**: 20
**Usage**: `resolveOwnerIdFromUser` utilise le rôle pour déterminer l'accès inter-organization
**Justification**:
- Fonction utilitaire réutilisée dans plusieurs services
- Logique métier distincte de l'autorisation
- Nécessaire pour la résolution d'ownerId basée sur le rôle SUPER_ADMIN
**Statut**: 🟢 **CONSERVÉ DÉFINITIVEMENT**

### 4. Repository Filtering (users.repository.ts)
**Fichier**: `src/modules/users/users.repository.ts`
**Lignes**: 50, 54
**Usage**: Filtrage par rôle dans les requêtes
**Justification**:
- Filtrage de données, pas contrôle d'accès
- Les permissions contrôlent l'accès, le repository filtre les résultats
- Séparation des responsabilités
**Statut**: 🟢 **CONSERVÉ DÉFINITIVEMENT**

### 5. Mappers (users.mapper.ts)
**Fichier**: `src/modules/users/users.mapper.ts`
**Ligne**: 12
**Usage**: Transformation de données incluant le rôle
**Justification**:
- Transformation de données, pas autorisation
- Le rôle est une donnée exposée dans l'API
- Nécessaire pour les clients qui utilisent cette information
**Statut**: 🟢 **CONSERVÉ DÉFINITIVEMENT**

---

## Résumé de la migration

### Contrôleurs migrés
- ✅ Passport Controller: `@Roles` → `@RequirePermissions(FarmPermissions.FARM_HERDBOOK_DELETE)`
- ✅ Invitation Controller: `@Roles` + vérifications de rôle → `@RequirePermissions(PlatformPermissions.PLATFORM_INVITATIONS_*)`
- ✅ Users Controller: Ajout de `@RequirePermissions(PlatformPermissions.PLATFORM_USERS_*)`

### Services migrés
- ✅ Users Service: Suppression des vérifications de rôle, conservation de la logique métier
- ✅ Dashboard Service: `user.role === UserRole.SUPER_ADMIN` → `resolveOwnerIdFromUser()`
- ✅ Herd Book Cattle Service: Suppression de `userRole` et `userOwnerId` dans les filtres

### Permissions ajoutées
- ✅ `PLATFORM_INVITATIONS_READ`
- ✅ `PLATFORM_INVITATIONS_CREATE`
- ✅ `PLATFORM_INVITATIONS_DELETE`
- ✅ Mise à jour des rôles par défaut (SUPER_ADMIN, SUPPORT)

### Éléments conservés
- 🟢 JWT payload (donnée d'identité)
- 🟢 Utilitaires RBAC (logique métier)
- 🟢 Repository filtering (filtrage de données)
- 🟢 Mappers (transformation de données)
- 🟡 Guards legacy (temporaire, à supprimer)

---

## Prochaines étapes

### PR7: Nettoyage final
- Supprimer `RolesGuard` et `SuperAdminGuard`
- Supprimer les imports de décorateurs `@Roles`
- Mettre à jour les tests pour utiliser les permissions
- Documenter la migration complète

### PR8: Optimisation
- Cache des permissions dans PermissionsService
- Évaluation des performances après migration
- Optimisation des requêtes si nécessaire
