import { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { WasteRequest, ImpactMetrics, Voucher, RewardTransaction } from '../types';
import { useAuth } from './useAuth';

export const useWasteRequests = () => {
  const [requests, setRequests] = useState<WasteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('useWasteRequests: User changed:', user?.uid);
    
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // TEMPORARY: Also fetch all requests to compare
    dbService.getAllWasteRequests().then(allRequests => {
      console.log('ALL WASTE REQUESTS IN DATABASE:', allRequests);
      console.log('LOOKING FOR PARTNER ID:', user.uid);
      const matchingRequests = allRequests.filter(req => req.partnerId === user.uid);
      console.log('MATCHING REQUESTS FOR THIS PARTNER:', matchingRequests);
      
      // TEMPORARY FIX: If no matching requests, show all requests for testing
      if (matchingRequests.length === 0 && allRequests.length > 0) {
        console.log('No matching requests found, showing all requests for testing');
        setRequests(allRequests);
        setLoading(false);
      }
    });

    // Set up real-time subscription
    const unsubscribe = dbService.subscribeToWasteRequestsForPartner(user.uid, (data) => {
      console.log('useWasteRequests: Received data for partner', user.uid, ':', data);
      setRequests(data);
      setLoading(false);
    });

    // Cleanup subscription on unmount or user change
    return () => {
      console.log('useWasteRequests: Cleaning up subscription for', user.uid);
      unsubscribe();
    };
  }, [user]);

  const refreshRequests = async () => {
    if (!user) return;
    try {
      const data = await dbService.getWasteRequests(user.uid);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh waste requests');
    }
  };

  return { requests, loading, error, refreshRequests };
};

export const useImpactMetrics = () => {
  const [metrics, setMetrics] = useState<ImpactMetrics>({ wasteProcessed: 0, co2Reduction: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setMetrics({ wasteProcessed: 0, co2Reduction: 0 });
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await dbService.getImpactMetrics(user.uid);
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch impact metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  return { metrics, loading, error };
};

export const useVouchers = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const data = await dbService.getVouchers();
        setVouchers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vouchers');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  return { vouchers, loading, error };
};

export const useRewardTransactions = () => {
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await dbService.getRewardTransactions(user.uid);
        setTransactions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reward transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  return { transactions, loading, error };
};

export const useAdminWasteRequests = () => {
  const [requests, setRequests] = useState<WasteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time subscription for all waste requests (admin)
    const unsubscribe = dbService.subscribeToWasteRequests((data) => {
      setRequests(data);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return { requests, loading, error };
};