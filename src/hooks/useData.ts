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
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);
        const data = await dbService.getWasteRequests(user.uid);
        setRequests(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch waste requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
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