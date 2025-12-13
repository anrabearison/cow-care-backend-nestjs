# Ombiko Cow Care Backend - NestJS

Backend API for Ombiko Cow Care application, migrated from FastAPI to NestJS.

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL
- npm

## Installation

```bash
$ npm install
```

## Configuration

Copy `.env.example` to `.env` and update the values:

```bash
$ cp .env.example .env
```

Ensure your PostgreSQL database is running and the credentials in `.env` are correct.

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

Swagger documentation is available at `/api/docs` when the server is running.

## Migration from FastAPI

This project replaces the previous FastAPI backend. It uses the same database schema and provides compatible API endpoints.
See [MIGRATION.md](MIGRATION.md) for details.
