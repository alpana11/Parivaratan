// Pathway Streaming Service - Connects React to Pathway Python Backend

const PATHWAY_API_URL = 'http://localhost:8000';

export interface PathwayStreamAnalytics {
  status_counts: Array<{ status: string; count: number; avg_confidence: number }>;
  type_distribution: Array<{ waste_type: string; count: number }>;
  location_stats: Array<{ location: string; request_count: number; avg_confidence: number }>;
  partner_performance: Array<{ partnerId: string; total_requests: number; avg_confidence: number }>;
  overall_stats: Array<{ total_requests: number; avg_confidence: number }>;
  timestamp: string;
  stream_active: boolean;
}

export interface PathwayLLMInsights {
  insights: string[];
  recommendations: string[];
  summary: string;
  timestamp: string;
}

export interface PathwayStreamStatus {
  stream_active: boolean;
  last_update: string;
  total_records: number;
  pipeline_running: boolean;
}

export const pathwayService = {
  /**
   * Get real-time streaming analytics from Pathway pipeline
   */
  async getStreamingAnalytics(): Promise<PathwayStreamAnalytics> {
    try {
      const response = await fetch(`${PATHWAY_API_URL}/stream/analytics`);
      if (!response.ok) throw new Error('Pathway API error');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Pathway streaming error:', error);
      throw error;
    }
  },

  /**
   * Get LLM-powered insights from Pathway + Gemini
   */
  async getLLMInsights(): Promise<PathwayLLMInsights> {
    try {
      const response = await fetch(`${PATHWAY_API_URL}/stream/insights`);
      if (!response.ok) throw new Error('Pathway LLM API error');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Pathway LLM error:', error);
      throw error;
    }
  },

  /**
   * Get Pathway stream health status
   */
  async getStreamStatus(): Promise<PathwayStreamStatus> {
    try {
      const response = await fetch(`${PATHWAY_API_URL}/stream/status`);
      if (!response.ok) throw new Error('Pathway status API error');
      return await response.json();
    } catch (error) {
      console.error('❌ Pathway status error:', error);
      throw error;
    }
  },

  /**
   * Manually refresh Pathway pipeline
   */
  async refreshPipeline(): Promise<void> {
    try {
      const response = await fetch(`${PATHWAY_API_URL}/stream/refresh`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Pathway refresh error');
      console.log('✅ Pathway pipeline refreshed');
    } catch (error) {
      console.error('❌ Pathway refresh error:', error);
      throw error;
    }
  },

  /**
   * Check if Pathway backend is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${PATHWAY_API_URL}/`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};
