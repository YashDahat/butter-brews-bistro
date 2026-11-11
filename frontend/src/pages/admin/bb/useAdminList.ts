import { useQuery, useQueryClient } from '@tanstack/react-query';

/** Tiny helper: one admin list query + a refresh that also nudges the public views. */
export function useAdminList<T>(key: string, fn: () => Promise<T[]>) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['bb-admin', key], queryFn: fn });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['bb-admin', key] });
    qc.invalidateQueries({ queryKey: ['bb'] });
  };
  return { ...q, refresh };
}
