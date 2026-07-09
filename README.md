# Ombiko Cow Care Backend - NestJS

Backend API for the Ombiko bovine herd management application, including the health assistant chatbot.

## Quick Start

```bash
# Installation
npm install
cp .env.example .env

# Setup database
npm run migration:run
npm run seed

# Start development server
npm run start:dev
```

## Documentation

- 📖 [Documentation technique complète](../DOCUMENTATION_PROJET.md)
- 🌐 [API Documentation](http://localhost:3000/api/docs)
- 🎨 [Frontend README](../ombiko-frontend/README.md)

## Prérequis

- Node.js 18+
- PostgreSQL
- npm

## Fonctionnalités principales

- **Gestion de troupeau** : CRUD complet, généalogie, photos
- **Assistant IA santé** : Chatbot RAG avec Gemini pour l'aide au diagnostic
- **Suivi médical** : Événements, traitements, médicaments
- **Passport sanitaire** : Document administratif indispensable pour le transfert des animaux d'un arrondissement à l'autre
- **Multi-utilisateurs** : Rôles et permissions
- **Tableau de bord** : Statistiques et indicateurs

## Configuration

Variables d'environnement requises dans `.env` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cow_care_db
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
VOYAGE_API_KEY=your-voyage-ai-api-key
```

## Scripts utiles

```bash
# Développement
npm run start:dev      # Mode watch
npm run start:debug    # Mode debug

# Production
npm run build
npm run start:prod

# Base de données
npm run migration:generate  # Générer migration
npm run migration:run        # Exécuter migrations
npm run migration:revert     # Annuler dernière migration
npm run seed                 # Charger données de test

# Tests
npm run test          # Tests unitaires
npm run test:e2e      # Tests end-to-end
npm run test:cov      # Couverture de code
```

## Ingestion des connaissances vétérinaires

```bash
npx ts-node scripts/health-knowledge-ingestion.ts
```

*Voir la documentation technique pour les détails sur la structure des fichiers JSON et la base de connaissances.*

## Contributing

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonction`)
3. Commit (`git commit -am 'Ajout de ma fonction'`)
4. Push (`git push origin feature/ma-fonction`)
5. Ouvrir une Pull Request

## Licence

Propriétaire - Ombiko

