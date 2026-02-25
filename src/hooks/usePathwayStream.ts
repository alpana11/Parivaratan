import { useState, useEffect } from 'react';
import { pathwayService, PathwayStreamAnalytics, PathwayLLMInsights } from '../services/pathwayService';

/**
 * React Hook for Pathway Streaming Analytics
 * Fetches real-time data from Pathway Python backend
 */
export const usePathwayStream = (refreshInterval: number = 5000) => {
  const [analytics, setAnalytics] = useState<PathwayStreamAnalytics | null>(null);
  const [insights, setInsights] = useState<PathwayLLMInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchPathwayData = async () => {
      try {
        // Check if Pathway backend is running
        const isHealthy = await pathwayService.healthCheck();
        if (!isHealthy) {
          setError('Pathway backend not running');
          setStreamActive(false);
          return;
        }

        // Fetch streaming analytics
        const analyticsData = await pathwayService.getStreamingAnalytics();
        setAnalytics(analyticsData);

        // Fetch LLM insights
        const insightsData = await pathwayService.getLLMInsights();
        setInsights(insightsData);

        setStreamActive(true);
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pathway fetch error');
        setStreamActive(false);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPathwayData();

    // Set up polling for real-time updates
    intervalId = setInterval(fetchPathwayData, refreshInterval);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshInterval]);

  const refresh = async () => {
    setLoading(true);
    await pathwayService.refreshPipeline();
    setLoading(false);
  };

  return {
    analytics,
    insights,
    loading,
    error,
    streamActive,
    refresh
  };
};
