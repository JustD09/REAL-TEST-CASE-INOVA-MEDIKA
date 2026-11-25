import { create } from 'zustand';

export const useQueueStore = create((set, get) => ({
  queues: {},
  loading: false,
  lastUpdated: null,

  setQueues: (queues) => {
    set({ queues, lastUpdated: Date.now() });
  },

  updateQueue: (poliId, queueData) => {
    set((state) => ({
      queues: { ...state.queues, [poliId]: { ...state.queues[poliId], ...queueData } },
      lastUpdated: Date.now(),
    }));
  },

  setLoading: (loading) => {
    set({ loading });
  },

  getQueue: (poliId) => {
    return get().queues[poliId] || null;
  },

  getAllQueues: () => {
    return get().queues;
  },
}));