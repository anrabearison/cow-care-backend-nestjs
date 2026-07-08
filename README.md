# Ombiko Cow Care Backend - NestJS

Backend API for the Ombiko bovine herd management application, including the health assistant chatbot.

## Prérequis

- Node.js 18+
- PostgreSQL
- npm

## Installation

```bash
npm install
cp .env.example .env
```

## Configuration

Vérifiez que les valeurs suivantes sont définies dans votre fichier `.env` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cow_care_db
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
VOYAGE_API_KEY=your-voyage-ai-api-key
```

Le backend expose un assistant santé IA via l’endpoint suivant :

```http
POST /api/health/chat
```

Le payload attendu contient :

```json
{
  "question": "Ma vache a de la fièvre",
  "animalId": "uuid-de-l-animal",
  "history": []
}
```

L’API attend un JWT valide et retourne une réponse structurée avec un niveau de gravité et un score de confiance.

## Démarrage

```bash
# développement
npm run start

# mode watch
npm run start:dev

# production
npm run start:prod
```

## Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Documentation API

La documentation Swagger est disponible à l’adresse `/api/docs` lorsque l’application tourne.

