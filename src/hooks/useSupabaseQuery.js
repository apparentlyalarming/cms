import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseQuery(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error, refetch: () => {} };
}

export async function getUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}
