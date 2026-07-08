/**
 * Animal Health Knowledge Base Ingestion Script
 *
 * This script reads all JSON files from the `health_knowledge/` directory,
 * generates embeddings for each section, and inserts them into Supabase.
 *
 * Execute ONCE to populate the database, then again whenever you add or
 * modify knowledge JSON files.
 *
 * Usage: npx ts-node scripts/health-knowledge-ingestion.ts
 *
 * Required environment variables (.env):
 *   SUPABASE_URL=
 *   SUPABASE_SERVICE_KEY=        (service_role key, not anon key - required for inserts)
 *   VOYAGE_API_KEY=
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

interface SectionToIngest {
  disease: string;
  section: string;
  content: string;
  source: string;
  url: string;
  zoonosisAlert: boolean;
}

interface DiseaseBlock {
  disease: string;
  sections: Array<{ section: string; content: string }>;
  source: string;
  url?: string;
  urls?: string[];
  zoonosis_alert?: boolean;
}

interface KnowledgeFile {
  disease?: string;
  sections?: Array<{ section: string; content: string }>;
  source?: string;
  url?: string;
  urls?: string[];
  zoonosis_alert?: boolean;
  diseases?: DiseaseBlock[];
}

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const KNOWLEDGE_DIR = path.join(__dirname, '../health_knowledge');
const EMBEDDING_MODEL = 'voyage-3'; // Voyage AI model, dimension 1024 — consistent with SQL migration
const TABLE_NAME = 'health_knowledge';

/**
 * Reads a knowledge JSON file and extracts all sections to ingest.
 * Handles two formats found in the knowledge base:
 *   - simple format: { disease, sections: [...] }
 *   - multi-disease format: { diseases: [{ disease, sections: [...] }, ...] }
 */
function extractSections(filePath: string): SectionToIngest[] {
  const content: KnowledgeFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const sections: SectionToIngest[] = [];

  const processDiseaseBlock = (block: DiseaseBlock) => {
    const url = block.url ?? (block.urls ? block.urls[0] : '');
    for (const s of block.sections) {
      sections.push({
        disease: block.disease,
        section: s.section,
        content: s.content,
        source: block.source,
        url,
        zoonosisAlert: block.zoonosis_alert ?? false,
      });
    }
  };

  if (content.diseases) {
    // multi-disease file (e.g., leptospirose_salmonellose_hydatidose.json)
    for (const block of content.diseases) {
      processDiseaseBlock(block);
    }
  } else if (content.disease && content.sections) {
    // simple format, one disease per file
    processDiseaseBlock(content as DiseaseBlock);
  }

  return sections;
}

/**
 * Calls Voyage AI API to generate embeddings for a batch of texts.
 * Voyage accepts multiple texts per call, which_limits the number of requests.
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      input_type: 'document', // signals to Voyage that these are documents to index (not a query)
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voyage AI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

/**
 * Splits an array into batches of fixed size (to respect API limits).
 */
function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Clears the existing table before re-inserting (avoids duplicates if script is re-run).
 */
async function clearTable(): Promise<void> {
  console.log('Clearing existing table...');
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error clearing table:', error);
    throw error;
  }
  console.log('Table cleared successfully.');
}

/**
 * Main ingestion function.
 */
async function main(): Promise<void> {
  console.log('Reading knowledge files...');

  // Check if knowledge directory exists
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Knowledge directory not found: ${KNOWLEDGE_DIR}`);
    console.error('Please create the directory and add JSON knowledge files.');
    process.exit(1);
  }

  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.warn('No JSON files found in knowledge directory.');
    return;
  }

  let allSections: SectionToIngest[] = [];
  for (const file of files) {
    const sections = extractSections(path.join(KNOWLEDGE_DIR, file));
    allSections = allSections.concat(sections);
    console.log(`  ${file} -> ${sections.length} sections`);
  }

  console.log(`\nTotal: ${allSections.length} sections to ingest.\n`);

  // Clear existing data
  await clearTable();

  const BATCH_SIZE = 20; // Voyage AI accepts batches; 20 is conservative
  const batches = batchArray(allSections, BATCH_SIZE);

  for (const [index, batch] of batches.entries()) {
    console.log(`Processing batch ${index + 1}/${batches.length}...`);

    const texts = batch.map((s) => s.content);
    const embeddings = await generateEmbeddings(texts);

    const rowsToInsert = batch.map((section, i) => ({
      disease: section.disease,
      section: section.section,
      content: section.content,
      source: section.source,
      url: section.url,
      zoonosis_alert: section.zoonosisAlert,
      embedding: embeddings[i],
    }));

    const { error } = await supabase
      .from(TABLE_NAME)
      .insert(rowsToInsert);

    if (error) {
      console.error('Supabase insertion error:', error);
      throw error;
    }

    console.log(`  Inserted ${rowsToInsert.length} rows.`);
  }

  console.log('\nIngestion completed successfully.');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
