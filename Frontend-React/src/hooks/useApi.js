import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodeApi, api } from '../api/axios';
import { handleApiError } from '../api/axios';

export function useNodeQuery(key, url, params, options = {}) {
  return useQuery({
    queryKey: [...key, params],
    queryFn: async () => {
      const { data } = await nodeApi.get(url, { params });
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    ...options,
  });
}

export function useYiiQuery(key, url, params, options = {}) {
  return useQuery({
    queryKey: [...key, params],
    queryFn: async () => {
      const { data } = await api.get(url, { params });
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    ...options,
  });
}

export function useNodeMutation(url, method = 'post', options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const { data: response } = await nodeApi[method](url, data);
      return response.data;
    },
    onError: (error) => {
      const message = handleApiError(error);
      throw new Error(message);
    },
    onSuccess: () => {
      options.invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    ...options,
  });
}

export function useYiiMutation(url, method = 'post', options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const { data: response } = await api[method](url, data);
      return response.data;
    },
    onError: (error) => {
      const message = handleApiError(error);
      throw new Error(message);
    },
    onSuccess: () => {
      options.invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    ...options,
  });
}