import { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { WasteRequest, ImpactMetrics, Voucher, RewardTransaction } from '../types';
import { useAuth } from './useAuth';

// Prevent circular dependency

export const useWasteRequests = () => {
  const [requests, setRequests] = useState<WasteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = dbService.subscribeToWasteRequestsForPartner(user.uid, (data) => {
      setRequests(data);
      setLoading(false);
      setUpdateCount(prev => prev + 1);
    });

    const interval = setInterval(() => {
      setUpdateCount(prev => prev + 1);
    }, 20000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  const refreshRequests = async () => {
    if (!user) return;
    try {
      const data = await dbService.getWasteRequests(user.uid);
      setRequests(data);
    } catch (err) {
      console.error('Failed to refresh waste requests:', err);
    }
  };

  return { requests, loading, error, refreshRequests, streamActive: true, updateCount };
};

export const useImpactMetrics = () => {
  const [metrics, setMetrics] = useState<ImpactMetrics>({ wasteProcessed: 0, co2Reduction: 0 });
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const { user } = useAuth();
  const { requests } = useWasteRequests();

  useEffect(() => {
    if (!user) {
      setMetrics({ wasteProcessed: 0, co2Reduction: 0 });
      setLoading(false);
      return;
    }

    // Calculate metrics from completed requests in real-time
    const completedRequests = requests.filter(r => (r.status || '').toLowerCase() === 'completed');
    const totalWaste = completedRequests.reduce((sum, req) => {
      const quantity = parseFloat(req.quantity) || 0;
      return sum + quantity;
    }, 0);
    const totalCO2 = totalWaste * 0.3; // 0.3kg CO2 per kg waste

    setMetrics({
      wasteProcessed: totalWaste,
      co2Reduction: parseFloat(totalCO2.toFixed(2))
    });
    setLoading(false);
  }, [user, requests]);

  return { metrics, loading, error };
};

export const useVouchers = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const data = await dbService.getVouchers();
        setVouchers(data);
      } catch (err) {
        console.error('Failed to fetch vouchers:', err);
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
  const [error] = useState<string | null>(null);
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
      } catch (err) {
        console.error('Failed to fetch reward transactions:', err);
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
  const [error] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = dbService.subscribeToWasteRequests((data) => {
      setRequests(data);
      setLoading(false);
    });

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 20000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshKey]);

  return { requests, loading, error };
};