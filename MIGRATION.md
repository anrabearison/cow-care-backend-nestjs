# Migration Guide: FastAPI to NestJS

This document outlines the migration of the Ombiko Cow Care Backend from FastAPI to NestJS.

## Overview

The migration aims to preserve all existing functionalities, API endpoints, and database schemas while leveraging NestJS's modular architecture and strong typing.

## Key Changes

### 1. Architecture
- **FastAPI**: Function-based views, Pydantic models, SQLAlchemy ORM.
- **NestJS**: Class-based Controllers, Services, Modules, DTOs with class-validator, TypeORM.

### 2. Database
- The database schema remains unchanged.
- **TypeORM** is used instead of SQLAlchemy.
- Entities in `src/entities` map to existing tables.

### 3. Authentication
- **Passport** and **JWT** are used for authentication.
- Endpoints:
  - `POST /api/v1/auth/login` (replaces `/api/v1/auth/login`)
  - `POST /api/v1/auth/register`
  - `GET /api/v1/auth/me`

### 4. API Compatibility
- All endpoints are prefixed with `/api/v1`.
- Pagination headers `Content-Range` and `X-Total-Count` are included for React Admin compatibility.
- Query parameters (`page`, `per_page`, `sort`, `order`, `q`) are supported.

## Running the New Backend

1. Stop the existing FastAPI backend (running on port 8000).
2. Start the NestJS backend:
   ```bash
   npm run start:dev
   ```
3. The API will be available at `http://localhost:8000`.

## Troubleshooting

- **Port Conflict**: If port 8000 is in use, ensure the old backend is stopped or change `PORT` in `.env`.
- **Database Connection**: Verify `DATABASE_URL` in `.env`.
