# API Route Organization

## Overview

The Ombiko API is organized into two main domains: **Platform** and **Farm**. All API endpoints are prefixed with their respective domain to provide clear separation and better organization.

## Base URL

```
https://api.ombiko.com/api/v1
```

## Route Prefixes

### Platform Domain (`/platform`)

Platform-related endpoints manage user accounts, organizations, authentication, and reference data shared across the platform.

| Module | Route Prefix | Swagger Tag | Description |
|--------|--------------|-------------|-------------|
| Auth | `/platform/auth` | Platform - Auth | Authentication (login, logout, refresh, sessions, OAuth) |
| Invitations | `/platform/invitations` | Platform - Invitations | User invitation management |
| Users | `/platform/users` | Platform - Users | User account management |
| Organizations | `/platform/organizations` | Platform - Organizations | Organization management |
| Owners | `/platform/owners` | Platform - Owners | Owner account management |
| Dashboard | `/platform/dashboard` | Platform - Dashboard | Platform-level dashboard statistics |
| Reference Data | `/platform/reference-data` | Platform - Reference Data | General reference data endpoints |
| Breeds | `/platform/reference-data/breeds` | Platform - Reference Data - Breeds | Cattle breed reference data |
| Vaccines | `/platform/reference-data/vaccines` | Platform - Reference Data - Vaccines | Vaccine reference data |
| Diseases | `/platform/reference-data/diseases` | Platform - Reference Data - Diseases | Disease reference data |

### Farm Domain (`/farm`)

Farm-related endpoints manage day-to-day farm operations, livestock, treatments, and farm-specific data.

| Module | Route Prefix | Swagger Tag | Description |
|--------|--------------|-------------|-------------|
| Cattle | `/farm/cattle` | Farm - Cattle | Cattle/livestock management |
| Events | `/farm/events` | Farm - Events | Farm events tracking |
| Treatments | `/farm/treatments` | Farm - Treatments | Medical treatments management |
| Herd Books | `/farm/herd-books` | Farm - Herd Books | Herd book management |
| Herd Book Cattle | `/farm/herd-book-cattle` | Farm - Herd Book Cattle | Cattle in herd books |
| Purchases | `/farm/purchases` | Farm - Purchases | Purchase management |
| Suppliers | `/farm/suppliers` | Farm - Suppliers | Supplier management |
| Veterinarians | `/farm/veterinarians` | Farm - Veterinarians | Veterinarian management |
| Medicaments | `/farm/medicaments` | Farm - Medicaments | Medication reference data (read-only) |
| Dashboard | `/farm/dashboard` | Farm - Dashboard | Farm-level dashboard statistics |
| Categories | `/farm/categories` | Farm - Categories | Category reference data (read-only) |
| Event Types | `/farm/event-types` | Farm - Event Types | Event type reference data (read-only) |
| Status | `/farm/status` | Farm - Status | Status reference data (read-only) |
| Characters | `/farm/characters` | Farm - Characters | Character reference data (read-only) |
| Passport | `/farm/passport` | Farm - Passport | Cattle passport generation |
| Health | `/farm/health` | Farm - Health | Health chatbot and diagnostics |
| Upload | `/farm/upload` | Farm - Upload | File upload endpoints |
| Exports | `/farm/exports` | Farm - Exports | Data export endpoints |

## Route Examples

### Platform Examples

