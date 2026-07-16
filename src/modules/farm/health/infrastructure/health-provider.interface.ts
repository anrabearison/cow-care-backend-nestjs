export interface HealthAiResponse {
  content: string;
  confidence?: number;
}

export interface HealthAiProvider {
  generateResponse(prompt: string): Promise<HealthAiResponse>;
}
