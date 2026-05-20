import { useState, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { fetchModels } from '@/services/api/tester';

interface UseModelFetcherOptions {
  t: (key: string) => string;
}

export function useModelFetcher({ t }: UseModelFetcherOptions) {
  const [isFetching, setIsFetching] = useState(false);

  const fetch = useCallback(
    async (
      baseUrl: string,
      key: string,
      authHeader: string,
      authPrefix: string,
      queryParamAuth: boolean,
    ) => {
      if (!baseUrl) { toast.error(t('emptyBaseUrl')); return []; }
      setIsFetching(true);
      try {
        const models = await fetchModels(key, baseUrl, authHeader, authPrefix, queryParamAuth);
        if (models.length === 0) {
          toast.error(t('noValidKeysFound'));
        } else {
          toast.success(`${t('detected')} ${models.length} ${t('models')}`);
        }
        return models;
      } catch {
        toast.error(t('networkFailed'));
        return [];
      } finally {
        setIsFetching(false);
      }
    },
    [t],
  );

  return { fetchModels: fetch, isFetching };
}
