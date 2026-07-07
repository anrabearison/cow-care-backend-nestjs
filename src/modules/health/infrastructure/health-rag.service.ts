import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface KnowledgeChunk {
  id: string;
  disease: string;
  section: string;
  content: string;
  source: string;
  url: string;
  similarity: number;
}

@Injectable()
export class HealthRagService {
  private readonly logger = new Logger(HealthRagService.name);
  private supabase: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;
  private readonly voyageApiKey: string;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    this.supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    this.voyageApiKey = this.configService.get<string>('VOYAGE_API_KEY');

    if (!this.supabaseUrl || !this.supabaseKey) {
      this.logger.warn('Supabase credentials not configured. RAG will be disabled.');
    } else {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    if (!this.voyageApiKey) {
      this.logger.warn('Voyage AI API key not configured. Embeddings will be disabled.');
    }
  }

  async searchRelevantKnowledge(query: string, topK: number = 5): Promise<KnowledgeChunk[]> {
    if (!this.supabase || !this.voyageApiKey) {
      this.logger.warn('RAG not properly configured, returning empty results');
      return [];
    }

    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);

      // Search in Supabase using pgvector
      const { data, error } = await this.supabase.rpc('search_health_knowledge', {
        query_embedding: embedding,
        result_count: topK,
        similarity_threshold: 0.7
      });

      if (error) {
        this.logger.error('Error searching knowledge base:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in RAG search:', error);
      return [];
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.voyageApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'voyage-3',
          input_type: 'query',
        }),
      });

      if (!response.ok) {
        throw new Error(`Voyage AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  formatForPrompt(chunks: KnowledgeChunk[]): string {
    if (!chunks || chunks.length === 0) {
      return 'No relevant information found in the knowledge base.';
    }

    return chunks
      .map(chunk => `[${chunk.disease} - ${chunk.section}]\n${chunk.content}\nSource: ${chunk.source}`)
      .join('\n\n---\n\n');
  }
}
