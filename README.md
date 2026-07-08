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

## Health Knowledge Base (RAG)

The health assistant uses a Retrieval-Augmented Generation (RAG) system powered by Supabase with pgvector and Voyage AI embeddings.

### Knowledge Sources

The knowledge base is built from veterinary information restructured and reformulated from the following sources:

**CIRAD — Centre de coopération internationale en recherche agronomique pour le développement**
- Sources: agritrop.cirad.fr, researchgate.net
- Files: `enterite_epizootique_zebu.json`, `charbon_bacteridien.json`, `tuberculose_bovine.json`, `leptospirose_salmonellose_hydatidose.json`, `vibriose_bovine.json`

**Merck Veterinary Manual**
- Source: merckvetmanual.com
- Files: `mammite_bovine.json`, `dystocie_velage.json`, `vaginite_bovine.json`

**NADIS — National Animal Disease Information Service**
- Source: nadis.org.uk
- Files: `dystocie_velage.json` (supplement)

**SDSU Extension / BeefResearch.ca — South Dakota State University Extension**
- Source: extension.sdstate.edu
- Files: `entorse_boiterie_traumatique.json`

**UF/IFAS Extension / Lethbridge Animal Clinic — University of Florida**
- Source: blogs.ifas.ufl.edu
- Files: `plaies_ouvertes.json`

**Important Note**: The JSON file content is not a direct copy of the sources. It is a restructuring and reformulation of the content found online, organized by disease and thematic sections (symptoms, risk factors, recommendations, etc.), with medication mentions and dosages intentionally removed. Original URLs are preserved in each JSON file's `url` field for traceability.

### JSON File Structure

The ingestion script supports two JSON formats:

**Format 1: Simple (one disease per file)**
```json
{
  "disease": "Mammite bovine",
  "source": "Merck Veterinary Manual",
  "url": "https://www.merckvetmanual.com/...",
  "zoonosis_alert": false,
  "sections": [
    {
      "section": "Symptômes",
      "content": "Le pis est chaud, douloureux et enflé..."
    }
  ]
}
```

**Format 2: Multi-disease (multiple diseases in one file)**
```json
{
  "diseases": [
    {
      "disease": "Leptospirose",
      "source": "CIRAD",
      "url": "https://agritrop.cirad.fr/...",
      "zoonosis_alert": true,
      "sections": [
        {
          "section": "Symptômes",
          "content": "Fièvre, jaunisse, avortement..."
        }
      ]
    }
  ]
}
```

**Field descriptions:**
- `disease`: Disease name (required)
- `sections`: Array of thematic sections (required)
- `section`: Section title (e.g., "Symptômes")
- `content`: Section text content
- `source`: Source name (e.g., "Merck Veterinary Manual")
- `url`: Single source URL
- `urls`: Array of source URLs (if multiple sources)
- `zoonosis_alert`: Boolean (true if zoonotic disease)

### Ingestion Script

To populate the health knowledge base in Supabase:

1. Create the knowledge directory:
```bash
mkdir -p health_knowledge
```

2. Add your JSON knowledge files to the `health_knowledge/` directory

3. Run the ingestion script:
```bash
npx ts-node scripts/health-knowledge-ingestion.ts
```

The script will:
- Read all JSON files from the knowledge directory
- Generate embeddings using Voyage AI (voyage-3 model)
- Insert the data into the `health_knowledge` table in Supabase
- Clear existing data before re-insertion to avoid duplicates

**Required environment variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (service_role key, not anon key)
- `VOYAGE_API_KEY`

Run the script once to populate the database, and again whenever you add or modify knowledge JSON files.

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