```bash
# Authentication
POST /api/v1/platform/auth/login
POST /api/v1/platform/auth/logout
POST /api/v1/platform/auth/refresh
GET  /api/v1/platform/auth/me
GET  /api/v1/platform/auth/sessions

# Users
GET    /api/v1/platform/users
POST   /api/v1/platform/users
GET    /api/v1/platform/users/:id
PUT    /api/v1/platform/users/:id
DELETE /api/v1/platform/users/:id

# Organizations
GET    /api/v1/platform/organizations
POST   /api/v1/platform/organizations
GET    /api/v1/platform/organizations/:id
PUT    /api/v1/platform/organizations/:id

# Reference Data
GET /api/v1/platform/reference-data/breeds
POST /api/v1/platform/reference-data/breeds
PUT /api/v1/platform/reference-data/breeds/:id
DELETE /api/v1/platform/reference-data/breeds/:id
GET /api/v1/platform/reference-data/vaccines
POST /api/v1/platform/reference-data/vaccines
PUT /api/v1/platform/reference-data/vaccines/:id
DELETE /api/v1/platform/reference-data/vaccines/:id
GET /api/v1/platform/reference-data/diseases
POST /api/v1/platform/reference-data/diseases
PUT /api/v1/platform/reference-data/diseases/:id
DELETE /api/v1/platform/reference-data/diseases/:id
GET /api/v1/platform/reference-data/medicaments
POST /api/v1/platform/reference-data/medicaments
PUT /api/v1/platform/reference-data/medicaments/:id
DELETE /api/v1/platform/reference-data/medicaments/:id
GET /api/v1/platform/reference-data/categories
POST /api/v1/platform/reference-data/categories
PUT /api/v1/platform/reference-data/categories/:id
DELETE /api/v1/platform/reference-data/categories/:id
GET /api/v1/platform/reference-data/event-types
POST /api/v1/platform/reference-data/event-types
PUT /api/v1/platform/reference-data/event-types/:id
DELETE /api/v1/platform/reference-data/event-types/:id
GET /api/v1/platform/reference-data/statuses
POST /api/v1/platform/reference-data/statuses
PUT /api/v1/platform/reference-data/statuses/:id
DELETE /api/v1/platform/reference-data/statuses/:id
GET /api/v1/platform/reference-data/characters
POST /api/v1/platform/reference-data/characters
PUT /api/v1/platform/reference-data/characters/:id
DELETE /api/v1/platform/reference-data/characters/:id
```

### Farm Examples

```bash
# Cattle
GET    /api/v1/farm/cattle
POST   /api/v1/farm/cattle
GET    /api/v1/farm/cattle/:id
PUT    /api/v1/farm/cattle/:id
DELETE /api/v1/farm/cattle/:id
POST   /api/v1/farm/cattle/:id/birth

# Events
GET    /api/v1/farm/events
POST   /api/v1/farm/events
GET    /api/v1/farm/events/:id
PUT    /api/v1/farm/events/:id
DELETE /api/v1/farm/events/:id

# Treatments
GET    /api/v1/farm/treatments
POST   /api/v1/farm/treatments
GET    /api/v1/farm/treatments/:id
PUT    /api/v1/farm/treatments/:id
DELETE /api/v1/farm/treatments/:id

# Dashboard
GET /api/v1/farm/dashboard/stats
```

## Naming Conventions

### Route Prefixes

- **Platform routes**: Always start with `/platform`
- **Farm routes**: Always start with `/farm`
- **Nested resources**: Use forward slashes to separate levels (e.g., `/platform/reference-data/breeds`)

### Swagger Tags

- **Platform tags**: Format as `Platform - [Module Name]`
- **Farm tags**: Format as `Farm - [Module Name]`
- **Nested modules**: Include parent in tag (e.g., `Platform - Reference Data - Breeds`)

### Controller Decorators

```typescript
// Platform controller example
@ApiTags('Platform - Users')
@ApiBearerAuth()
@Controller('platform/users')
export class UsersController {
  // ...
}

// Farm controller example
@ApiTags('Farm - Cattle')
@ApiBearerAuth()
@Controller('farm/cattle')
export class CattleController {
  // ...
}
```

## Migration Notes

### Breaking Changes

All API routes have been updated to include domain prefixes. Clients must update their API calls to use the new route structure.

### Migration Guide

1. **Update authentication endpoints**:
   - Old: `POST /api/v1/auth/login`
   - New: `POST /api/v1/platform/auth/login`

2. **Update farm operations**:
   - Old: `GET /api/v1/cattle`
   - New: `GET /api/v1/farm/cattle`

3. **Update platform operations**:
   - Old: `GET /api/v1/users`
   - New: `GET /api/v1/platform/users`

### Backward Compatibility

There is **no backward compatibility** maintained for old routes. All clients must migrate to the new route structure.

## Authentication

All endpoints (except login and registration) require authentication via JWT tokens, which can be provided as:
- Bearer token in `Authorization` header
- HttpOnly cookie (recommended for web applications)

Authentication endpoints are under `/platform/auth`.

## Versioning

The API uses URL versioning. The current version is `v1` and is included in the base URL:
```
https://api.ombiko.com/api/v1/...
```

## Error Handling

Standard HTTP status codes are used:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Rate Limiting

Some endpoints have rate limiting applied to prevent abuse. Rate limits are configured per endpoint and are documented in the Swagger documentation.

## Swagger Documentation

Interactive API documentation is available at:
```
https://api.ombiko.com/api/docs
```

The Swagger UI is organized by the domain-based tags (Platform and Farm) for easy navigation.
